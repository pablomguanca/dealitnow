(() => {
  const firebaseConfig = {
    apiKey:            'AIzaSyA4fAtms8k5hOEvtFiTnf6B2ijg2jiWDtg',
    authDomain:        'dealit-7f735.firebaseapp.com',
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

  const persistenceReady = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  let _unsubSnapshots = [];

  const getUser = () => auth.currentUser;
  const getUid  = () => { const u = getUser(); if (!u) throw new Error('No autenticado'); return u.uid; };

  const onAuthChange = callback => auth.onAuthStateChanged(callback);
  const getRedirectResult = () => auth.getRedirectResult();

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

  const signInGoogle = async () => {
    await persistenceReady;
    const provider = new firebase.auth.GoogleAuthProvider();
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

  const signOut = async () => {
    _limpiarSuscripciones();
    await auth.signOut();
  };

  const _colProposals = () => db.collection('proposals');

  const _baseQuery = () =>
    _colProposals()
      .where('userId', '==', getUid())
      .orderBy('createdAt', 'desc');

  const crearPropuesta = async (data) => {
    const uid = getUid();
    const doc = {
      userId:     uid,
      title:      data.title      || '',
      clientName: data.clientName || '',
      amount:     data.amount     || 0,
      status:     'draft',
      theme:      data.theme      || 'elegante-oscuro',
      payload:    data.payload    || {},
      createdAt:  firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
    };
    const ref = await _colProposals().add(doc);
    return ref.id;
  };

  const obtenerPropuesta = async (id) => {
    const snap = await _colProposals().doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (data.userId !== getUid()) return null;
    return { id: snap.id, ...data };
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

  const actualizarPropuesta = async (id, cambios) => {
    const ref = _colProposals().doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== getUid()) {
      throw new Error('Propuesta no encontrada o sin permisos');
    }
    delete cambios.userId;
    delete cambios.createdAt;
    cambios.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await ref.update(cambios);
  };

  const borrarPropuesta = async (id) => {
    const ref = _colProposals().doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== getUid()) {
      throw new Error('Propuesta no encontrada o sin permisos');
    }
    await ref.delete();
  };

  const escucharPropuestas = (callback) => {
    const unsub = _baseQuery().onSnapshot(snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(docs);
    }, err => {
      console.error('Error en snapshot de propuestas:', err);
    });
    _unsubSnapshots.push(unsub);
    return unsub;
  };

  const _limpiarSuscripciones = () => {
    _unsubSnapshots.forEach(fn => fn());
    _unsubSnapshots = [];
  };

  window.AteneaDB = {
    auth: { getUser, getUid, onAuthChange, getRedirectResult, signInGoogle, signIn, signUp, signOut },
    proposals: {
      crear:      crearPropuesta,
      obtener:    obtenerPropuesta,
      listar:     listarPropuestas,
      listarPor:  listarPorEstado,
      actualizar: actualizarPropuesta,
      borrar:     borrarPropuesta,
      escuchar:   escucharPropuestas
    }
  };
})();
