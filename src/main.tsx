import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'
import App from './App.tsx'

// Log environment variables for debugging
console.log('Environment variables:', import.meta.env);
console.log('VITE_XANO_API_URL:', import.meta.env.VITE_XANO_API_URL);

// Check if the API URL is set
if (!import.meta.env.VITE_XANO_API_URL) {
  console.error('VITE_XANO_API_URL environment variable is not set. Please create a .env file in the project root with VITE_XANO_API_URL=your_xano_api_url');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
