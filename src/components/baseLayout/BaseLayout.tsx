"use client";

import { useBackground } from "@/components/contexts/backgroundContext/BackgroundManager";
import Background from "@/components/contexts/backgroundContext/background/Background";
import ThemeManager from "@/components/contexts/themeManager/ThemeManager";
import { FrameManager } from "@/components/contexts/FrameManager/FrameManager";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showBackground } = useBackground();

  return (
    <ThemeManager>
      {showBackground && <Background />}
      <FrameManager>{children}</FrameManager>
    </ThemeManager>
  );
}
