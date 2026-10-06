(() => {
  const firebaseConfig = {
    apiKey:            'AIzaSyA4fAtms8k5hOEvtFiTnf6B2ijg2jiWDtg',
    authDomain:        'dealitnow.vercel.app',
    projectId:         'dealit-7f735',
    storageBucket:     'dealit-7f735.firebasestorage.app',
    messagingSenderId: '837213426465',
    appId:             '1:837213426465:web:91f1c863f453efe950e460'
  };

  const PLACEHOLDER = firebaseConfig.apiKey === 'TU_API_KEY';

  if (PLACEHOLDER) {
    window.AteneaDB = null;
    window.AteneaDBError = new Error('Firebase no está configurado: falta la API key.');
    return;
  }

  if (typeof firebase === 'undefined') {
    window.AteneaDB = null;
    window.AteneaDBError = new Error('El SDK de Firebase no pudo cargarse.');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.error('Firebase no pudo inicializarse:', e);
    window.AteneaDB = null;
    window.AteneaDBError = e;
    return;
  }

  const auth = firebase.auth();
  const db   = firebase.firestore();

  // Caché local en IndexedDB: el editor funciona sin conexión y sincroniza al volver.
  // Tiene que pedirse antes de cualquier otra operación sobre Firestore.
  db.enablePersistence({ synchronizeTabs: true }).catch(e => {
    console.warn('Firestore sin caché local:', e.code || e);
  });

  const persistenceReady = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  let _unsubSnapshots = [];

  const getUser = () => auth.currentUser;
  const getUid  = () => { const u = getUser(); if (!u) throw new Error('No autenticado'); return u.uid; };

  const onAuthChange = callback => auth.onAuthStateChanged(callback);

  const _crearPerfilSiNoExiste = async (user) => {
    const userRef = db.collection('users').doc(user.uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  };

  auth.onAuthStateChanged(user => {
    if (user) _crearPerfilSiNoExiste(user);
  });

  const signInGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return auth.signInWithPopup(provider);
  };

  const signIn = (email, password) => auth.signInWithEmailAndPassword(email, password);

  const signUp = async (email, password, displayName) => {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) await cred.user.updateProfile({ displayName });
    await db.collection('users').doc(cred.user.uid).set({
      email,
      displayName: displayName || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return cred;
  };

  // Al cerrar sesión se borra la caché local para no dejar propuestas en
  // computadoras compartidas. Quien llama debe esperar antes las escrituras pendientes.
  const signOut = async () => {
    _limpiarSuscripciones();
    await auth.signOut();
    try {
      await db.terminate();
      await db.clearPersistence();
    } catch (e) {
      console.warn('No se pudo limpiar la caché local de Firestore:', e);
    }
  };

  const _colProposals = () => db.collection('proposals');

  const _baseQuery = () =>
    _colProposals()
      .where('userId', '==', getUid())
      .orderBy('createdAt', 'desc');

  const ESTADOS = ['draft', 'sent', 'accepted', 'rejected'];
  const LARGO_MAX = 200;

  // Solo estos campos se escriben; userId y createdAt nunca vienen de quien llama.
  const _camposEditables = (data) => {
    const limpio = {};
    if ('title' in data)      limpio.title      = String(data.title ?? '').slice(0, LARGO_MAX);
    if ('clientName' in data) limpio.clientName = String(data.clientName ?? '').slice(0, LARGO_MAX);
    if ('amount' in data)     limpio.amount     = Number.isFinite(data.amount) ? data.amount : 0;
    if ('theme' in data)      limpio.theme      = String(data.theme ?? '');
    if ('payload' in data)    limpio.payload    = data.payload && typeof data.payload === 'object' ? data.payload : {};
    if ('publico' in data)    limpio.publico    = data.publico === true;
    if ('status' in data && ESTADOS.includes(data.status)) limpio.status = data.status;
    return limpio;
  };

  const nuevoIdPropuesta = () => _colProposals().doc().id;

  // El ID se genera en el cliente para poder encolar escrituras antes de que
  // el servidor confirme la creación, incluso sin conexión.
  const crearPropuesta = async (data, id = nuevoIdPropuesta()) => {
    const ahora = firebase.firestore.FieldValue.serverTimestamp();
    await _colProposals().doc(id).set({
      title: '', clientName: '', amount: 0, theme: 'elegante-oscuro', payload: {},
      ..._camposEditables(data),
      status:    'draft',
      userId:    getUid(),
      createdAt: ahora,
      updatedAt: ahora
    });
    return id;
  };

  const obtenerPropuesta = async (id) => {
    const snap = await _colProposals().doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (data.userId !== getUid()) return null;
    return { id: snap.id, ...data };
  };

  // Lectura para el link del cliente: no requiere sesión. Las reglas solo la
  // permiten si la propuesta está marcada como pública (o si la pide su dueño).
  const obtenerPublica = async (id) => {
    try {
      const snap = await _colProposals().doc(id).get();
      return snap.exists ? snap.data().payload || null : null;
    } catch (e) {
      if (e.code === 'permission-denied') return null;
      throw e;
    }
  };

  const listarPropuestas = async (limite = 50) => {
    const snap = await _baseQuery().limit(limite).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const listarPorEstado = async (status, limite = 50) => {
    const snap = await _colProposals()
      .where('userId', '==', getUid())
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(limite)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  // La propiedad la verifican las reglas de Firestore: leer antes de escribir
  // duplicaría el costo y no funcionaría sin conexión.
  const actualizarPropuesta = (id, cambios) =>
    _colProposals().doc(id).update({
      ..._camposEditables(cambios),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

  const borrarPropuesta = (id) => _colProposals().doc(id).delete();

  // Escucha en tiempo real (y desde la caché sin conexión). Las fechas que todavía
  // no confirmó el servidor llegan estimadas en vez de null.
  const escucharPropuestas = (callback, alFallar, limite = 100) => {
    const unsub = _baseQuery().limit(limite).onSnapshot(snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      callback(docs);
    }, err => {
      console.error('Error en snapshot de propuestas:', err);
      if (alFallar) alFallar(err);
    });
    _unsubSnapshots.push(unsub);
    return unsub;
  };

  const _limpiarSuscripciones = () => {
    _unsubSnapshots.forEach(fn => fn());
    _unsubSnapshots = [];
  };

  window.AteneaDB = {
    auth: { getUser, getUid, onAuthChange, signInGoogle, signIn, signUp, signOut },
    proposals: {
      nuevoId:    nuevoIdPropuesta,
      crear:      crearPropuesta,
      obtener:    obtenerPropuesta,
      obtenerPublica,
      listar:     listarPropuestas,
      listarPor:  listarPorEstado,
      actualizar: actualizarPropuesta,
      borrar:     borrarPropuesta,
      escuchar:   escucharPropuestas
    }
  };
})();
