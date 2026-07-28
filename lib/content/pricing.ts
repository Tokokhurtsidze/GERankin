import type { Locale } from "@/lib/i18n/config";

export interface PricingPlan {
  name: string;
  tagline: string;
  price: string;
  period: string;
  highlighted: boolean;
  features: string[];
  cta: string;
  ctaHref: string;
}

const PRICING_PLANS_EN: PricingPlan[] = [
  {
    name: "Founder Boost",
    tagline: "Get discovered before the bracket closes",
    price: "Free",
    period: "always",
    highlighted: false,
    features: [
      "One entry per tournament",
      "Live vote count + timeline discussion",
      "Homepage champion showcase if you win",
      "Founder dashboard: votes, clicks, seed",
    ],
    cta: "Register your startup",
    ctaHref: "auth/register",
  },
  {
    name: "Featured Homepage Spot",
    tagline: "Hero visibility to every visitor, win or lose",
    price: "$29",
    period: "per week",
    highlighted: true,
    features: [
      "Featured card on the homepage hero",
      "Direct CTA button to your site",
      "Priority placement in the sidebar rail",
      "Cancel anytime — no long-term contract",
    ],
    cta: "Get in touch",
    ctaHref: "mailto:hello@startupclash.ge?subject=Featured%20Homepage%20Spot",
  },
];

const PRICING_PLANS_KA: PricingPlan[] = [
  {
    name: "Founder Boost",
    tagline: "მოხვდი ყურადღების ცენტრში ბრეკეტის დახურვამდე",
    price: "უფასო",
    period: "ყოველთვის",
    highlighted: false,
    features: [
      "ერთი განაცხადი თითო ტურნირზე",
      "ცოცხალი ხმების მთვლელი + თაიმლაინის განხილვა",
      "ჩემპიონის წარმოჩენა მთავარ გვერდზე გამარჯვების შემთხვევაში",
      "დამფუძნებლის დაშბორდი: ხმები, კლიკები, სიდი",
    ],
    cta: "დაარეგისტრირე შენი სტარტაპი",
    ctaHref: "auth/register",
  },
  {
    name: "Featured Homepage Spot",
    tagline: "მთავარი გვერდის ხილვადობა ყველა ვიზიტორისთვის, მოგებაზე თუ წაგებაზე",
    price: "$29",
    period: "კვირაში",
    highlighted: true,
    features: [
      "გამორჩეული ბარათი მთავარი გვერდის ჰერო სექციაში",
      "პირდაპირი CTA ღილაკი შენს საიტზე",
      "პრიორიტეტული განთავსება გვერდით პანელზე",
      "გააუქმე ნებისმიერ დროს — ხანგრძლივი კონტრაქტის გარეშე",
    ],
    cta: "დაგვიკავშირდი",
    ctaHref: "mailto:hello@startupclash.ge?subject=Featured%20Homepage%20Spot",
  },
];

export function getPricingPlans(locale: Locale): PricingPlan[] {
  return locale === "ka" ? PRICING_PLANS_KA : PRICING_PLANS_EN;
}
