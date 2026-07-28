import type { Locale } from "@/lib/i18n/config";

export interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS_EN: FaqItem[] = [
  {
    question: "How does Startup Clash GE work?",
    answer:
      "It's a weekly single-elimination tournament for the Georgian startup ecosystem. Register your startup during the open window, get matched 1v1 against similar products, and let public votes decide who advances round by round until a champion is crowned.",
  },
  {
    question: "What is the registration window?",
    answer:
      "Each tournament opens a single 1-hour public registration window. Once it closes, no more entries are accepted and the bracket is generated immediately.",
  },
  {
    question: "How many startups can enter?",
    answer:
      "Between 2 and 32. One startup per account — you can't register more than one entry per tournament.",
  },
  {
    question: "How is the bracket built if the entrant count isn't a power of two?",
    answer:
      "The bracket size is rounded up to the next power of two (2, 4, 8, 16, or 32). Top seeds (earliest registrants) receive a bye and advance automatically to round 2 if there aren't enough entrants to fill every first-round slot.",
  },
  {
    question: "How does voting work?",
    answer:
      "Each round runs on a countdown set by the organizer. Every verified, logged-in account gets one vote per matchup, gated by a Cloudflare Turnstile bot check and a verified email address.",
  },
  {
    question: "How are ties handled?",
    answer:
      "A 50/50 result at the round deadline triggers an overtime period. If it's still tied after the overtime cap, the win goes to whichever side received its first vote earliest.",
  },
  {
    question: "What does the winner get?",
    answer:
      "The champion is featured on the homepage hero — logo, tagline, and a direct link to their site — until the next tournament crowns a new one.",
  },
  {
    question: "Can I discuss a matchup?",
    answer: "Yes — every match card has a Timeline section for live comments, open to anyone with an account.",
  },
];

const FAQ_ITEMS_KA: FaqItem[] = [
  {
    question: "როგორ მუშაობს Startup Clash GE?",
    answer:
      "ეს არის ყოველკვირეული ერთჯერადი გამორიცხვის ტურნირი ქართული სტარტაპ ეკოსისტემისთვის. დაარეგისტრირე შენი სტარტაპი ღია ფანჯრის დროს, მოხვდი 1-ის-წინააღმდეგ-1 დაპირისპირებაში მსგავს პროდუქტთან და მიეცი საშუალება საზოგადოებას ხმის მიცემით გადაწყვიტოს, ვინ გავა შემდეგ რაუნდში, სანამ არ გამოვლინდება ჩემპიონი.",
  },
  {
    question: "რა არის რეგისტრაციის ფანჯარა?",
    answer:
      "თითოეული ტურნირი ხსნის ერთ 1-საათიან საჯარო რეგისტრაციის ფანჯარას. მისი დახურვის შემდეგ ახალი განაცხადები აღარ მიიღება და ბრეკეტი მაშინვე გენერირდება.",
  },
  {
    question: "რამდენი სტარტაპი შეიძლება მონაწილეობდეს?",
    answer: "2-დან 32-მდე. ერთი სტარტაპი თითო ანგარიშზე — ერთ ტურნირზე ერთზე მეტი განაცხადის შეტანა არ შეიძლება.",
  },
  {
    question: "როგორ შენდება ბრეკეტი, თუ მონაწილეთა რაოდენობა ორის ხარისხი არ არის?",
    answer:
      "ბრეკეტის ზომა მრგვალდება ორის უახლოეს ხარისხამდე (2, 4, 8, 16 ან 32). საუკეთესო სიდები (ადრეული რეგისტრანტები) იღებენ ავტომატურ გავლას მე-2 რაუნდში, თუ საკმარისი მონაწილე არ არის ყველა პირველი რაუნდის ადგილის შესავსებად.",
  },
  {
    question: "როგორ მუშაობს ხმის მიცემა?",
    answer:
      "თითოეული რაუნდი მიდის ორგანიზატორის მიერ დაწესებული უკუათვლით. ყოველ დადასტურებულ, შესულ ანგარიშს აქვს ერთი ხმა თითო დაპირისპირებაზე, დაცული Cloudflare Turnstile-ის ბოტების შემოწმებითა და დადასტურებული ელფოსტით.",
  },
  {
    question: "როგორ წყდება ფრედი?",
    answer:
      "50/50 შედეგი რაუნდის ვადის ამოწურვისას იწვევს დამატებით დროს. თუ ისევ ფრედია დამატებითი დროის ლიმიტის შემდეგ, გამარჯვება ენიჭება იმ მხარეს, ვინც ყველაზე ადრე მიიღო პირველი ხმა.",
  },
  {
    question: "რას იღებს გამარჯვებული?",
    answer:
      "ჩემპიონი წარმოჩინდება მთავარ გვერდზე — ლოგო, სლოგანი და პირდაპირი ბმული მათ საიტზე — შემდეგი ტურნირის ახალი ჩემპიონის გამოვლენამდე.",
  },
  {
    question: "შემიძლია დაპირისპირების განხილვა?",
    answer: "დიახ — ყოველ მატჩის ბარათს აქვს თაიმლაინის სექცია ცოცხალი კომენტარებისთვის, ღია ნებისმიერი ანგარიშისთვის.",
  },
];

export function getFaqItems(locale: Locale): FaqItem[] {
  return locale === "ka" ? FAQ_ITEMS_KA : FAQ_ITEMS_EN;
}
