package ar.com.dealit.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Complementos propios de Dealit (los de npm se registran solos).
        registerPlugin(ImprimirPlugin.class);
        registerPlugin(DictadoPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
