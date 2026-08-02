"use client";

import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  // Add context providers here (e.g., AuthProvider, ThemeProvider)
  return <>{children}</>;
}
