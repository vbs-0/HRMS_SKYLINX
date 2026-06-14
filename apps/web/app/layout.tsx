import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeopleOS",
  description: "Complete HRMS, payroll, attendance, leave and recruitment platform",
};

// Applies the saved theme/density before paint to avoid a flash (sections/02 §6).
const NO_FLASH = `(function(){try{var d=document.documentElement;
var t=localStorage.getItem('peopleos_theme')||'system';
var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
d.setAttribute('data-theme',dark?'dark':'light');
d.setAttribute('data-density',localStorage.getItem('peopleos_density')||'comfortable');
}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
