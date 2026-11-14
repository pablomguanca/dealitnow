// Acceso a Firebase (Auth, Firestore, Storage y App Check) para el resto de la app.
// Usa el SDK modular: al paquete solo entra lo que se importa acá.
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  sendPasswordResetEmail,
  updateProfile,
  reload,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  reauthenticateWithCredential as reautenticarConCredencial,
  deleteUser,
  signOut as cerrarSesionAuth
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  terminate,
  clearIndexedDbPersistence
} from 'firebase/firestore';
import {
  getStorage,
  ref as refStorage,
  getDownloadURL,
  uploadBytes,
  listAll,
  deleteObject
} from 'firebase/storage';
import { firebaseConfig, PREFIJO_URL_LOGO } from './firebase-config.js';
import { esAppNativa, tokenGoogleNativo, cerrarSesionGoogleNativa } from './nativo.js';
import { contenidoDelLink } from './planes.js';

const crearAteneaDB = () => {
  if (firebaseConfig.apiKey === 'TU_API_KEY') throw new Error('Firebase no está configurado: falta la API key.');
  const app = initializeApp(firebaseConfig);

  // App Check: certifica que las llamadas a Firestore y Storage salen de esta web y no
  // de un script ajeno. Se activa al completar la clave del sitio de reCAPTCHA Enterprise
  // (Firebase → App Check). En localhost usa un token de depuración que se registra en la consola.
  const APP_CHECK_SITE_KEY = '';
  if (APP_CHECK_SITE_KEY) {
    if (['localhost', '127.0.0.1'].includes(location.hostname)) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
  }

  // La sesión queda guardada en el navegador (IndexedDB) hasta que se cierre.
  const auth = getAuth(app);
  auth.languageCode = 'es'; // emails de verificación y de contraseña en español

  // Caché local en IndexedDB, compartida entre pestañas: el editor funciona sin conexión
  // y sincroniza al volver. Si el navegador no la permite, Firestore sigue en memoria.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });

  const limpiarCacheLocal = async () => {
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
    } catch (e) {
      console.warn('No se pudo limpiar la caché local de Firestore:', e);
    }
  };

  let _unsubSnapshots = [];

  const getUser = () => auth.currentUser;
  const getUid  = () => { const u = getUser(); if (!u) throw new Error('No autenticado'); return u.uid; };

  const onAuthChange = callback => onAuthStateChanged(auth, callback);

  const _crearPerfilSiNoExiste = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp()
      });
    }
  };

  // Perfil (users/{uid}): nombre visible y datos del negocio que se usan por defecto
  // en las propuestas nuevas.
  const CAMPOS_EMISOR = ['nombre', 'rol', 'email', 'telefono', 'web', 'presentacion', 'logo', 'foto', 'ubicacion', 'instagram', 'linkedin', 'behance', 'github'];
  const LARGO_EMISOR = { presentacion: 2000, logo: 1000, foto: 1000 };

  const obtenerPerfil = async () => {
    const snap = await getDoc(doc(db, 'users', getUid()));
    return snap.exists() ? snap.data() : {};
  };

  const guardarPerfil = async ({ displayName, emisor }) => {
    const user = auth.currentUser;
    const nombre = String(displayName ?? '').trim().slice(0, 80);
    const datos = Object.fromEntries(CAMPOS_EMISOR.map(k => [k, String(emisor?.[k] ?? '').trim().slice(0, LARGO_EMISOR[k] || 200)]));
    if (nombre !== (user.displayName || '')) await updateProfile(user, { displayName: nombre });
    await setDoc(doc(db, 'users', user.uid), { email: user.email, displayName: nombre, emisor: datos }, { merge: true });
  };

  onAuthStateChanged(auth, user => {
    if (user) _crearPerfilSiNoExiste(user);
  });

  const signInGoogle = async () => {
    // En la app de Android, Google no deja entrar desde la ventana web: se usa la nativa.
    if (esAppNativa()) return signInWithCredential(auth, GoogleAuthProvider.credential(await tokenGoogleNativo()));
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  };

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // Al volver desde el link del email, Firebase redirige a la web. En la verificación, la
  // vuelta lleva el email (?verificado=), por si el link pasa por la página de Firebase en
  // lugar de /accion: así igual se sabe qué cuenta se verificó (controlador/accion-email.js).
  const _ajustesEmail = email => ({
    url: email ? `${location.origin}/?verificado=${encodeURIComponent(email)}` : `${location.origin}/`
  });

  const enviarVerificacion = () => sendEmailVerification(auth.currentUser, _ajustesEmail(auth.currentUser.email));

  // Después de tocar el link del email hay que recargar el usuario y renovar el
  // token: las reglas de Firestore leen email_verified del token.
  const comprobarVerificacion = async () => {
    await reload(auth.currentUser);
    if (!auth.currentUser.emailVerified) return false;
    await auth.currentUser.getIdToken(true);
    return true;
  };

  // Link del email de verificación (página /accion): verifica y devuelve qué email era.
  const aplicarVerificacion = async codigo => {
    const info = await checkActionCode(auth, codigo);
    await applyActionCode(auth, codigo);
    return info.data.email;
  };

  const recuperarPassword = email => sendPasswordResetEmail(auth, email, _ajustesEmail());

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await sendEmailVerification(cred.user, _ajustesEmail(cred.user.email));
    } catch (e) {
      console.warn('No se pudo enviar el email de verificación:', e); // se puede reenviar desde la app
    }
    if (displayName) await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      displayName: displayName || '',
      createdAt: serverTimestamp()
    });
    return cred;
  };

  // Al cerrar sesión se borra la caché local para no dejar propuestas en
  // computadoras compartidas. Quien llama debe esperar antes las escrituras pendientes.
  const signOut = async () => {
    _limpiarSuscripciones();
    await cerrarSesionAuth(auth);
    await cerrarSesionGoogleNativa();
    await limpiarCacheLocal();
  };

  const _docsDe = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const _colProposals = () => collection(db, 'proposals');

  const _baseQuery = (...filtros) =>
    query(_colProposals(), where('userId', '==', getUid()), ...filtros, orderBy('createdAt', 'desc'));

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

  const nuevoIdPropuesta = () => doc(_colProposals()).id;

  // El ID se genera en el cliente para poder encolar escrituras antes de que
  // el servidor confirme la creación, incluso sin conexión.
  const crearPropuesta = async (data, id = nuevoIdPropuesta()) => {
    const ahora = serverTimestamp();
    await setDoc(doc(_colProposals(), id), {
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
    const snap = await getDoc(doc(_colProposals(), id));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.userId !== getUid()) return null;
    return { id: snap.id, ...data };
  };

  // Lectura para el link del cliente: no requiere sesión. Las reglas solo la
  // permiten si la propuesta está marcada como pública (o si la pide su dueño).
  const obtenerPublica = async (id) => {
    try {
      const snap = await getDoc(doc(_colProposals(), id));
      if (!snap.exists() || !snap.data().payload) return null;
      const { aceptacion, marca } = snap.data();
      return { payload: contenidoDelLink(snap.data()), aceptacion: aceptacion || null, marca: marca === true };
    } catch (e) {
      if (e.code === 'permission-denied') return null;
      throw e;
    }
  };

  const listarPropuestas = async (limite = 50) => _docsDe(await getDocs(query(_baseQuery(), limit(limite))));

  const listarPorEstado = async (status, limite = 50) =>
    _docsDe(await getDocs(query(_baseQuery(where('status', '==', status)), limit(limite))));

  // La propiedad la verifican las reglas de Firestore: leer antes de escribir
  // duplicaría el costo y no funcionaría sin conexión.
  const actualizarPropuesta = (id, cambios) =>
    updateDoc(doc(_colProposals(), id), {
      ..._camposEditables(cambios),
      updatedAt: serverTimestamp()
    });

  // Las versiones guardadas se borran antes: sin la propuesta, las reglas ya no dejarían leerlas.
  const borrarPropuesta = async (id) => {
    await _borrarVersiones('proposals', id);
    await deleteDoc(doc(_colProposals(), id));
  };

  // Escucha en tiempo real (y desde la caché sin conexión). Las fechas que todavía
  // no confirmó el servidor llegan estimadas en vez de null.
  const _escuchar = (consulta, callback, alFallar, etiqueta) => {
    const unsub = onSnapshot(consulta, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      callback(docs);
    }, err => {
      console.error(`Error en snapshot de ${etiqueta}:`, err);
      if (alFallar) alFallar(err);
    });
    _unsubSnapshots.push(unsub);
    return unsub;
  };

  const escucharPropuestas = (callback, alFallar, limite = 100) =>
    _escuchar(query(_baseQuery(), limit(limite)), callback, alFallar, 'propuestas');


  const _colPortfolios = () => collection(db, 'portfolios');

  const _baseQueryPortfolios = () => query(_colPortfolios(), where('userId', '==', getUid()));

  const _camposEditablesPortafolio = (data) => {
    const limpio = {};
    if ('title' in data)        limpio.title        = String(data.title ?? '').slice(0, LARGO_MAX);
    if ('subtitle' in data)     limpio.subtitle     = String(data.subtitle ?? '').slice(0, LARGO_MAX);
    if ('projectCount' in data) limpio.projectCount = Number.isFinite(data.projectCount) ? Math.max(0, Math.round(data.projectCount)) : 0;
    if ('theme' in data)        limpio.theme        = String(data.theme ?? '');
    if ('payload' in data)      limpio.payload      = data.payload && typeof data.payload === 'object' ? data.payload : {};
    if ('publico' in data)      limpio.publico      = data.publico === true;
    return limpio;
  };

  const nuevoIdPortafolio = () => doc(_colPortfolios()).id;

  const crearPortafolio = async (data, id = nuevoIdPortafolio()) => {
    const ahora = serverTimestamp();
    await setDoc(doc(_colPortfolios(), id), {
      title: '', subtitle: '', projectCount: 0, theme: 'elegante-oscuro', payload: {},
      publico: false,
      ..._camposEditablesPortafolio(data),
      userId:    getUid(),
      createdAt: ahora,
      updatedAt: ahora
    });
    return id;
  };

  const obtenerPortafolio = async (id) => {
    const snap = await getDoc(doc(_colPortfolios(), id));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.userId !== getUid()) return null;
    return { id: snap.id, ...data };
  };

  const obtenerPortafolioPublico = async (id) => {
    try {
      const snap = await getDoc(doc(_colPortfolios(), id));
      if (!snap.exists() || !snap.data().payload) return null;
      return { payload: contenidoDelLink(snap.data()), marca: snap.data().marca === true };
    } catch (e) {
      if (e.code === 'permission-denied') return null;
      throw e;
    }
  };

  const listarPortafolios = async (limite = 50) => _docsDe(await getDocs(query(_baseQueryPortfolios(), limit(limite))));

  const actualizarPortafolio = (id, cambios) =>
    updateDoc(doc(_colPortfolios(), id), {
      ..._camposEditablesPortafolio(cambios),
      updatedAt: serverTimestamp()
    });

  const borrarPortafolio = async (id) => {
    await _borrarVersiones('portfolios', id);
    await deleteDoc(doc(_colPortfolios(), id));
  };

  const escucharPortafolios = (callback, alFallar, limite = 100) =>
    _escuchar(query(_baseQueryPortfolios(), limit(limite)), callback, alFallar, 'portafolios');

  // Versiones guardadas de una propuesta o un portfolio ({coleccion}/{id}/versiones): las
  // guarda el dueño a mano, al enviar la propuesta y antes de restaurar otra. Se conservan
  // las últimas VERSIONES_MAX.
  const COLECCIONES_CON_VERSIONES = ['proposals', 'portfolios'];
  const MOTIVOS_VERSION = ['manual', 'enviada', 'antes-de-restaurar'];
  const VERSIONES_MAX = 20;

  const _colVersiones = (coleccion, id) => {
    if (!COLECCIONES_CON_VERSIONES.includes(coleccion)) throw new Error(`Colección sin versiones: ${coleccion}`);
    return collection(db, coleccion, id, 'versiones');
  };

  const listarVersiones = async (coleccion, id) => {
    const snap = await getDocs(query(_colVersiones(coleccion, id), orderBy('createdAt', 'desc'), limit(VERSIONES_MAX + 10)));
    return snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
  };

  const crearVersion = async (coleccion, id, { payload, title, motivo }) => {
    await setDoc(doc(_colVersiones(coleccion, id)), {
      userId: getUid(),
      payload: payload && typeof payload === 'object' ? payload : {},
      title: String(title ?? '').slice(0, LARGO_MAX),
      motivo: MOTIVOS_VERSION.includes(motivo) ? motivo : 'manual',
      createdAt: serverTimestamp()
    });
    const viejas = (await listarVersiones(coleccion, id)).slice(VERSIONES_MAX);
    await Promise.all(viejas.map(v => deleteDoc(doc(_colVersiones(coleccion, id), v.id))));
  };

  const _borrarVersiones = async (coleccion, id) => {
    try {
      await _borrarEnLotes(_colVersiones(coleccion, id));
    } catch (e) {
      console.warn('No se pudieron borrar las versiones guardadas:', e);
    }
  };

  // Plan (Gratis / Pro) y envíos del mes: los escribe solo el servidor (api/activar,
  // api/mercadopago). Acá solo se escucha para mostrar el estado.
  const escucharPlan = (callback) => {
    const unsub = onSnapshot(doc(db, 'planes', getUid()), snap => callback(snap.exists() ? snap.data() : {}), err => {
      console.warn('No se pudo leer el plan:', err);
      callback({});
    });
    _unsubSnapshots.push(unsub);
    return unsub;
  };

  // Datos para cobrar por transferencia: aparte de las propuestas, solo los lee el dueño.
  const obtenerCobro = async () => {
    const snap = await getDoc(doc(db, 'cobros', getUid()));
    return snap.exists() ? snap.data() : null;
  };
  const guardarCobro = ({ titular = '', cbu = '', alias = '' }) =>
    setDoc(doc(db, 'cobros', getUid()), {
      titular: String(titular).slice(0, 120),
      cbu: String(cbu).slice(0, 40),
      alias: String(alias).slice(0, 40),
      actualizado: serverTimestamp()
    });

  const _limpiarSuscripciones = () => {
    _unsubSnapshots.forEach(fn => fn());
    _unsubSnapshots = [];
  };

  // Logos en Firebase Storage: users/{uid}/logos/{sha256}.{ext}. El nombre es el hash
  // del contenido, así el mismo logo se sube una sola vez aunque esté en muchas propuestas.
  // Se muestran con su URL de descarga (lleva un token), que funciona sin sesión.
  const storage = getStorage(app);
  const EXTENSIONES_LOGO = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

  const _hashHex = async (blob) => {
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const subirLogo = async (blob) => {
    const ext = EXTENSIONES_LOGO[blob.type];
    if (!ext) throw new Error(`Formato de logo no admitido: ${blob.type}`);
    const ref = refStorage(storage, `users/${getUid()}/logos/${await _hashHex(blob)}.${ext}`);
    try {
      return await getDownloadURL(ref);
    } catch (e) {
      if (e.code !== 'storage/object-not-found') throw e;
    }
    await uploadBytes(ref, blob, { contentType: blob.type, cacheControl: 'public, max-age=31536000, immutable' });
    return getDownloadURL(ref);
  };

  // Token de la sesión para identificarse ante /api (null si no hay sesión). Espera a
  // que Firebase recupere la sesión guardada, que al cargar la página llega un instante después.
  const sesionRecuperada = new Promise(res => {
    const dejar = onAuthStateChanged(auth, () => { dejar(); res(); });
  });
  const tokenDeSesion = async () => {
    await sesionRecuperada;
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
  };

  const usaPassword = () => !!auth.currentUser?.providerData.some(p => p.providerId === 'password');

  // Firebase exige un inicio de sesión reciente para borrar una cuenta.
  const _reautenticar = async (password) => {
    const user = auth.currentUser;
    if (usaPassword()) {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      return;
    }
    if (esAppNativa()) {
      await reautenticarConCredencial(user, GoogleAuthProvider.credential(await tokenGoogleNativo()));
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ login_hint: user.email });
    await reauthenticateWithPopup(user, provider);
  };

  const _borrarEnLotes = async (consulta) => {
    const snap = await getDocs(consulta);
    for (let i = 0; i < snap.docs.length; i += 400) {
      const lote = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach(d => lote.delete(d.ref));
      await lote.commit();
    }
  };

  // Borra todo lo del usuario y después la cuenta. El orden importa: sin la cuenta,
  // las reglas ya no permitirían borrar sus datos.
  const eliminarCuenta = async (password) => {
    await _reautenticar(password);
    const uid = getUid();

    // El perfil va primero: si las reglas no permiten borrar, falla antes de tocar
    // las propuestas. Y si algo falla después, el perfil se vuelve a crear al iniciar sesión.
    await deleteDoc(doc(db, 'users', uid));
    await deleteDoc(doc(db, 'cobros', uid)).catch(e => console.warn('No se pudieron borrar los datos de cobro:', e));
    _limpiarSuscripciones();

    const propias = await getDocs(query(_colProposals(), where('userId', '==', uid)));
    for (const d of propias.docs) await _borrarVersiones('proposals', d.id);
    await _borrarEnLotes(query(_colProposals(), where('userId', '==', uid)));

    try {
      const propios = await getDocs(query(_colPortfolios(), where('userId', '==', uid)));
      for (const d of propios.docs) await _borrarVersiones('portfolios', d.id);
      await _borrarEnLotes(query(_colPortfolios(), where('userId', '==', uid)));
    } catch (e) {
      console.warn('No se pudieron borrar los portafolios:', e);
    }

    try {
      const logos = await listAll(refStorage(storage, `users/${uid}/logos`));
      await Promise.all(logos.items.map(ref => deleteObject(ref)));
    } catch (e) {
      console.warn('No se pudieron borrar los logos:', e);
    }

    await deleteUser(auth.currentUser);
    await limpiarCacheLocal();
  };

  return {
    auth: {
      getUser, getUid, onAuthChange, signInGoogle, signIn, signUp, signOut,
      enviarVerificacion, comprobarVerificacion, aplicarVerificacion, recuperarPassword, usaPassword, eliminarCuenta, tokenDeSesion
    },
    logos: { subir: subirLogo, prefijoURL: PREFIJO_URL_LOGO },
    versiones: { listar: listarVersiones, crear: crearVersion },
    plan: { escuchar: escucharPlan },
    perfil: { obtener: obtenerPerfil, guardar: guardarPerfil },
    cobro: { obtener: obtenerCobro, guardar: guardarCobro },
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
    },
    portfolios: {
      nuevoId:        nuevoIdPortafolio,
      crear:          crearPortafolio,
      obtener:        obtenerPortafolio,
      obtenerPublico: obtenerPortafolioPublico,
      listar:         listarPortafolios,
      actualizar:     actualizarPortafolio,
      borrar:         borrarPortafolio,
      escuchar:       escucharPortafolios
    }
  };
};

let AteneaDB = null;
let AteneaDBError = null;
try {
  AteneaDB = crearAteneaDB();
} catch (e) {
  console.error('Firebase no pudo inicializarse:', e);
  AteneaDBError = e;
}

export { AteneaDB, AteneaDBError };
