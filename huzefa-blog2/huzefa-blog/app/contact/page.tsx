import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us">
      {/* TODO: Replace with your real contact email (and optionally a contact form). */}
      <p>
        Questions, tips or collaboration ideas? Email{" "}
        <a href="mailto:hello@example.com">hello@example.com</a>.
      </p>
    </StaticPage>
  );
}
