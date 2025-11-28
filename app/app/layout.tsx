import type { Metadata } from "next";
import { Crimson_Text, Inter, Ubuntu_Sans } from "next/font/google";

import Header from "@/components/Header";
import Wrapper from "@/components/Wrapper";

import "@/styles/main.scss";
import "@/styles/globals.css";

const inter = Inter({
    variable: "--inter",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700"],
});

const ubuntu = Ubuntu_Sans({
    variable: "--ubuntu",
    subsets: ["latin"],
    display: "swap",
    weight: ["300", "400", "500"],
});

const crimsonText = Crimson_Text({
    variable: "--crimson-text",
    subsets: ["latin"],
    weight: ["600"],
    display: "swap",
    style: "italic"
});

export const metadata: Metadata = {
    title: "Diffipedia",
    description:
        "Diffipedia is a comparison platform where you can compare Wikipedia and Grokipedia articles side by side.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${ubuntu.variable} ${crimsonText.variable} antialiased`}>
                <Wrapper>
                    <Header />
                    <main className="h-[calc(100dvh-32px-40px-2px)]">{children}</main>
                </Wrapper>
            </body>
        </html>
    );
}
