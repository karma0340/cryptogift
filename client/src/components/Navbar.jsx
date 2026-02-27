import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { SiBitcoin } from 'react-icons/si';
import './Navbar.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="container navbar__inner">
                <Link to="/" className="navbar__logo">
                    <div className="navbar__logo-icon">
                        <SiBitcoin />
                    </div>
                    <span className="navbar__logo-text">CryptoGift</span>
                </Link>

                <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
                    <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/catalog" className={`navbar__link ${location.pathname === '/catalog' ? 'active' : ''}`}>
                        Gift Cards
                    </Link>
                    <Link to="/orders" className={`navbar__link ${location.pathname === '/orders' ? 'active' : ''}`}>
                        My Orders
                    </Link>
                    <Link to="/catalog" className="btn btn-primary btn-sm navbar__cta">
                        Buy Gift Cards
                    </Link>
                </div>

                <button
                    className="navbar__toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
                </button>
            </div>
        </nav>
    );
}
