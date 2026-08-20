import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reseller Agreement — PakDropship",
  description: "Terms and conditions for selling products using the PakDropship platform.",
};

export default function ResellerAgreementPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Reseller Agreement</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <p>This Reseller Agreement outlines the terms under which individuals or businesses ("Resellers") sell products available on the PakDropship platform.</p>

        <h2>1. Zero Inventory Model</h2>
        <p>
          As a Reseller on PakDropship, you act as an intermediary. You do not purchase inventory upfront. You market products, secure orders, and place them on the platform. The respective vendor fulfills the order.
        </p>

        <h2>2. Pricing and Profit</h2>
        <ul>
          <li>You are responsible for setting the final selling price (COD Collect Amount) for your customers.</li>
          <li>The final price must be higher than the wholesale price + delivery fee + platform fee.</li>
          <li>Your profit is the difference between the collected amount and the platform deductions.</li>
        </ul>

        <h2>3. Marketing and Customer Relations</h2>
        <ul>
          <li>Resellers must not make false or misleading claims about the products they sell.</li>
          <li>Resellers are the primary point of contact for their customers. You are responsible for confirming orders with your customers before placing them on PakDropship.</li>
        </ul>

        <h2>4. COD Security and Account Locking</h2>
        <ul>
          <li>To prevent fraudulent orders and high RTO (Return to Origin) rates, new resellers may be subject to a COD security deposit if their initial orders are unsuccessful.</li>
          <li>If an account incurs significant RTO penalties resulting in a negative balance (below PKR -500), the account will be locked from placing new orders until the balance is cleared.</li>
        </ul>

        <h2>5. RTO Policy Compliance</h2>
        <p>
          Resellers bear the financial responsibility for RTO handling fees as outlined in the <a href="/rto-policy">RTO Policy</a>. Repeatedly high RTO rates may lead to account suspension.
        </p>

        <h2>6. Withdrawals</h2>
        <p>
          Profits credited to the reseller wallet can be withdrawn once the available balance exceeds the minimum withdrawal threshold (PKR 1,500). Withdrawals are processed to the bank account, EasyPaisa, or JazzCash details provided in your profile.
        </p>
      </div>
    </div>
  );
}
