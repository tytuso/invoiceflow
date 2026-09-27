import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = { title:"BizDocs AI — Beautiful Business Documents Made Simple", description:"Create professional invoices, quotations, receipts and business documents in seconds with BizDocs AI.", applicationName:"BizDocs AI", manifest:"/manifest.webmanifest", icons:{icon:"/icon.svg",apple:"/icon.svg"}, openGraph:{title:"BizDocs AI — Beautiful Business Documents Made Simple",description:"Beautiful business documents. Made simple.",type:"website"} };
export const viewport: Viewport = { width:"device-width", initialScale:1, viewportFit:"cover", themeColor:"#234A8A" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-theme="light"><body><ThemeProvider><PwaRegister/>{children}</ThemeProvider></body></html>}
