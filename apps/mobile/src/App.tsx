import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './features/dashboard/Dashboard';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { CardsListing } from './features/cards/CardsListing';
import { BankListing } from './features/banks/BankListing';
import { PasswordListing } from './features/passwords/PasswordListing';
import { CollectionsListing } from './features/collections/CollectionsListing';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <div className="app-shell min-h-screen text-[#F5F7FA]">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cards" element={<CardsListing />} />
          <Route path="/banks" element={<BankListing />} />
          <Route path="/passwords" element={<PasswordListing />} />
          <Route path="/collections" element={<CollectionsListing />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
