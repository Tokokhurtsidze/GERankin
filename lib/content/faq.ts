export const FAQ_ITEMS = [
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
