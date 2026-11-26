import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './features/dashboard/Dashboard';
import { Login } from './features/auth/Login';
import { ForgotPin } from './features/auth/ForgotPin';
import { Register } from './features/auth/Register';
import { CardsListing } from './features/cards/CardsListing';
import { BankListing } from './features/banks/BankListing';
import { PasswordListing } from './features/passwords/PasswordListing';
import { CollectionsListing } from './features/collections/CollectionsListing';
import { CollectionDetail } from './features/collections/collection-detail/CollectionDetail';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppUpdateModal } from './components/AppUpdateModal';

function App() {
  return (
    <div className="app-shell text-vault-text">
      <AppUpdateModal />
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-pin" element={<ForgotPin />} />

        {/* Protected Vault Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cards" element={<CardsListing />} />
          <Route path="/banks" element={<BankListing />} />
          <Route path="/passwords" element={<PasswordListing />} />
          <Route path="/collections" element={<CollectionsListing />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
        </Route>

        {/* Default Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
