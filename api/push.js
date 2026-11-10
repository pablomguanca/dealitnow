// POST /api/push — notificaciones push del dueño en sus dispositivos (ver _lib/push.js).
//   { accion: 'alta', suscripcion }  activa este dispositivo (PushSubscription.toJSON())
//   { accion: 'baja', endpoint }     lo desactiva (al apagarlas o al cerrar sesión)
//   { accion: 'baja', todos: true }  desactiva todos (al eliminar la cuenta)
//   { accion: 'prueba' }             manda un aviso de prueba a sus dispositivos
import { FieldValue, firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { fallar, leerPost, responder } from './_lib/http.js';
import { urlAppDe } from './_lib/avisos.js';
import { MAX_DISPOSITIVOS, clavePublicaPush, dispositivosDe, enviarPush, idDispositivo, suscripcionValida } from './_lib/push.js';

const milis = d => d.get('creado')?.toMillis?.() || 0;

export const crearHandler = ({ db, sesionDe, clave = () => clavePublicaPush(), enviar = enviarPush }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    const dispositivos = dispositivosDe(db, sesion.uid);

    if (cuerpo.accion === 'baja') {
      if (cuerpo.todos === true) {
        const snap = await dispositivos.get();
        await Promise.all(snap.docs.map(d => d.ref.delete()));
        return responder(res, 204);
      }
      if (typeof cuerpo.endpoint !== 'string' || !cuerpo.endpoint || cuerpo.endpoint.length > 1024) {
        return responder(res, 400, { error: 'endpoint-invalido' });
      }
      await dispositivos.doc(idDispositivo(cuerpo.endpoint)).delete();
      return responder(res, 204);
    }

    if (!clave()) return responder(res, 503, { error: 'push-no-configurado' });

    if (cuerpo.accion === 'alta') {
      const suscripcion = suscripcionValida(cuerpo.suscripcion);
      if (!suscripcion) return responder(res, 400, { error: 'suscripcion-invalida' });
      const id = idDispositivo(suscripcion.endpoint);
      // Tope de dispositivos por cuenta: si se pasa, se borran los más viejos.
      const otros = (await dispositivos.get()).docs.filter(d => d.id !== id).sort((a, b) => milis(a) - milis(b));
      const sobran = otros.slice(0, Math.max(0, otros.length - (MAX_DISPOSITIVOS - 1)));
      await Promise.all(sobran.map(d => d.ref.delete()));
      await dispositivos.doc(id).set({ suscripcion, creado: FieldValue.serverTimestamp() });
      return responder(res, 204);
    }

    if (cuerpo.accion === 'prueba') {
      const enviados = await enviar({
        db,
        uid: sesion.uid,
        mensaje: {
          titulo: 'Así te van a llegar los avisos',
          cuerpo: 'Cuando tu cliente abra o acepte una propuesta, te avisamos acá al instante.',
          url: `${urlAppDe(req)}/cuenta`,
          tag: 'prueba'
        }
      });
      return responder(res, 200, { enviados });
    }

    return responder(res, 400, { error: 'accion-invalida' });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud });
