import './globals.css';
import { BackgroundManager } from '@/components/contexts/backgroundContext/BackgroundManager';
import BaseLayout from '@/components/baseLayout/BaseLayout';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <BackgroundManager>
          <BaseLayout>{children}</BaseLayout>
        </BackgroundManager>
      </body>
    </html>
  );
}
