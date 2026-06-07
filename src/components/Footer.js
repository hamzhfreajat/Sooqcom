import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ 
      background: 'var(--color-bg-light)', 
      borderTop: '1px solid var(--color-border)',
      padding: '4rem 2rem 2rem',
      marginTop: '4rem'
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <img src="/logo.png" alt="Sooqcom Logo" style={{ height: '40px', width: '40px', borderRadius: '10px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-text-dark)', letterSpacing: '-0.5px', lineHeight: '1' }}>سوقكم</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '1px' }}>SOOQCOM</span>
            </div>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: '300px' }}>
            المنصة الإعلانية الأولى للبيع والشراء واكتشاف كل ما تحتاجه في مكان واحد.
          </p>
        </div>
        
        <div>
          <h4 style={{ color: 'var(--color-text-dark)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>الشركة</h4>
          <ul style={{ listStyle: 'none' }}>
            <li style={{ marginBottom: '0.75rem' }}><Link to="/about">من نحن</Link></li>
            <li style={{ marginBottom: '0.75rem' }}><Link to="/">اتصل بنا</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 style={{ color: 'var(--color-text-dark)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>قانوني</h4>
          <ul style={{ listStyle: 'none' }}>
            <li style={{ marginBottom: '0.75rem' }}><Link to="/privacy">سياسة الخصوصية</Link></li>
            <li style={{ marginBottom: '0.75rem' }}><Link to="/">شروط الاستخدام</Link></li>
            <li style={{ marginBottom: '0.75rem' }}><Link to="/delete-data">حذف البيانات</Link></li>
          </ul>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} تطبيق سوقكم. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
};

export default Footer;
