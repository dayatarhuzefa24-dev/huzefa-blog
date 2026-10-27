import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsOfServicePage() {
  return (
    <StaticPage title="Terms of Service">
      {/* TODO: Replace this placeholder with your real terms before applying to AdSense. */}
      <p>This is a placeholder Terms of Service page. Replace it with your full terms.</p>
    </StaticPage>
  );
}
