import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DeleteData = () => {
  return (
    <div className="container animate-fade-up" dir="rtl" style={{ marginTop: '8rem' }}>
      <div className="legal-content">
        <h1>دليل حذف بيانات المستخدم</h1>
        
        <div style={{ display: 'flex', gap: '1rem', background: '#FEF2F2', padding: '1.5rem', borderRadius: '12px', border: '1px solid #FECACA', marginBottom: '2rem' }}>
          <AlertTriangle color="#DC2626" size={32} style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ color: '#DC2626', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>ملاحظة هامة</h3>
            <p style={{ margin: 0, color: '#7F1D1D', fontSize: '1rem' }}>
              حذف حسابك هو إجراء دائم. سيتم مسح جميع إعلاناتك النشطة، العناصر المحفوظة، سجل الدردشة، ومعلومات الملف الشخصي بشكل دائم ولا يمكن استعادتها.
            </p>
          </div>
        </div>

        <h2>كيفية حذف بياناتك</h2>
        <p>يمكنك طلب حذف حسابك وجميع البيانات المرتبطة به مباشرة من داخل تطبيق سوقكم عبر اتباع الخطوات التالية:</p>
        
        <ol style={{ marginLeft: '1.5rem', marginBottom: '2rem', color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: '1.8' }}>
          <li>افتح <strong>تطبيق سوقكم</strong> على جهازك.</li>
          <li>تأكد من تسجيل الدخول إلى الحساب الذي ترغب في حذفه.</li>
          <li>انتقل إلى علامة التبويب <strong>حسابي</strong> في شريط التنقل السفلي.</li>
          <li>اضغط على أيقونة <strong>الإعدادات</strong>.</li>
          <li>قم بالتمرير لأسفل وحدد <strong>إعدادات الحساب</strong>.</li>
          <li>اضغط على <strong>حذف الحساب</strong>.</li>
          <li>سيُطلب منك تأكيد قرارك. اقرأ رسالة التحذير بعناية.</li>
          <li>اضغط على <strong>تأكيد الحذف</strong>. ستتم إزالة حسابك وجميع البيانات المرتبطة به فوراً وبشكل دائم من خوادمنا.</li>
        </ol>

        <h2>طريقة بديلة (طلب عبر البريد الإلكتروني)</h2>
        <p>إذا لم يعد بإمكانك الوصول إلى التطبيق، يمكنك طلب حذف البيانات عن طريق الاتصال بفريق الدعم لدينا:</p>
        <ol style={{ marginLeft: '1.5rem', marginBottom: '2rem', color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: '1.8' }}>
          <li>أرسل بريداً إلكترونياً إلى <strong>privacy@sooq-com.com</strong> من عنوان البريد الإلكتروني المرتبط بحسابك.</li>
          <li>استخدم سطر الموضوع: <strong>"طلب حذف البيانات"</strong>.</li>
          <li>في نص رسالة البريد الإلكتروني، يرجى ذكر اسم المستخدم الخاص بك أو رقم الهاتف المرتبط بالحساب لمساعدتنا في التعرف عليه.</li>
        </ol>
        <p>سيقوم فريقنا بمعالجة طلبك في غضون 7 أيام عمل وسنرسل لك رسالة تأكيد عبر البريد الإلكتروني بمجرد مسح بياناتك تماماً.</p>
        
      </div>
    </div>
  );
};

export default DeleteData;
