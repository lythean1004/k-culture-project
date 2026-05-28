import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Providers from "@/components/providers/Providers";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "K-Culture Curation Platform",
  description: "Curated cultural tours for foreign tourists in Korea",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // next-intl v3: 서버에서 메시지를 로드하여 클라이언트 Provider에 전달
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
