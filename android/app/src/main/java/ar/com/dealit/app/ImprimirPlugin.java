package ar.com.dealit.app;

import android.content.Context;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * «Descargar PDF» en la app de Android: la ventana web no tiene window.print(), así que se
 * abre el diálogo de impresión del sistema (con «Guardar como PDF») sobre la página actual.
 * La promesa se resuelve cuando el diálogo termina, para que la web recién entonces saque
 * lo que agregó solo para imprimir (por ejemplo, la marca de agua del plan Gratis).
 */
@CapacitorPlugin(name = "Imprimir")
public class ImprimirPlugin extends Plugin {

    @PluginMethod
    public void imprimir(PluginCall call) {
        final String nombre = call.getString("nombre", "Dealit");
        getActivity().runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            PrintManager impresion = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
            if (impresion == null) {
                call.reject("Este dispositivo no permite imprimir");
                return;
            }
            final PrintDocumentAdapter base = webView.createPrintDocumentAdapter(nombre);
            PrintDocumentAdapter adaptador = new PrintDocumentAdapter() {
                @Override
                public void onStart() {
                    base.onStart();
                }

                @Override
                public void onLayout(PrintAttributes anteriores, PrintAttributes nuevos, CancellationSignal cancelar,
                                     LayoutResultCallback respuesta, Bundle extras) {
                    base.onLayout(anteriores, nuevos, cancelar, respuesta, extras);
                }

                @Override
                public void onWrite(PageRange[] paginas, ParcelFileDescriptor destino, CancellationSignal cancelar,
                                    WriteResultCallback respuesta) {
                    base.onWrite(paginas, destino, cancelar, respuesta);
                }

                @Override
                public void onFinish() {
                    base.onFinish();
                    call.resolve();
                }
            };
            impresion.print(nombre, adaptador, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
        });
    }
}
