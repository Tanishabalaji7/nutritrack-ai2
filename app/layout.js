import "./globals.css";

export const metadata = {
  title: "NutriTrack AI — Next-Gen Nutrition Tracking",
  description: "Track calories, macros, water, and get AI-powered nutrition coaching.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-display">{children}</body>
    </html>
  );
}
