import "./globals.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Background from "@/components/background/Background";
import ThemeManager from "@/components/themeManager/ThemeManager";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeManager>
        <Background/>
        
        {children}
        </ThemeManager>
      </body>
    </html>
  );
}
