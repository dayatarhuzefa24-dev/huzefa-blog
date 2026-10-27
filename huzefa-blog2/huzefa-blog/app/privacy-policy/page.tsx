import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <StaticPage title="Privacy Policy">
      {/* TODO: Replace this placeholder with your real policy before applying to AdSense.
          It should cover cookies, Google AdSense / DoubleClick cookies, analytics and contact details. */}
      <p>This is a placeholder Privacy Policy page. Replace it with your full policy.</p>
    </StaticPage>
  );
}
