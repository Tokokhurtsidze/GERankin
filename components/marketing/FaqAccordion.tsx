import { Accordion } from "@/components/ui/Accordion";
import { FAQ_ITEMS } from "@/lib/content/faq";

export function FaqAccordion() {
  return <Accordion items={FAQ_ITEMS} />;
}
