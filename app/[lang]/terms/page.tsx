import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";

const CONTACT_EMAIL = "khurtsidzetoko@gmail.com";

const SECTIONS: Record<Locale, { heading: string; updated: string; sections: { title: string; body: string }[] }> = {
  en: {
    heading: "Terms of Service",
    updated: "Last updated: 2026",
    sections: [
      {
        title: "Using Startup Clash GE",
        body: "By creating an account you agree to these terms. You must be authorized to represent any startup you register — one startup entry per account, per tournament.",
      },
      {
        title: "Voting",
        body: "Votes are public and counted per match. Using bots, scripts, multiple accounts, or paid vote farms to manipulate results is not allowed and may lead to disqualification or account termination. We use Cloudflare Turnstile to help enforce this.",
      },
      {
        title: "Your content",
        body: "You keep ownership of the name, tagline, description, logo, and links you submit for your startup. By registering, you grant us a license to display that content on the platform for the duration of the tournament and afterward as part of our public results/history.",
      },
      {
        title: "Prohibited conduct",
        body: "No spam, impersonation, fraudulent startup entries, harassment in comments, or attempts to disrupt voting or the platform.",
      },
      {
        title: "Termination",
        body: "We may remove content or suspend accounts that violate these terms, including disqualifying a startup from a tournament for vote manipulation.",
      },
      {
        title: "No warranty",
        body: "The platform is provided \"as is\" without warranties of any kind. We don't guarantee uninterrupted availability or that voting outcomes reflect any particular measure of startup quality.",
      },
      {
        title: "Changes",
        body: "We may update these terms as the platform evolves. Continued use after a change means you accept the update.",
      },
      {
        title: "Contact",
        body: `Questions about these terms? Email us at ${CONTACT_EMAIL}.`,
      },
    ],
  },
  ka: {
    heading: "მომსახურების პირობები",
    updated: "ბოლოს განახლდა: 2026",
    sections: [
      {
        title: "Startup Clash GE-ის გამოყენება",
        body: "ანგარიშის შექმნით თქვენ ეთანხმებით ამ პირობებს. თქვენ უნდა გქონდეთ უფლებამოსილება წარმოადგინოთ ნებისმიერი სტარტაპი, რომელსაც არეგისტრირებთ — ერთი სტარტაპი ერთ ანგარიშზე, თითოეულ ტურნირზე.",
      },
      {
        title: "ხმის მიცემა",
        body: "ხმები საჯაროა და ითვლება მატჩის მიხედვით. ბოტების, სკრიპტების, მრავალი ანგარიშის ან ფასიანი ხმების ფერმების გამოყენება შედეგების მანიპულირებისთვის დაუშვებელია და შეიძლება გამოიწვიოს დისკვალიფიკაცია ან ანგარიშის დაბლოკვა. ამის აღსაკვეთად ვიყენებთ Cloudflare Turnstile-ს.",
      },
      {
        title: "თქვენი კონტენტი",
        body: "თქვენ ინარჩუნებთ საკუთრებას სახელზე, სლოგანზე, აღწერაზე, ლოგოსა და ბმულებზე, რომლებსაც თქვენი სტარტაპისთვის წარადგენთ. რეგისტრაციით თქვენ გვანიჭებთ ლიცენზიას ამ კონტენტის პლატფორმაზე ჩვენებაზე ტურნირის განმავლობაში და შემდეგაც, საჯარო შედეგების/ისტორიის ნაწილად.",
      },
      {
        title: "აკრძალული ქმედებები",
        body: "დაუშვებელია სპამი, სხვისი ვინაობის მითვისება, გაყალბებული სტარტაპის ჩანაწერები, კომენტარებში შევიწროება, ან ხმის მიცემის თუ პლატფორმის ფუნქციონირების ხელის შეშლის მცდელობა.",
      },
      {
        title: "შეწყვეტა",
        body: "შეგვიძლია წავშალოთ კონტენტი ან დავბლოკოთ ანგარიშები, რომლებიც არღვევენ ამ პირობებს, მათ შორის დავადისკვალიფიციროთ სტარტაპი ტურნირიდან ხმების მანიპულირებისთვის.",
      },
      {
        title: "გარანტიის არარსებობა",
        body: "პლატფორმა მოწოდებულია „როგორც არის“, არავითარი გარანტიის გარეშე. არ ვიძლევით გარანტიას შეუფერხებელ ხელმისაწვდომობაზე ან იმაზე, რომ ხმის მიცემის შედეგები ასახავს სტარტაპის ხარისხის რაიმე კონკრეტულ საზომს.",
      },
      {
        title: "ცვლილებები",
        body: "შესაძლოა განვაახლოთ ეს პირობები პლატფორმის განვითარებასთან ერთად. ცვლილების შემდეგ გამოყენების გაგრძელება ნიშნავს განახლების მიღებას.",
      },
      {
        title: "კონტაქტი",
        body: `კითხვები ამ პირობებთან დაკავშირებით? მოგვწერეთ: ${CONTACT_EMAIL}`,
      },
    ],
  },
};

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
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
