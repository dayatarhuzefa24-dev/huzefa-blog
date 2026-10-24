import type { Metadata } from "next";

// The dashboard must never be indexed.
export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    "max-image-preview": "large",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
