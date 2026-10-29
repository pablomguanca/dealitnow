// Componente raíz de la aplicación React de Dealit.

import { DealitProvider } from './context/DealitContext.jsx';
import { AuthScreen } from './components/auth/AuthScreen.jsx';
import { TopBar } from './components/layout/TopBar.jsx';
import { EditorSidebar } from './components/editor/EditorSidebar.jsx';
import { DocumentPreview } from './components/preview/DocumentPreview.jsx';
import { ProposalsPanel } from './components/dashboard/ProposalsPanel.jsx';
import { PortfoliosPanel } from './components/dashboard/PortfoliosPanel.jsx';
import { AccountPanel } from './components/account/AccountPanel.jsx';
import { AppModals } from './components/modals/AppModals.jsx';

export function App() {
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

export default App;
