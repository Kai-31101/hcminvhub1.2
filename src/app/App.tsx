import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <FloatingAiAssistant />
    </AppProvider>
  );
}

export default App;
