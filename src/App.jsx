import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/hooks/useToast';

import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Billing from '@/pages/Billing';
import Orders from '@/pages/Orders';
import OrderDetails from '@/pages/OrderDetails';
import Invoices from '@/pages/Invoices';
import InvoiceDetails from '@/pages/InvoiceDetails';
import Reports from '@/pages/Reports';
import MenuManagement from '@/pages/MenuManagement';
import Settings from '@/pages/Settings';

function Protected({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>

            {/* =========================
                LOGIN
            ========================= */}

            <Route
              path="/login"
              element={<Login />}
            />

            {/* =========================
                PROTECTED APPLICATION
            ========================= */}

            <Route
              element={
                <Protected>
                  <AppLayout />
                </Protected>
              }
            >

              <Route
                index
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              {/* Billing / Counter */}
              <Route
                path="/billing"
                element={<Billing />}
              />

              {/* Orders */}
              <Route
                path="/orders"
                element={<Orders />}
              />

              <Route
                path="/orders/:id"
                element={<OrderDetails />}
              />

              {/* Invoices */}
              <Route
                path="/invoices"
                element={<Invoices />}
              />

              <Route
                path="/invoices/:id"
                element={<InvoiceDetails />}
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={<Reports />}
              />

              {/* =========================
                  ADMIN ONLY
              ========================= */}

              <Route
                path="/menu"
                element={
                  <Protected adminOnly>
                    <MenuManagement />
                  </Protected>
                }
              />

              <Route
                path="/settings"
                element={
                  <Protected adminOnly>
                    <Settings />
                  </Protected>
                }
              />

            </Route>

            {/* =========================
                FALLBACK
            ========================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}