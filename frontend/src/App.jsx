import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';

import PublicLayout from './components/layout/PublicLayout';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import MenuPage from './pages/public/MenuPage';
import LocationPage from './pages/public/LocationPage';
import ContactPage from './pages/public/ContactPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminHomepagePage from './pages/admin/AdminHomepagePage';
import AdminAboutPage from './pages/admin/AdminAboutPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import AdminLocationPage from './pages/admin/AdminLocationPage';
import AdminContactPage from './pages/admin/AdminContactPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAccountPage from './pages/admin/AdminAccountPage';

export default function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/menu/:productSlug" element={<MenuPage />} />
              <Route path="/location" element={<LocationPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Owner CMS Login */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Owner CMS Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="homepage" element={<AdminHomepagePage />} />
              <Route path="about" element={<AdminAboutPage />} />
              <Route path="promotions" element={<AdminPromotionsPage />} />
              <Route path="location" element={<AdminLocationPage />} />
              <Route path="contact" element={<AdminContactPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="account" element={<AdminAccountPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SiteProvider>
  );
}

