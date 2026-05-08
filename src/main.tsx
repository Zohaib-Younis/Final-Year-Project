import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';

// Configure axios base URL
// In development, it defaults to the same host if not specified.
// In production, it can be overridden via VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = API_URL;

// Add interceptor to handle errors globally if needed
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
