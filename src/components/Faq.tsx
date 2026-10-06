import { faqJsonLd } from "@/lib/seo";
import Icon from "./Icon";
import JsonLd from "./JsonLd";

export default function Faq({ title, faqs }: { title: string; faqs: { question: string; answer: string }[] }) {
  if (faqs.length === 0) return null;
  return (
    <section className="mt-12" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title">{title}</h2>
      <div className="mt-5 space-y-3">
        {faqs.map((faq) => (
          <details key={faq.question} className="card group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-bold text-ink">
              {faq.question}
              <Icon name="chevron" size={18} className="shrink-0 rotate-90 text-muted transition group-open:-rotate-90" />
            </summary>
            <p className="mt-3 text-sm leading-7 text-body">{faq.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqJsonLd(faqs)} />
    </section>
  );
}
