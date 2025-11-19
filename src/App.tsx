import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Kategori from "./pages/MasterData/Kategori";
import SubKategori from "./pages/MasterData/SubKategori";
import Akun from "./pages/MasterData/Akun";
import Transaksi from "./pages/Transaksi";
import TutupBuku from "./pages/TutupBuku";
import NotFound from "./pages/NotFound";
import PublicDashboard from "./pages/public-dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/master/kategori"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Kategori />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/master/subkategori"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SubKategori />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/master/akun"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Akun />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/public-dashboard" element={<PublicDashboard />} />
          
          <Route
            path="/transaksi"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Transaksi />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tutupbuku"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TutupBuku />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
