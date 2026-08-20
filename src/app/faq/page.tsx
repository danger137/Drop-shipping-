import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — PakDropship",
  description: "Get answers to common questions about using PakDropship for resellers and vendors.",
};

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader } from "@/components/SiteHeader";
import { HelpCircle, Users, Package, Wallet, Truck } from "lucide-react";

const FAQ_SECTIONS = [
  {
    category: "General Platform Questions",
    icon: HelpCircle,
    questions: [
      {
        q: "What is PakDropship and how does it work?",
        a: "PakDropship connects resellers with verified vendors. Vendors upload products, resellers sell them at their own price, vendors ship directly to customers via PakDropship's courier network, and profits are credited to your wallet."
      },
      {
        q: "Do I need inventory to start selling?",
        a: "No. You never buy or store stock. When you get a customer order, the vendor ships directly from their location. You only pay the wholesale cost after the order is placed from the COD amount collected."
      },
      {
        q: "Is there any registration fee?",
        a: "Registration is completely free for both resellers and vendors. We only charge a small platform fee per successfully delivered order."
      }
    ]
  },
  {
    category: "For Resellers (Selling & Profits)",
    icon: Users,
    questions: [
      {
        q: "How do I set my selling price?",
        a: "When you place an order for a customer, you input the 'COD Collect Amount'. This is your selling price. It must be higher than the wholesale price plus delivery charges."
      },
      {
        q: "When do I receive my profit?",
        a: "Profit is credited to your wallet after successful delivery and settlement by the courier (usually 3-5 days after delivery). You can withdraw once your available balance reaches PKR 1,500."
      },
      {
        q: "How do I withdraw my earnings?",
        a: "Go to the Wallet section in your dashboard and submit a withdrawal request. Provide your Bank account, EasyPaisa, or JazzCash details. Admin processes withdrawals within 24-48 hours."
      },
      {
        q: "What happens if a customer refuses delivery (RTO)?",
        a: "If a parcel is returned (RTO), a handling fee (typically PKR 250) is deducted from your wallet to cover courier shipping and return charges."
      },
      {
        q: "How do I connect my Shopify store?",
        a: "Go to Integrations → Shopify in your dashboard. Enter your store domain, authenticate the app, and you can push products directly to your store with one click."
      }
    ]
  },
  {
    category: "For Vendors (Products & Fulfillment)",
    icon: Package,
    questions: [
      {
        q: "How do I become a vendor?",
        a: "Sign up via the Vendor Registration page, complete your KYC verification, and set up your pickup and return addresses. Once approved, you can start uploading products."
      },
      {
        q: "How does vendor pickup work?",
        a: "When a reseller places an order for your product, PakDropship automatically generates a courier booking with your registered pickup address. The courier picks up the parcel directly from your location."
      },
      {
        q: "When do I get paid for my products?",
        a: "You get paid the wholesale price minus the vendor platform fee after the order is successfully delivered and settled. The funds appear in your wallet for withdrawal."
      },
      {
        q: "Who pays for shipping and RTO?",
        a: "Shipping is paid by the customer/reseller from the COD amount. RTO charges are borne by the reseller. Vendors do not pay shipping or RTO fees."
      }
    ]
  },
  {
    category: "Shipping & Couriers",
    icon: Truck,
    questions: [
      {
        q: "Which couriers are available?",
        a: "We work with Trax, PostEx, Leopards, and others. You can compare rates and choose the best option at checkout for each order."
      },
      {
        q: "How is the courier fee calculated?",
        a: "Courier rates are calculated dynamically at checkout based on the vendor's pickup city, customer's destination city, package weight, and COD amount."
      },
      {
        q: "How can I track my orders?",
        a: "Every order gets a tracking number and link in your dashboard. You can track it directly on the courier's website or view the status updates in your Order Timeline."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="bg-charcoal py-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">Help Center</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-4">Frequently Asked Questions</h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Everything you need to know about building your dropshipping business or supplying products on PakDropship.
          </p>
        </div>
      </div>

      <div className="py-16 px-6">
        <div className="mx-auto max-w-3xl space-y-12">
          {FAQ_SECTIONS.map((section, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <section.icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-charcoal">{section.category}</h2>
              </div>
              
              <Accordion type="multiple" className="w-full space-y-4">
                {section.questions.map((faq, fIdx) => (
                  <AccordionItem 
                    key={fIdx} 
                    value={`item-${idx}-${fIdx}`}
                    className="bg-surface border rounded-xl px-6"
                  >
                    <AccordionTrigger className="text-left font-bold text-[15px] hover:text-primary transition-colors py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
          
          <div className="bg-surface rounded-2xl p-8 text-center mt-12 border border-border">
            <h3 className="text-xl font-bold text-charcoal">Still have questions?</h3>
            <p className="text-muted-foreground mt-2">Our support team is here to help you.</p>
            <a 
              href="mailto:support@pakdropship.site" 
              className="inline-block mt-4 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
