import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { SUPPORT_EMAIL } from "@/lib/config";
import { aboutJsonLd, organizationJsonLd, pageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/types";

const TITLES: Record<string, Record<Locale, string>> = {
  about: { ar: "من نحن", en: "About us" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  "delete-data": { ar: "دليل حذف بيانات المستخدم", en: "User data deletion guide" },
};

const DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  about: {
    ar: "تعرّف على سوقكم: منصة أردنية لإعلانات العقارات تجمع الشقق والبيوت والأراضي للبيع والإيجار في عمان وباقي المحافظات، مع أسعار السوق لكل منطقة.",
    en: "About Sooqcom: a Jordanian property platform that brings apartments, houses and land for sale and rent in Amman and every governorate together, with market prices for each area.",
  },
  privacy: {
    ar: "سياسة الخصوصية في سوقكم: البيانات التي نجمعها، كيف نستخدمها ونحميها، وحقوقك عليها.",
    en: "Sooqcom's privacy policy: the data we collect, how we use and protect it, and your rights over it.",
  },
  "delete-data": {
    ar: "طريقة طلب حذف حسابك وبياناتك من تطبيق وموقع سوقكم، خطوة بخطوة.",
    en: "How to request the deletion of your account and data from the Sooqcom app and website, step by step.",
  },
};

export function staticMetadata(locale: Locale, page: keyof typeof TITLES): Metadata {
  return pageMetadata({ locale, title: TITLES[page][locale], description: DESCRIPTIONS[page][locale], arPath: `/${page}`, enPath: `/en/${page}` });
}

/** Structured data of the "about us" page: the page itself and the organisation it is about. */
function AboutData({ locale }: { locale: Locale }) {
  return (
    <>
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={aboutJsonLd(locale, TITLES.about[locale], locale === "en" ? "/en/about" : "/about")} />
    </>
  );
}

function Legal({ children }: { children: ReactNode }) {
  return (
    <div className="container-page py-10">
      <article className="card prose-legal mx-auto max-w-3xl p-6 sm:p-10">{children}</article>
    </div>
  );
}

export function AboutPage({ locale }: { locale: Locale }) {
  if (locale === "en") {
    return (
      <Legal>
        <AboutData locale={locale} />
        <h1>About us</h1>
        <p>
          <strong>Sooqcom</strong> is a Jordanian property platform. It brings apartments, houses, villas, land and
          commercial property for sale and for rent, in Amman and every governorate of Jordan, into one place, on this
          website and in the Sooqcom app for Android and iPhone.
        </p>
        <h2>Our mission</h2>
        <p>
          Our mission is to make finding a home or selling a property in Jordan simple, transparent and trustworthy.
          Every area page shows the typical price of the listings it holds, so you can tell a fair price from an
          expensive one before you call.
        </p>
        <h2>What sets us apart</h2>
        <ul>
          <li><strong>User-focused design:</strong> an intuitive interface that puts your needs first.</li>
          <li><strong>Advanced safety:</strong> your safety is our priority. We use advanced verification systems to keep trading safe.</li>
          <li><strong>High performance:</strong> our app is built on a modern architecture with real-time updates and very fast search.</li>
        </ul>
        <h2>Contact us</h2>
        <p>
          Questions or suggestions? We would love to hear from you. Reach our support team through the Sooqcom app or
          email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </Legal>
    );
  }
  return (
    <Legal>
      <AboutData locale={locale} />
      <h1>من نحن</h1>
      <p>
        <strong>سوقكم</strong> منصة أردنية للعقارات. تجمع إعلانات الشقق والبيوت والفلل والأراضي والعقارات التجارية،
        للبيع وللإيجار، في عمان وجميع محافظات الأردن في مكان واحد: على هذا الموقع وفي تطبيق سوقكم لأندرويد وآيفون.
      </p>
      <h2>مهمتنا</h2>
      <p>
        مهمتنا أن نجعل البحث عن بيت أو بيع عقار في الأردن سهلاً وواضحاً وجديراً بالثقة. كل صفحة منطقة تعرض السعر
        الشائع للإعلانات الموجودة فيها، لتعرف السعر العادل من المرتفع قبل أن تتصل.
      </p>
      <h2>لماذا نتميز</h2>
      <ul>
        <li><strong>تصميم يركز على المستخدم:</strong> صممنا واجهة بديهية تضع احتياجاتك في المقام الأول.</li>
        <li><strong>أمان متقدم:</strong> سلامتك هي أولويتنا. نحن نستخدم أنظمة تحقق متطورة لضمان بيئة تداول آمنة.</li>
        <li><strong>أداء فائق السرعة:</strong> تم بناء تطبيقنا على بنية حديثة توفر تحديثات في الوقت الفعلي وعمليات بحث سريعة للغاية.</li>
      </ul>
      <h2>اتصل بنا</h2>
      <p>
        هل لديك أسئلة أو اقتراحات؟ نود أن نسمع منك. تواصل مع فريق الدعم عبر تطبيق سوقكم أو راسلنا على البريد الإلكتروني
        support@sooq-com.com.
      </p>
    </Legal>
  );
}

export function PrivacyPage({ locale }: { locale: Locale }) {
  if (locale === "en") {
    return (
      <Legal>
        <h1>Privacy policy</h1>
        <p>Last updated: {new Date().toLocaleDateString("en-GB")}</p>
        <h2>1. Introduction</h2>
        <p>
          Welcome to Sooqcom. We respect your privacy and are committed to protecting your personal data. This privacy
          policy explains how we handle your personal data when you visit our website or use our app, and tells you about
          your privacy rights.
        </p>
        <h2>2. The data we collect about you</h2>
        <p>We may collect, use, store and transfer different kinds of personal data about you, grouped as follows:</p>
        <ul>
          <li><strong>Identity data:</strong> first name, last name, username and profile picture.</li>
          <li><strong>Contact data:</strong> email address and phone numbers.</li>
          <li><strong>Technical data:</strong> internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
          <li><strong>Profile data:</strong> your username and password, purchases or orders made by you, your interests and preferences.</li>
        </ul>
        <h2>3. How we use your personal data</h2>
        <p>We will only use your personal data when the law allows us to. Most commonly, we will use it in the following circumstances:</p>
        <ul>
          <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
          <li>Where it is necessary for our legitimate interests and your interests and fundamental rights do not override them.</li>
          <li>Where we need to comply with a legal or regulatory obligation.</li>
        </ul>
        <h2>4. Data security</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
          used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal
          data to those employees, agents, contractors and other third parties who have a business need to know.
        </p>
        <h2>5. Your legal rights</h2>
        <p>
          Under certain circumstances, you have rights under data protection laws in relation to your personal data,
          including the right to request access, correction, erasure, restriction, transfer, or to object to processing.
          To request deletion of your data, please see the <Link href="/en/delete-data">data deletion guide</Link>.
        </p>
        <p>This English text is a translation; the Arabic version is the reference.</p>
      </Legal>
    );
  }
  return (
    <Legal>
      <h1>سياسة الخصوصية</h1>
      <p>آخر تحديث: {new Date().toLocaleDateString("ar-EG")}</p>
      <h2>1. مقدمة</h2>
      <p>
        مرحباً بك في سوقكم. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. ستعلمك سياسة الخصوصية هذه بكيفية تعاملنا مع
        بياناتك الشخصية عند زيارتك لموقعنا أو استخدام تطبيقنا، وتخبرك بحقوق الخصوصية الخاصة بك.
      </p>
      <h2>2. البيانات التي نجمعها عنك</h2>
      <p>قد نقوم بجمع واستخدام وتخزين ونقل أنواع مختلفة من البيانات الشخصية الخاصة بك والتي قمنا بتجميعها معاً على النحو التالي:</p>
      <ul>
        <li><strong>بيانات الهوية:</strong> تشمل الاسم الأول واسم العائلة واسم المستخدم وصورة الملف الشخصي.</li>
        <li><strong>بيانات الاتصال:</strong> تشمل عنوان البريد الإلكتروني وأرقام الهواتف.</li>
        <li><strong>البيانات الفنية:</strong> تشمل عنوان بروتوكول الإنترنت (IP)، بيانات تسجيل الدخول الخاصة بك، نوع وإصدار المتصفح، وإعدادات المنطقة الزمنية والموقع.</li>
        <li><strong>بيانات الملف الشخصي:</strong> تشمل اسم المستخدم وكلمة المرور الخاصة بك، والمشتريات أو الطلبات التي قمت بها، واهتماماتك وتفضيلاتك.</li>
      </ul>
      <h2>3. كيف نستخدم بياناتك الشخصية</h2>
      <p>لن نستخدم بياناتك الشخصية إلا عندما يسمح لنا القانون بذلك. في أغلب الأحيان، سنستخدم بياناتك الشخصية في الظروف التالية:</p>
      <ul>
        <li>حيثما نحتاج إلى تنفيذ العقد الذي نحن على وشك إبرامه أو الذي أبرمناه معك.</li>
        <li>حيثما كان ذلك ضرورياً لمصالحنا المشروعة ولا تتجاوزها مصالحك وحقوقك الأساسية.</li>
        <li>حيثما نحتاج إلى الامتثال لالتزام قانوني أو تنظيمي.</li>
      </ul>
      <h2>4. أمن البيانات</h2>
      <p>
        لقد وضعنا تدابير أمنية مناسبة لمنع فقدان بياناتك الشخصية عن طريق الخطأ، أو استخدامها أو الوصول إليها بطريقة غير
        مصرح بها، أو تغييرها أو الكشف عنها. بالإضافة إلى ذلك، نقصر الوصول إلى بياناتك الشخصية على الموظفين والوكلاء
        والمقاولين والأطراف الثالثة الأخرى التي لديها حاجة مهنية للمعرفة.
      </p>
      <h2>5. حقوقك القانونية</h2>
      <p>
        في ظل ظروف معينة، تتمتع بحقوق بموجب قوانين حماية البيانات فيما يتعلق ببياناتك الشخصية، بما في ذلك الحق في طلب
        الوصول، والتصحيح، والمسح، والتقييد، والنقل، أو الاعتراض على المعالجة. لطلب حذف بياناتك، يرجى الاطلاع على{" "}
        <Link href="/delete-data">دليل حذف البيانات</Link>.
      </p>
    </Legal>
  );
}

function Warning({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8 flex gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
      <Icon name="alert" size={30} className="shrink-0 text-red-600" />
      <div>
        <h3 className="text-lg font-bold text-red-600">{title}</h3>
        <p className="!text-red-900">{children}</p>
      </div>
    </div>
  );
}

export function DeleteDataPage({ locale }: { locale: Locale }) {
  if (locale === "en") {
    return (
      <Legal>
        <h1>User data deletion guide</h1>
        <Warning title="Important">
          Deleting your account is permanent. All your active ads, saved items, chat history and profile information
          will be erased permanently and cannot be recovered.
        </Warning>
        <h2>How to delete your data</h2>
        <p>You can request deletion of your account and all associated data directly inside the Sooqcom app by following these steps:</p>
        <ol>
          <li>Open the <strong>Sooqcom app</strong> on your device.</li>
          <li>Make sure you are signed in to the account you want to delete.</li>
          <li>Go to the <strong>My account</strong> tab in the bottom navigation bar.</li>
          <li>Tap the <strong>Settings</strong> icon.</li>
          <li>Scroll down and select <strong>Account settings</strong>.</li>
          <li>Tap <strong>Delete account</strong>.</li>
          <li>You will be asked to confirm your decision. Read the warning carefully.</li>
          <li>Tap <strong>Confirm deletion</strong>. Your account and all associated data will be removed from our servers immediately and permanently.</li>
        </ol>
        <h2>Alternative method (request by email)</h2>
        <p>If you can no longer access the app, you can request data deletion by contacting our support team:</p>
        <ol>
          <li>Send an email to <strong>privacy@sooq-com.com</strong> from the email address linked to your account.</li>
          <li>Use the subject line: <strong>&quot;Data deletion request&quot;</strong>.</li>
          <li>In the body of the email, please include your username or the phone number linked to the account to help us identify it.</li>
        </ol>
        <p>Our team will process your request within 7 business days and will send you a confirmation email once your data has been fully erased.</p>
      </Legal>
    );
  }
  return (
    <Legal>
      <h1>دليل حذف بيانات المستخدم</h1>
      <Warning title="ملاحظة هامة">
        حذف حسابك هو إجراء دائم. سيتم مسح جميع إعلاناتك النشطة، العناصر المحفوظة، سجل الدردشة، ومعلومات الملف الشخصي بشكل
        دائم ولا يمكن استعادتها.
      </Warning>
      <h2>كيفية حذف بياناتك</h2>
      <p>يمكنك طلب حذف حسابك وجميع البيانات المرتبطة به مباشرة من داخل تطبيق سوقكم عبر اتباع الخطوات التالية:</p>
      <ol>
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
      <ol>
        <li>أرسل بريداً إلكترونياً إلى <strong>privacy@sooq-com.com</strong> من عنوان البريد الإلكتروني المرتبط بحسابك.</li>
        <li>استخدم سطر الموضوع: <strong>&quot;طلب حذف البيانات&quot;</strong>.</li>
        <li>في نص رسالة البريد الإلكتروني، يرجى ذكر اسم المستخدم الخاص بك أو رقم الهاتف المرتبط بالحساب لمساعدتنا في التعرف عليه.</li>
      </ol>
      <p>سيقوم فريقنا بمعالجة طلبك في غضون 7 أيام عمل وسنرسل لك رسالة تأكيد عبر البريد الإلكتروني بمجرد مسح بياناتك تماماً.</p>
    </Legal>
  );
}
