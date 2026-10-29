// Componente raíz de Dealit con enrutamiento declarativo en React Router v6.

import { Routes, Route, Navigate } from 'react-router-dom';
import { DealitProvider } from './context/DealitContext.jsx';
import { AuthScreen } from './components/auth/AuthScreen.jsx';
import { TopBar } from './components/layout/TopBar.jsx';
import { EditorSidebar } from './components/editor/EditorSidebar.jsx';
import { DocumentPreview } from './components/preview/DocumentPreview.jsx';
import { ProposalsPanel } from './components/dashboard/ProposalsPanel.jsx';
import { PortfoliosPanel } from './components/dashboard/PortfoliosPanel.jsx';
import { AccountPanel } from './components/account/AccountPanel.jsx';
import { AppModals } from './components/modals/AppModals.jsx';

function DealitWorkspace() {
  return (
    <DealitProvider>
      <AuthScreen />
      <TopBar />
      <main className="app" id="app">
        <EditorSidebar />
        <DocumentPreview />
      </main>
      <ProposalsPanel />
      <PortfoliosPanel />
      <AccountPanel />
      <AppModals />
    </DealitProvider>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DealitWorkspace seccion="panel" />} />
      <Route path="/portafolios" element={<DealitWorkspace seccion="portafolios" />} />
      <Route path="/cuenta" element={<DealitWorkspace seccion="cuenta" />} />
      <Route path="/propuesta/:id" element={<DealitWorkspace seccion="editor" modo="propuesta" />} />
      <Route path="/editar-portafolio/:id" element={<DealitWorkspace seccion="editor" modo="portafolio" />} />
      <Route path="/p/:id" element={<DealitWorkspace seccion="cliente-propuesta" />} />
      <Route path="/portafolio/:id" element={<DealitWorkspace seccion="cliente-portafolio" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
