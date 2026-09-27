import { formatMoney, documentLabel } from "@/lib/constants";
import type { DocumentData, LineItem, StatementTransaction, ThemeName } from "@/lib/types";

function titleFor(type: DocumentData["type"]){ return documentLabel(type).toUpperCase(); }
function dateText(v?:string){ if(!v) return "—"; return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(v+"T00:00:00")); }

const styles:Record<ThemeName,{ink:string;muted:string;rule:string;accentMode:"bar"|"rule"|"dot"|"plain"}>={
  classic:{ink:"#263244",muted:"#687386",rule:"#dfe4ea",accentMode:"rule"},
  modern:{ink:"#172033",muted:"#667085",rule:"#e2e7ee",accentMode:"bar"},
  executive:{ink:"#18202d",muted:"#6b7280",rule:"#d9dee6",accentMode:"dot"},
  minimal:{ink:"#20242b",muted:"#717780",rule:"#e6e8eb",accentMode:"plain"}
};

function chunk<T>(arr:T[],size:number){ const out:T[][]=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out.length?out:[[]]; }

function Totals({data,s}:{data:DocumentData;s:{ink:string;muted:string;rule:string}}){
 return <div style={{marginLeft:"auto",width:290,marginTop:26}}>
   <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:11,color:s.muted}}><span>Subtotal</span><span style={{color:s.ink,fontWeight:600}}>{formatMoney(data.subtotal,data.currency)}</span></div>
   {data.discount>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:11,color:s.muted}}><span>Discount</span><span style={{color:s.ink}}>-{formatMoney(data.discount,data.currency)}</span></div>}
   {data.tax>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:11,color:s.muted}}><span>Tax</span><span style={{color:s.ink}}>{formatMoney(data.tax,data.currency)}</span></div>}
   <div style={{marginTop:8,paddingTop:12,borderTop:`2px solid ${s.ink}`,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><span style={{fontSize:12,fontWeight:700,color:s.ink}}>TOTAL</span><span style={{fontSize:20,fontWeight:750,letterSpacing:"-.03em",color:s.ink}}>{formatMoney(data.total,data.currency)}</span></div>
 </div>
}

function ItemsTable({items,data,s}:{items:LineItem[];data:DocumentData;s:{ink:string;muted:string;rule:string}}){
 return <table style={{width:"100%",borderCollapse:"collapse",fontSize:10.5}}><thead><tr style={{borderBottom:`1px solid ${s.rule}`}}>
 <th style={{textAlign:"left",padding:"9px 0",color:s.muted,fontWeight:700}}>DESCRIPTION</th><th style={{textAlign:"right",padding:"9px 0",color:s.muted,fontWeight:700,width:60}}>QTY</th><th style={{textAlign:"right",padding:"9px 0",color:s.muted,fontWeight:700,width:105}}>RATE</th><th style={{textAlign:"right",padding:"9px 0",color:s.muted,fontWeight:700,width:120}}>AMOUNT</th></tr></thead>
 <tbody>{items.map((it,i)=><tr key={it.id||i} style={{borderBottom:`1px solid ${s.rule}`,breakInside:"avoid"}}><td style={{padding:"12px 0",color:s.ink,fontWeight:550}}><div>{it.description||"Item"}</div><div style={{marginTop:3,color:s.muted,fontSize:9.5}}>{it.unit||"item"}</div></td><td style={{padding:"12px 0",textAlign:"right",color:s.ink}}>{it.quantity}</td><td style={{padding:"12px 0",textAlign:"right",color:s.ink}}>{formatMoney(it.unitPrice,data.currency)}</td><td style={{padding:"12px 0",textAlign:"right",color:s.ink,fontWeight:650}}>{formatMoney(it.amount,data.currency)}</td></tr>)}</tbody></table>
}

function StatementTable({transactions,currency,s}:{transactions:StatementTransaction[];currency:string;s:{ink:string;muted:string;rule:string}}){
 return <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}><thead><tr style={{borderBottom:`1px solid ${s.rule}`}}>{["DATE","REFERENCE","DESCRIPTION","DEBIT","CREDIT","BALANCE"].map(x=><th key={x} style={{textAlign:x==="DESCRIPTION"?"left":"right",padding:"8px 0",color:s.muted,fontWeight:700}}>{x}</th>)}</tr></thead>
 <tbody>{transactions.map((t,i)=><tr key={t.id||i} style={{borderBottom:`1px solid ${s.rule}`,breakInside:"avoid"}}><td style={{padding:"10px 0",color:s.ink}}>{dateText(t.transactionDate)}</td><td style={{padding:"10px 0",textAlign:"right",color:s.muted}}>{t.reference||"—"}</td><td style={{padding:"10px 0 10px 12px",color:s.ink,fontWeight:550}}>{t.description}</td><td style={{padding:"10px 0",textAlign:"right"}}>{t.debit?formatMoney(t.debit,currency):"—"}</td><td style={{padding:"10px 0",textAlign:"right"}}>{t.credit?formatMoney(t.credit,currency):"—"}</td><td style={{padding:"10px 0",textAlign:"right",fontWeight:650}}>{formatMoney(t.balance,currency)}</td></tr>)}</tbody></table>
}

