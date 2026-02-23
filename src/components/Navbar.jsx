import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Menu, X } from 'lucide-react';

export default function Navbar({ onCartOpen }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const { state } = useApp();

    const cartCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <img
                        src="/logo2.png"
                        alt="Camu Camu"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            objectFit: 'cover',
                        }}
                    />
                    CAMU CAMU
                </Link>

                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/menu" className={`nav-link ${isActive('/menu') ? 'active' : ''}`}>
                        Menu
                    </Link>
                    {onCartOpen && (
                        <button className="nav-btn" onClick={onCartOpen}>
                            <ShoppingCart size={16} />
                            Keranjang
                            {cartCount > 0 && (
                                <span className="cart-count-badge">{cartCount}</span>
                            )}
                        </button>
                    )}
                </div>

                <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
}
