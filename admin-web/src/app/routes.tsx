// Router del admin-web. Por ahora sólo la home; en PR 3 se agregan /login,
// /set-password, /reset-password y los guards RequireAuth / RequireAdmin.

import { createBrowserRouter } from 'react-router-dom';
import { HomeScreen } from '@/features/home/HomeScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeScreen />,
  },
]);
