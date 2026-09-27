import OpenAI from "openai";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

const schema={type:"object",additionalProperties:false,properties:{documentType:{type:"string",enum:["invoice","quotation","receipt","delivery_note","purchase_order","statement"]},client:{type:"object",additionalProperties:false,properties:{name:{type:"string"},company:{type:"string"},email:{type:"string"},phone:{type:"string"},address:{type:"string"}},required:["name","company","email","phone","address"]},project:{type:"string"},timeline:{type:"string"},items:{type:"array",items:{type:"object",additionalProperties:false,properties:{description:{type:"string"},quantity:{type:"number"},unit:{type:"string"},unitPrice:{type:"number"},taxRate:{type:"number"}},required:["description","quantity","unit","unitPrice","taxRate"]}},notes:{type:"string"},terms:{type:"string"},receivedFrom:{type:"string"},amountPaid:{type:"number"},paymentMethod:{type:"string"},paymentReference:{type:"string"},text:{type:"string"}},required:["documentType","client","project","timeline","items","notes","terms","receivedFrom","amountPaid","paymentMethod","paymentReference","text"]};

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Please sign in to use AI tools."},{status:401});
 const body=await request.json().catch(()=>null);
 if(!body?.input||typeof body.input!=="string"||body.input.length>12000)return NextResponse.json({error:"Please enter a reasonable amount of text."},{status:400});
 const {data:business}=await supabase.from("bizdocs_businesses").select("id,default_currency").eq("owner_id",user.id).maybeSingle();
 if(!business)return NextResponse.json({error:"Set up your workspace before using AI tools."},{status:400});
 const monthStart=new Date();monthStart.setDate(1);monthStart.setHours(0,0,0,0);
 const {count}=await supabase.from("bizdocs_ai_usage").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",monthStart.toISOString());
 if((count||0)>=30)return NextResponse.json({error:"You have reached the monthly AI limit for this workspace. You can still create documents manually."},{status:429});
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"AI is not configured on this deployment yet."},{status:503});
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
 const type=body.type||"invoice";const currency=body.currency||business.default_currency||"UGX";
 const instructions="You are the structured document assistant for BizDocs AI. The user owns the final document. Never invent facts. Never create prices, tax rates, names, credentials, guarantees, awards, testimonials, statistics or payment details that the user did not supply or that are not already present in CURRENT DATA. When a value is missing, return an empty string or 0. Do not guess. Preserve supplied numeric prices exactly; only normalize obvious shorthand such as 2.5m to 2500000. Tax rates must only be returned when explicitly supplied. Currency is "+currency+". Return professional concise wording without marketing fluff. Current document type is "+type+". CURRENT DATA: "+JSON.stringify(body.current||{});
 const prompt=body.mode==="rewrite"?instructions+" Rewrite only this text professionally. Do not add facts. TEXT: "+body.input:instructions+" Create or structure a "+type+" from these rough notes: "+body.input;
 try{
  const rsp=await client.responses.create({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",instructions:prompt,input:"Return only structured JSON.",text:{format:{type:"json_schema",name:"bizdocs_document",strict:true,schema}},store:false});
  let parsed:any;try{parsed=JSON.parse(rsp.output_text||"{}")}catch{throw new Error("Invalid structured response")}
  const clean={documentType:["invoice","quotation","receipt","delivery_note","purchase_order","statement"].includes(parsed.documentType)?parsed.documentType:type,client:{name:String(parsed.client?.name||""),company:String(parsed.client?.company||""),email:String(parsed.client?.email||""),phone:String(parsed.client?.phone||""),address:String(parsed.client?.address||"")},project:String(parsed.project||""),timeline:String(parsed.timeline||""),items:Array.isArray(parsed.items)?parsed.items.slice(0,50).map((i:any)=>({description:String(i.description||"").slice(0,300),quantity:Number.isFinite(Number(i.quantity))?Math.max(.001,Number(i.quantity)):1,unit:String(i.unit||"item").slice(0,60),unitPrice:Number.isFinite(Number(i.unitPrice))?Math.max(0,Number(i.unitPrice)):0,taxRate:Number.isFinite(Number(i.taxRate))?Math.min(100,Math.max(0,Number(i.taxRate))):0})):[],notes:String(parsed.notes||""),terms:String(parsed.terms||""),receivedFrom:String(parsed.receivedFrom||""),amountPaid:Math.max(0,Number(parsed.amountPaid)||0),paymentMethod:String(parsed.paymentMethod||""),paymentReference:String(parsed.paymentReference||""),text:String(parsed.text||"")};
  await supabase.from("bizdocs_ai_usage").insert({business_id:business.id,user_id:user.id,operation:body.mode==="rewrite"?"rewrite":"generate",model:process.env.OPENAI_MODEL||"gpt-5.6-luna"});
  return NextResponse.json({data:clean});
 }catch{ return NextResponse.json({error:"The AI assistant could not complete that request. Please try again or continue manually."},{status:500}) }
}