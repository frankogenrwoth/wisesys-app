import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KnowledgeTree",
  description: "Sign in to KnowledgeTree",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
