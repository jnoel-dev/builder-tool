'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const BackgroundContext = createContext<{
  showBackground: boolean;
  setShowBackground: (value: boolean) => void;
}>({
  showBackground: true,
  setShowBackground: () => {},
});

export function BackgroundManager({ children }: { children: ReactNode }) {
  const [showBackground, setShowBackground] = useState(true);
  return (
    <BackgroundContext.Provider value={{ showBackground, setShowBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(BackgroundContext);
}
