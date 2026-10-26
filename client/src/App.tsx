import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';

export default function App() {
  useAuthPersistence();
  return <BrowserRouter><AppRouter /></BrowserRouter>;
}