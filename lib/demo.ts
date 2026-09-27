import type { DocumentData } from "@/lib/types";

export const demoDocument: DocumentData = {
  type:"invoice",number:"INV-0042",status:"sent",issueDate:"2026-09-26",dueDate:"2026-10-10",currency:"UGX",
  client:{name:"Grand Lakes Hotel",company:"Grand Lakes Hotel",address:"Kampala, Uganda"},
  items:[
    {description:"Website Design",quantity:1,unit:"project",unitPrice:2500000,discount:0,taxRate:18,amount:2950000},
    {description:"Hosting",quantity:1,unit:"year",unitPrice:300000,discount:0,taxRate:18,amount:354000},
    {description:"WhatsApp Integration",quantity:1,unit:"project",unitPrice:400000,discount:0,taxRate:18,amount:472000}
  ],
  subtotal:3200000,discount:0,tax:576000,total:3776000,notes:"Thank you for your business.",terms:"Payment is due by the date shown above.",
  paymentMethod:"Bank transfer",paymentReference:"",paymentInfo:{bank:"Stanbic Bank",accountName:"Nile Digital Solutions",accountNumber:"000123456789"},
  receivedFrom:"",amountPaid:0,deliveryAddress:"",receivedBy:"",signatureName:"",payload:{timeline:"3 weeks"},
  theme:"modern",branding:{businessName:"Nile Digital Solutions",brandColor:"#234A8A",accentColor:"#D9E6FF",footer:"Nile Digital Solutions · Kampala, Uganda · hello@niledigital.ug"}
};
