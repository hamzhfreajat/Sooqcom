import React from 'react';
import { Home as HomeIcon, Building, Shield, Search, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-container" dir="rtl">
      {/* Hero Section */}
      <section className="section" style={{ position: 'relative', overflow: 'hidden', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-visual-bg"></div>
        <div className="container grid-2">
          <div className="hero-content animate-fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--color-bg-light)', borderRadius: '20px', color: 'var(--color-secondary)', fontWeight: '700', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
              <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                <span className="animate-ping" style={{ position: 'absolute', height: '100%', width: '100%', borderRadius: '50%', background: 'var(--color-secondary)', opacity: '0.7' }}></span>
                <span style={{ position: 'relative', borderRadius: '50%', height: '10px', width: '10px', background: 'var(--color-secondary)' }}></span>
              </span>
              التطبيق متاح الآن!
            </div>
            
            <h1 style={{ marginBottom: '1.5rem', lineHeight: '1.4' }}>
              الوجهة الأولى <br />
              <span className="text-gradient">لبيع وشراء كل شيء</span>
            </h1>
            
            <p style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '500px' }}>
              ابحث عن عقارك المثالي، سيارتك الجديدة، أو أي شيء تحتاجه في منطقتك بكل سهولة وأمان مع تطبيق سوقكم.
            </p>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-success" style={{ padding: '1.2rem 2.5rem' }}>
                تحميل التطبيق الآن
              </button>
            </div>
          </div>
          
          <div className="hero-visual animate-fade-up delay-200 flex-center">
            <div className="app-mockup">
              {/* App UI Recreation inside Mockup */}
              <div style={{ padding: '2rem 1rem', height: '100%', background: 'var(--color-bg-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <img src="/logo.png" alt="Logo" style={{ height: '35px', borderRadius: '8px' }} />
                  <Search color="var(--color-text-dark)" />
                </div>
                
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>اكتشف العروض المتاحة</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="app-icon-wrapper" style={{ height: '60px', width: '60px' }}>
                      <div className="app-icon-inner" style={{ background: '#E8F5E9', color: 'var(--color-secondary)' }}>
                        <HomeIcon size={24} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0, color: 'var(--color-text-dark)' }}>عقارات للإيجار</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>أفضل العروض</p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="app-icon-wrapper" style={{ height: '60px', width: '60px' }}>
                      <div className="app-icon-inner" style={{ background: '#E3F2FD', color: 'var(--color-primary)' }}>
                        <Building size={24} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0, color: 'var(--color-text-dark)' }}>عقارات للبيع</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>ابحث عن حلمك</p>
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', height: '120px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                  تصفح الآن
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" style={{ background: 'var(--color-bg-light)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2>لماذا تختار <span className="text-gradient">سوقكم؟</span></h2>
            <p style={{ maxWidth: '600px', margin: '0 auto' }}>وفرنا لك المنصة الأسرع والأكثر أماناً لتلبي كافة احتياجاتك اليومية بكل يسر وسهولة.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="app-card">
              <div style={{ background: '#E3F2FD', height: '80px', width: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--color-primary)' }}>
                <Zap size={40} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>سرعة فائقة</h3>
              <p style={{ fontSize: '1rem' }}>تصفح الإعلانات وتواصل مع البائعين في الوقت الفعلي بدون أي تأخير.</p>
            </div>
            
            <div className="app-card">
              <div style={{ background: '#E8F5E9', height: '80px', width: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--color-secondary)' }}>
                <Shield size={40} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>أمان وموثوقية</h3>
              <p style={{ fontSize: '1rem' }}>نظام توثيق متطور لضمان بيئة آمنة لجميع المستخدمين للحماية من الاحتيال.</p>
            </div>
            
            <div className="app-card">
              <div style={{ background: '#F3E5F5', height: '80px', width: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#9C27B0' }}>
                <Search size={40} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>بحث ذكي</h3>
              <p style={{ fontSize: '1rem' }}>ابحث عن ما تريده بدقة باستخدام فلاتر وتصنيفات مخصصة تناسب احتياجاتك.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
