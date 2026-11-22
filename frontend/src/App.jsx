import React from 'react';
import { api } from './api/api.js'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DebtProvider, useDebt } from './Context/context.jsx';
import Nav from './components/Nav.jsx';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import LogForm from './components/LogForm.jsx';
import { Alert } from './components/Notification.jsx';

const AuthenticatedLayout = () => {
  const { isAuthenticated, alert, dismissAlert } = useDebt();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Nav>
      {alert && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert
            title={alert.title}
            text={alert.text}
            onDismiss={dismissAlert}
          />
        </div>
      )}
      <Outlet />
      <LogForm />
    </Nav>
  );
};

export const App = () => {
  return (
    <DebtProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/register" element={<Login mode="register" />} />

          {/* Authenticated routes wrapped with Nav & Layout */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Home view="dashboard" />} />
            <Route path="/debtors" element={<Home view="debtors" />} />
            <Route path="/debtor/:id" element={<Home view="debtor-detail" />} />
            <Route path="/transactions" element={<Home view="transactions" />} />
            <Route path="/profile" element={<Home view="profile" />} />
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DebtProvider>
  );
};

export default App;
