import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>

      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>

  </StrictMode>
)
