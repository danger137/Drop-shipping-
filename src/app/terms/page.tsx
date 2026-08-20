import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — PakDropship",
  description: "Read the Terms & Conditions governing the use of PakDropship platform for resellers and vendors in Pakistan.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Terms &amp; Conditions</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By registering on or using PakDropship (&quot;the Platform&quot;), you agree to be bound by these Terms &amp; Conditions.
          If you do not agree, please do not use the Platform.
        </p>

        <h2>2. Platform Overview</h2>
        <p>
          PakDropship is a B2B dropshipping platform that connects <strong>Vendors</strong> (product suppliers) with
          <strong> Resellers</strong> (sellers). Vendors upload products and fulfill orders from their own locations.
          Resellers select products, set their selling price, and place orders on behalf of their customers.
          PakDropship provides the technology platform, courier integration, and wallet/payment management.
        </p>

        <h2>3. User Accounts</h2>
        <ul>
          <li>Users must register with a valid CNIC, phone number, and bank account.</li>
          <li>KYC verification is required before account activation.</li>
          <li>Each user may have only one account. Multiple accounts may result in suspension.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
        </ul>

        <h2>4. Reseller Terms</h2>
        <ul>
          <li>Resellers do not hold inventory. Products are fulfilled by vendors.</li>
          <li>Resellers set their own COD (Cash on Delivery) selling price above the wholesale price.</li>
          <li>The difference between COD amount and wholesale + fees = reseller profit.</li>
          <li>Profit is credited to the reseller wallet after successful delivery and settlement.</li>
          <li>Resellers must not make false claims about products to customers.</li>
        </ul>

        <h2>5. Vendor Terms</h2>
        <ul>
          <li>Vendors must maintain accurate stock levels on the platform.</li>
          <li>Vendors must fulfill orders within 24 hours of confirmation.</li>
          <li>Vendors must provide accurate pickup addresses for courier collection.</li>
          <li>Products must match listed descriptions, images, and quality standards.</li>
          <li>Vendors receive their wholesale amount minus platform fees after settlement.</li>
        </ul>

        <h2>6. Orders &amp; Payments</h2>
        <ul>
          <li>All orders are COD (Cash on Delivery). Payment is collected from the customer at delivery.</li>
          <li>COD amounts are managed through PakDropship&apos;s master courier account.</li>
          <li>Settlement occurs after successful delivery and the applicable holding period.</li>
          <li>Platform fees are deducted automatically at settlement.</li>
        </ul>

        <h2>7. Prohibited Activities</h2>
        <ul>
          <li>Selling prohibited, illegal, or counterfeit products.</li>
          <li>Providing false information during registration or KYC.</li>
          <li>Manipulating orders, reviews, or ratings.</li>
          <li>Any activity that disrupts the platform or harms other users.</li>
        </ul>

        <h2>8. Account Suspension &amp; Termination</h2>
        <p>
          PakDropship reserves the right to suspend or terminate accounts that violate these terms.
          Pending balances will be settled according to the applicable withdrawal policies.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          PakDropship acts as a technology platform and is not responsible for product quality,
          delivery delays caused by couriers, or disputes between vendors and resellers beyond
          what is managed through the platform&apos;s dispute resolution process.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          PakDropship may update these terms at any time. Users will be notified of significant changes.
          Continued use of the platform constitutes acceptance of updated terms.
        </p>

        <h2>11. Contact</h2>
        <p>For questions regarding these terms, contact us at <strong>support@pakdropship.site</strong>.</p>
      </div>
    </div>
  );
}
