import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import ChatBot from './components/ChatBot';
import LandingPage from './pages/LandingPage';
import MenuPage from './pages/MenuPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Routes>
        {/* Admin routes - NO navbar */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Customer routes - WITH navbar */}
        <Route
          path="*"
          element={
            <>
              <Navbar onCartOpen={() => {
                if (window.location.pathname === '/menu') {
                  window.dispatchEvent(new Event('open-menu-cart'));
                } else {
                  setCartOpen(true);
                }
              }} />
              <CartSidebar
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                onCheckout={() => {
                  setCartOpen(false);
                  window.location.href = '/menu?checkout=true';
                }}
              />

              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/menu" element={<MenuPage />} />
              </Routes>
              <ChatBot onNavigate={(target) => {
                if (target === 'menu') {
                  window.location.href = '/menu';
                }
              }} />
            </>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