export function DocumentRenderer({data,mode="app"}:{data:DocumentData;mode?: "app"|"marketing"}){
 const s=styles[data.theme]||styles.modern, pages=chunk(data.items,mode==="marketing"?5:7), accent=data.branding.brandColor||"#234A8A";
 const isReceipt=data.type==="receipt", isStatement=data.type==="statement", isDelivery=data.type==="delivery_note";
 const statementTx=data.payload.transactions||[];
 return <div className={`document-preview-wrap ${mode==="app"?"print-root":""}`}>
 {pages.map((items,pi)=><article className="pdf-page" key={pi} style={{padding:"58px 62px 48px",fontFamily:"Inter,Arial,sans-serif"}}>
   <div style={{position:"absolute",top:0,left:0,right:0,height:s.accentMode==="bar"?6:1,background:s.accentMode==="bar"?accent:s.rule}}/>
   <header style={{display:"flex",justifyContent:"space-between",gap:35}}>
     <div style={{minWidth:0,display:"flex",gap:12,alignItems:"flex-start"}}>
       {data.branding.logoUrl?<img src={data.branding.logoUrl} alt="" style={{width:58,height:58,objectFit:"contain",borderRadius:8}}/>:<div style={{width:58,height:58,borderRadius:12,background:data.branding.accentColor||"#e9eef7",display:"grid",placeItems:"center",color:accent,fontWeight:800,fontSize:14}}>{data.branding.businessName.slice(0,2).toUpperCase()}</div>}
       <div><div style={{fontWeight:800,fontSize:17,letterSpacing:"-.02em",color:s.ink}}>{data.branding.businessName||"Your Business"}</div><div style={{marginTop:5,fontSize:9.5,lineHeight:1.6,color:s.muted}}>{data.branding.businessName?null:null}{data.payload.companyLine||""}</div></div>
     </div>
     <div style={{textAlign:"right",minWidth:230}}>
       <div style={{fontSize:29,fontWeight:800,letterSpacing:"-.045em",color:s.ink}}>{titleFor(data.type)}</div>
       <div style={{marginTop:8,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,color:s.muted}}>{data.number}</div>
     </div>
   </header>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:55,marginTop:37}}>
     <div><div style={{fontSize:8.5,fontWeight:800,letterSpacing:".11em",color:accent}}>FROM</div><div style={{marginTop:6,fontSize:11.5,fontWeight:650,color:s.ink}}>{data.branding.businessName}</div><div style={{marginTop:4,fontSize:9.5,lineHeight:1.6,color:s.muted}}>{data.branding.phone||data.payload.businessPhone||""}{(data.branding.phone||data.payload.businessPhone)&&" · "}{data.branding.email||data.payload.businessEmail||""}<br/>{data.payload.businessAddress||""}</div></div>
     <div><div style={{fontSize:8.5,fontWeight:800,letterSpacing:".11em",color:accent}}>{isDelivery?"DELIVER TO":"BILL TO"}</div><div style={{marginTop:6,fontSize:11.5,fontWeight:650,color:s.ink}}>{data.client.name||data.receivedFrom||"Customer"}</div><div style={{marginTop:4,fontSize:9.5,lineHeight:1.6,color:s.muted}}>{data.client.company&&<>{data.client.company}<br/></>}{data.client.email&&<>{data.client.email}<br/></>}{data.client.phone&&<>{data.client.phone}<br/></>}{isDelivery?(data.deliveryAddress||data.client.address||""):(data.client.address||"")}</div></div>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginTop:30,paddingTop:16,borderTop:`1px solid ${s.rule}`}}>
     <div><div style={{fontSize:8.5,color:s.muted,fontWeight:700}}>ISSUE DATE</div><div style={{marginTop:4,fontSize:10.5,color:s.ink,fontWeight:600}}>{dateText(data.issueDate)}</div></div>
     <div><div style={{fontSize:8.5,color:s.muted,fontWeight:700}}>{data.type==="quotation"?"VALID UNTIL":"DUE DATE"}</div><div style={{marginTop:4,fontSize:10.5,color:s.ink,fontWeight:600}}>{dateText(data.type==="quotation"?data.validUntil:data.dueDate)}</div></div>
     <div><div style={{fontSize:8.5,color:s.muted,fontWeight:700}}>CURRENCY</div><div style={{marginTop:4,fontSize:10.5,color:s.ink,fontWeight:600}}>{data.currency}</div></div>
   </div>
   {isReceipt&&<div style={{marginTop:34,padding:"12px 16px",borderRadius:12,background:"#edf8f4",color:"#13795b",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,fontWeight:800,letterSpacing:".09em"}}>PAID</span><span style={{fontSize:16,fontWeight:800}}>{formatMoney(data.amountPaid||data.total,data.currency)}</span></div>}
   <section style={{marginTop:isReceipt?18:32}}>
    {isStatement?<StatementTable transactions={statementTx} currency={data.currency} s={s}/>:<ItemsTable items={items} data={data} s={s}/>}
   </section>
   {!isDelivery&&!isStatement&&!isReceipt&&<Totals data={data} s={s}/>}
   {isReceipt&&<Totals data={{...data,subtotal:data.amountPaid||data.total,discount:0,tax:0,total:data.amountPaid||data.total}} s={s}/>}
   {isStatement&&<div style={{marginTop:18,display:"flex",justifyContent:"flex-end",gap:30,fontSize:10,color:s.muted}}><span>Opening <strong style={{color:s.ink}}>{formatMoney(Number(data.payload.openingBalance||0),data.currency)}</strong></span><span>Closing <strong style={{color:s.ink}}>{formatMoney(Number(data.payload.closingBalance||data.total||0),data.currency)}</strong></span></div>}
   {isDelivery&&<div style={{marginTop:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:50,borderTop:`1px solid ${s.rule}`,paddingTop:18}}><div><div style={{fontSize:8.5,fontWeight:800,color:accent}}>RECEIVED BY</div><div style={{marginTop:22,borderBottom:`1px solid ${s.rule}`,paddingBottom:5,fontSize:10,color:s.ink}}>{data.receivedBy||" "}</div></div><div><div style={{fontSize:8.5,fontWeight:800,color:accent}}>SIGNATURE</div><div style={{marginTop:22,borderBottom:`1px solid ${s.rule}`,paddingBottom:5,fontSize:10,color:s.ink}}>{data.signatureName||" "}</div></div></div>}
   {!isStatement&&<div style={{marginTop:26,display:"grid",gridTemplateColumns:"1.15fr .85fr",gap:42}}>
     <div>{data.paymentInfo&&Object.keys(data.paymentInfo).length>0&&<><div style={{fontSize:8.5,fontWeight:800,letterSpacing:".11em",color:accent}}>PAYMENT INFORMATION</div><div style={{marginTop:7,fontSize:9.5,lineHeight:1.65,color:s.muted}}>{Object.entries(data.paymentInfo).map(([k,v])=><div key={k}><span style={{fontWeight:700,color:s.ink}}>{k.replace(/([A-Z])/g," $1")}:</span> {v}</div>)}</div></>}</div>
     <div>{data.notes&&<><div style={{fontSize:8.5,fontWeight:800,letterSpacing:".11em",color:accent}}>NOTES</div><div style={{marginTop:7,fontSize:9.5,lineHeight:1.6,color:s.muted}}>{data.notes}</div></>}</div>
   </div>}
   {data.terms&&<div style={{marginTop:18,paddingTop:15,borderTop:`1px solid ${s.rule}`}}><div style={{fontSize:8.5,fontWeight:800,letterSpacing:".11em",color:accent}}>TERMS</div><div style={{marginTop:6,fontSize:9.5,lineHeight:1.6,color:s.muted}}>{data.terms}</div></div>}
   <footer style={{position:"absolute",left:62,right:62,bottom:22,display:"flex",justifyContent:"space-between",gap:16,fontSize:8.5,color:"#8993a2"}}><span>{data.branding.footer||data.branding.businessName}</span><span>Page {pi+1} of {pages.length}</span></footer>
 </article>)}
 </div>
}
