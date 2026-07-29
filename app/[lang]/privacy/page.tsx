import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";

const CONTACT_EMAIL = "khurtsidzetoko@gmail.com";

const SECTIONS: Record<Locale, { heading: string; updated: string; sections: { title: string; body: string }[] }> = {
  en: {
    heading: "Privacy Policy",
    updated: "Last updated: 2026",
    sections: [
      {
        title: "What we collect",
        body: "When you sign in with Google, we store your name, email address, and profile photo. If you register a startup, we store the details you submit (name, tagline, description, logo and website links). When you vote on a match, we record which side you voted for and the IP address the vote came from, used to prevent duplicate voting and abuse.",
      },
      {
        title: "Why we collect it",
        body: "To run your account and startup entries, display tournament results, protect voting from bots and duplicate votes (via Cloudflare Turnstile), and send transactional emails such as registration confirmations and tournament updates.",
      },
      {
        title: "Cookies",
        body: "We use a cookie to remember your language preference and a session cookie to keep you signed in. We do not use advertising or third-party tracking cookies.",
      },
      {
        title: "Who we share data with",
        body: "Google (sign-in), Resend (transactional email delivery), Cloudflare (bot protection), MongoDB Atlas (data storage), and Vercel (hosting). We do not sell your data.",
      },
      {
        title: "Data retention",
        body: "We keep your account, startup, and vote data for as long as your account exists. Contact us if you'd like your data deleted.",
      },
      {
        title: "Contact",
        body: `Questions about this policy or your data? Email us at ${CONTACT_EMAIL}.`,
      },
    ],
  },
  ka: {
    heading: "კონფიდენციალურობის პოლიტიკა",
    updated: "ბოლოს განახლდა: 2026",
    sections: [
      {
        title: "რას ვაგროვებთ",
        body: "როცა Google-ით შედიხართ სისტემაში, ვინახავთ თქვენს სახელს, ელფოსტის მისამართს და პროფილის ფოტოს. თუ დაარეგისტრირებთ სტარტაპს, ვინახავთ თქვენს მიერ მითითებულ დეტალებს (სახელი, სლოგანი, აღწერა, ლოგო და ვებგვერდის ბმულები). ხმის მიცემისას ვინახავთ, რომელ მხარეს დაუჭირეთ მხარი და იმ IP მისამართს, საიდანაც ხმა მოვიდა — ეს გამოიყენება განმეორებითი და თაღლითური ხმების თავიდან ასაცილებლად.",
      },
      {
        title: "რატომ ვაგროვებთ",
        body: "თქვენი ანგარიშისა და სტარტაპის მართვისთვის, ტურნირის შედეგების ჩვენებისთვის, ხმის მიცემის ბოტებისა და გამეორებული ხმებისგან დასაცავად (Cloudflare Turnstile-ის მეშვეობით) და ტრანზაქციული ელფოსტების (რეგისტრაციის დადასტურება, ტურნირის განახლებები) გასაგზავნად.",
      },
      {
        title: "ქუქიები",
        body: "ვიყენებთ ქუქის თქვენი ენის პარამეტრის დასამახსოვრებლად და სესიის ქუქის სისტემაში შესვლის შესანარჩუნებლად. სარეკლამო ან მესამე მხარის თვალთვალის ქუქიებს არ ვიყენებთ.",
      },
      {
        title: "ვისთანაც ვიზიარებთ მონაცემებს",
        body: "Google (სისტემაში შესვლა), Resend (ტრანზაქციული ელფოსტის გაგზავნა), Cloudflare (ბოტებისგან დაცვა), MongoDB Atlas (მონაცემთა შენახვა) და Vercel (ჰოსტინგი). თქვენს მონაცემებს არ ვყიდით.",
      },
      {
        title: "მონაცემთა შენახვის ვადა",
        body: "თქვენი ანგარიშის, სტარტაპისა და ხმის მონაცემებს ვინახავთ, სანამ თქვენი ანგარიში აქტიურია. თუ გსურთ მონაცემების წაშლა, დაგვიკავშირდით.",
      },
      {
        title: "კონტაქტი",
        body: `კითხვები ამ პოლიტიკასთან ან თქვენს მონაცემებთან დაკავშირებით? მოგვწერეთ: ${CONTACT_EMAIL}`,
      },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return { alternates: localeAlternates(locale, "/privacy") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const content = SECTIONS[lang as Locale];

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{content.heading}</h1>
      <p className="mt-1 text-sm text-text-muted">{content.updated}</p>
      <div className="mt-8 flex flex-col gap-6">
        {content.sections.map((s) => (
          <div key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-1 text-text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
