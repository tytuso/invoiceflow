"use client";

import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {BarChart3,FilePlus2,FileText,LayoutDashboard,LogOut,Moon,Package,Settings,Sun,Users2} from "lucide-react";
import {LogoMark} from "./LogoMark";
import {useTheme} from "./ThemeProvider";
import {createClient} from "@/lib/supabase/client";
import type {Business} from "@/lib/types";
import {InstallPrompt} from "./InstallPrompt";
import {useEffect,useState} from "react";

const nav=[{href:"/app",label:"Home",icon:LayoutDashboard},{href:"/app/documents",label:"Documents",icon:FileText},{href:"/app/clients",label:"Clients",icon:Users2},{href:"/app/products",label:"Products",icon:Package},{href:"/app/analytics",label:"Analytics",icon:BarChart3},{href:"/app/settings",label:"Settings",icon:Settings}];

export function AppShell({business,children}:{business:Business|null;children:React.ReactNode}){
 const pathname=usePathname(),router=useRouter(),{mode,setMode}=useTheme(); const [online,setOnline]=useState(true);
 useEffect(()=>{setOnline(navigator.onLine);const on=()=>setOnline(true),off=()=>setOnline(false);addEventListener("online",on);addEventListener("offline",off);return()=>{removeEventListener("online",on);removeEventListener("offline",off)}},[]);
 async function logout(){await createClient().auth.signOut();router.replace("/login")}
 return <div className="min-h-screen bg-[var(--bg)]">
  {!online&&<div className="fixed left-0 right-0 top-0 z-[80] bg-[var(--text-strong)] px-3 py-1.5 text-center text-[11px] font-semibold text-[var(--surface)]">You're offline · local drafts remain available</div>}
  <aside className="fixed inset-y-0 left-0 z-50 hidden w-[232px] border-r border-[var(--line)] bg-[var(--surface)] px-3 py-5 lg:flex lg:flex-col">
   <div className="px-3 pb-5"><LogoMark href="/app"/></div>
   <div className="px-2"><Link href="/app/documents/new" className="btn-primary w-full"><FilePlus2 size={16}/>Create Document</Link></div>
   <nav className="mt-6 space-y-1">{nav.map(({href,label,icon:Icon})=>{const active=href==="/app"?pathname==="/app":pathname.startsWith(href);return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active?"bg-[var(--accent)] text-[var(--brand)]":"text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)]"}`}><Icon size={17}/>{label}</Link>})}</nav>
   <div className="mt-auto space-y-2 px-1"><button onClick={()=>setMode(mode==="dark"?"light":"dark")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)]">{mode==="dark"?<Sun size={17}/>:<Moon size={17}/>} {mode==="dark"?"Light mode":"Dark mode"}</button><div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3"><div className="truncate text-sm font-semibold text-[var(--text-strong)]">{business?.name||"Your workspace"}</div><div className="mt-1 text-xs text-[var(--text-soft)]">BizDocs AI</div></div><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><LogOut size={17}/>Sign out</button></div>
  </aside>
  <main className="lg:pl-[232px]"><div className="min-h-screen pb-20 lg:pb-0">{children}</div></main>
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--line)] bg-[var(--surface)]/95 px-2 py-2 backdrop-blur-xl lg:hidden"><div className="grid grid-cols-5 gap-1">{[["/app","Home",LayoutDashboard],["/app/documents","Docs",FileText],["/app/clients","Clients",Users2],["/app/documents/new","Create",FilePlus2],["/app/settings","Settings",Settings]].map(([href,label,Icon]:any)=><Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold ${pathname===href?"text-[var(--brand)]":"text-[var(--text-soft)]"}`}><Icon size={18}/>{label}</Link>)}</div></nav>
  <InstallPrompt/>
 </div>
}