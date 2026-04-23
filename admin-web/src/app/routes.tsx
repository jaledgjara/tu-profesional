// Router del admin-web.
//
// Rutas públicas (sin guard): /login, /set-password, /reset-password
// Rutas protegidas: todo lo demás, bajo RequireAuth > RequireAdmin > AdminShell.
// AdminShell provee el sidebar y renderiza <Outlet /> para el contenido.

import { createBrowserRouter } from 'react-router-dom';

import { RequireAuth } from '@/app/guards/RequireAuth';
import { RequireAdmin } from '@/app/guards/RequireAdmin';
import { AdminShell } from '@/shared/layouts/AdminShell';
import { HomeScreen } from '@/features/home/HomeScreen';
import { ClientsScreen } from '@/features/clients/screens/ClientsScreen';
import { ProfessionalsScreen } from '@/features/professionals/screens/ProfessionalsScreen';
import { RequestsScreen } from '@/features/professionals/screens/RequestsScreen';
import { RequestDetailScreen } from '@/features/professionals/screens/RequestDetailScreen';
import { ReviewsScreen } from '@/features/reviews/screens/ReviewsScreen';
import { ActivityScreen } from '@/features/activity/screens/ActivityScreen';
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
          {
            element: <AdminShell />,
            children: [
              { path: '/',              element: <HomeScreen /> },
              { path: '/clients',       element: <ClientsScreen /> },
              { path: '/professionals', element: <ProfessionalsScreen /> },
              { path: '/requests',      element: <RequestsScreen /> },
              { path: '/requests/:id',  element: <RequestDetailScreen /> },
              { path: '/reviews',       element: <ReviewsScreen /> },
              { path: '/activity',      element: <ActivityScreen /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/login',          element: <LoginScreen /> },
  { path: '/set-password',   element: <SetPasswordScreen /> },
  { path: '/reset-password', element: <ResetPasswordScreen /> },
]);
