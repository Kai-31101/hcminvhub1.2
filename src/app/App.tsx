import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { GovernanceProvider } from './context/GovernanceContext';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';

function App() {
  return (
    <AppProvider>
      <GovernanceProvider>
        <RouterProvider router={router} />
        <FloatingAiAssistant />
      </GovernanceProvider>
    </AppProvider>
  );
}

export default App;
