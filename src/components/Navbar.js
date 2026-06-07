import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navLinkStyle = (path) => ({
    color: location.pathname === path ? 'var(--color-primary)' : 'var(--color-text-dark)',
    fontWeight: '600',
    fontSize: '1.05rem',
    borderBottom: location.pathname === path ? '2px solid var(--color-primary)' : '2px solid transparent',
    paddingBottom: '4px'
  });

  return (
    <nav className="glass-nav" style={{ 
      padding: '1rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: 'white',
      boxShadow: isScrolled ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src="/logo.png" alt="Sooqcom Logo" style={{ height: '40px', width: '40px', borderRadius: '10px' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-text-dark)', letterSpacing: '-0.5px', lineHeight: '1' }}>سوقكم</span>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '1px' }}>SOOQCOM</span>
        </div>
      </Link>
      
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        <Link to="/" style={navLinkStyle('/')}>الرئيسية</Link>
        <Link to="/about" style={navLinkStyle('/about')}>من نحن</Link>
        <Link to="/privacy" style={navLinkStyle('/privacy')}>سياسة الخصوصية</Link>
        <Link to="/delete-data" style={navLinkStyle('/delete-data')}>حذف الحساب</Link>
        <a href="#download" className="btn btn-success" style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem' }}>
          حمل التطبيق
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
