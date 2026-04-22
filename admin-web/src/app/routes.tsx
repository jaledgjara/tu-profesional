// Router del admin-web.
//
// Rutas públicas (sin guard): /login, /set-password, /reset-password
// Rutas protegidas: todo lo demás, bajo RequireAuth > RequireAdmin.
//
// En PR 4 (MFA) se agrega un tercer nivel de guard (RequireAAL2) entre
// RequireAdmin y las rutas protegidas, más /mfa-setup y /mfa-challenge.

import { createBrowserRouter } from 'react-router-dom';

import { RequireAuth } from '@/app/guards/RequireAuth';
import { RequireAdmin } from '@/app/guards/RequireAdmin';
import { HomeScreen } from '@/features/home/HomeScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SetPasswordScreen } from '@/features/auth/screens/SetPasswordScreen';
import { ResetPasswordScreen } from '@/features/auth/screens/ResetPasswordScreen';

export const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireAdmin />,
        children: [
          { path: '/', element: <HomeScreen /> },
        ],
      },
    ],
  },
  { path: '/login',          element: <LoginScreen /> },
  { path: '/set-password',   element: <SetPasswordScreen /> },
  { path: '/reset-password', element: <ResetPasswordScreen /> },
]);
