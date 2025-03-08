import "./globals.css";
import Background from "@/components/background/Background";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Background/>
        {children}
      </body>
    </html>
  );
}
