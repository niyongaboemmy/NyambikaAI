import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Contact • NyambikaAI",
  description: "Reach out to the NyambikaAI team for support, partnerships, or questions.",
};

export default function ContactPage() {
  return (
    <div className="py-10">
      <PageHeader badge="Contact" badgeTone="blue" titleKey="contact.title" subtitleKey="contact.subtitle" />

      <ContactForm />
    </div>
  );
}
