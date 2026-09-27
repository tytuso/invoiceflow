import {createClient} from "@/lib/supabase/server";import{NextResponse}from"next/server";

const APP_ORIGIN=process.env.NEXT_PUBLIC_APP_URL||"https://invoice.nileai.solutions";

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const candidate=url.searchParams.get("next");
  const next=candidate&&candidate.startsWith("/")&&!candidate.startsWith("//")?candidate:"/app";
  if(code){
    const supabase=await createClient();
    const{error}=await supabase.auth.exchangeCodeForSession(code);
    if(error){
      const errorUrl=new URL("/login",APP_ORIGIN);
      errorUrl.searchParams.set("error","auth_callback");
      return NextResponse.redirect(errorUrl);
    }
  }
  return NextResponse.redirect(new URL(next,APP_ORIGIN));
}