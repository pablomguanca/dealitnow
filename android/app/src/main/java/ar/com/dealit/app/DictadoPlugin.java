package ar.com.dealit.app;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * Dictado de «Contala y la armamos» en la app de Android. La ventana web (WebView) no trae el
 * reconocimiento de voz de Chrome, así que se usa el de Android (SpeechRecognizer).
 *
 * Eventos hacia la web: «parcial» { texto } mientras habla, «final» { texto } al cerrar cada
 * frase, «error» { codigo } y «fin» cuando termina. Android corta después de un silencio: si
 * el dictado sigue activo, se vuelve a escuchar solo, como hace la web en Chrome.
 */
@CapacitorPlugin(
    name = "Dictado",
    permissions = { @Permission(alias = "microfono", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class DictadoPlugin extends Plugin {

    private SpeechRecognizer reconocedor;
    private boolean activo = false;
    private String idioma = "es-AR";

    @PluginMethod
    public void disponible(PluginCall call) {
        JSObject r = new JSObject();
        r.put("disponible", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void empezar(PluginCall call) {
        idioma = call.getString("idioma", "es-AR");
        if (getPermissionState("microfono") != PermissionState.GRANTED) {
            requestPermissionForAlias("microfono", call, "permisoMicrofono");
            return;
        }
        arrancar(call);
    }

    @PermissionCallback
    private void permisoMicrofono(PluginCall call) {
        if (getPermissionState("microfono") == PermissionState.GRANTED) {
            arrancar(call);
        } else {
            call.reject("Sin permiso para usar el micrófono", "sin-permiso");
        }
    }

    @PluginMethod
    public void detener(PluginCall call) {
        activo = false;
        getActivity().runOnUiThread(() -> {
            // stopListening entrega lo último que se dijo (llega como «final») y después «fin».
            if (reconocedor != null) reconocedor.stopListening();
            else notifyListeners("fin", new JSObject());
            call.resolve();
        });
    }

    private void arrancar(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("El reconocimiento de voz no está disponible", "no-disponible");
            return;
        }
        getActivity().runOnUiThread(() -> {
            liberar();
            activo = true;
            reconocedor = SpeechRecognizer.createSpeechRecognizer(getContext());
            reconocedor.setRecognitionListener(new Oyente());
            escuchar();
            call.resolve();
        });
    }

    private void escuchar() {
        Intent intento = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intento.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intento.putExtra(RecognizerIntent.EXTRA_LANGUAGE, idioma);
        intento.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intento.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        // Más margen de silencio antes de cortar: al dictar se piensa entre frase y frase.
        intento.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L);
        intento.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L);
        reconocedor.startListening(intento);
    }

    private void liberar() {
        if (reconocedor != null) {
            reconocedor.destroy();
            reconocedor = null;
        }
    }

    // Si sigue activo, vuelve a escuchar; si no, libera el reconocedor y avisa que terminó.
    private void seguirOTerminar() {
        if (activo && reconocedor != null) {
            escuchar();
        } else {
            liberar();
            notifyListeners("fin", new JSObject());
        }
    }

    private static String primero(Bundle resultados) {
        ArrayList<String> textos = resultados == null ? null : resultados.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return textos == null || textos.isEmpty() ? "" : textos.get(0);
    }

    @Override
    protected void handleOnPause() {
        // Si la app pasa a segundo plano, se deja de escuchar.
        if (activo || reconocedor != null) {
            activo = false;
            liberar();
            notifyListeners("fin", new JSObject());
        }
        super.handleOnPause();
    }

    @Override
    protected void handleOnDestroy() {
        activo = false;
        liberar();
        super.handleOnDestroy();
    }

    private class Oyente implements RecognitionListener {
        @Override public void onReadyForSpeech(Bundle params) { }
        @Override public void onBeginningOfSpeech() { }
        @Override public void onRmsChanged(float rmsdB) { }
        @Override public void onBufferReceived(byte[] buffer) { }
        @Override public void onEndOfSpeech() { }
        @Override public void onEvent(int eventType, Bundle params) { }

        @Override
        public void onPartialResults(Bundle parciales) {
            String texto = primero(parciales);
            if (texto.isEmpty()) return;
            JSObject r = new JSObject();
            r.put("texto", texto);
            notifyListeners("parcial", r);
        }

        @Override
        public void onResults(Bundle resultados) {
            String texto = primero(resultados);
            if (!texto.isEmpty()) {
                JSObject r = new JSObject();
                r.put("texto", texto);
                notifyListeners("final", r);
            }
            seguirOTerminar();
        }

        @Override
        public void onError(int error) {
            // Silencio o nada reconocido: si sigue activo, se vuelve a escuchar. Si ya se pidió
            // detener, cualquier error es solo el cierre y no se muestra.
            if (!activo || error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                seguirOTerminar();
                return;
            }
            activo = false;
            JSObject r = new JSObject();
            r.put("codigo", error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ? "sin-permiso"
                : error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT ? "sin-conexion"
                : "error-" + error);
            notifyListeners("error", r);
            seguirOTerminar();
        }
    }
}
