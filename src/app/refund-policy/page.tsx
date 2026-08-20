import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Return Policy — PakDropship",
  description: "PakDropship Refund and Return Policy for defective, damaged, or incorrect products.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Refund & Return Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2>1. General Return Guidelines</h2>
        <p>
          Since PakDropship operates a B2B platform connecting resellers and vendors, our return policy focuses on product quality issues. Returns are accepted under the following conditions:
        </p>
        <ul>
          <li>The product received is damaged or defective.</li>
          <li>The wrong product, size, or color was delivered.</li>
          <li>The product is missing parts or accessories.</li>
        </ul>
        <p>
          We do <strong>not</strong> accept returns for customer "change of mind." Resellers should communicate this policy to their customers.
        </p>

        <h2>2. Return Process for Resellers</h2>
        <p>If a customer receives a defective or incorrect item, the reseller must initiate the return process:</p>
        <ol>
          <li><strong>Report Issue:</strong> Contact PakDropship Support via the dashboard chat within <strong>3 days</strong> of delivery.</li>
          <li><strong>Provide Evidence:</strong> Submit clear photos or a short video showing the defect, damage, or incorrect item, along with the flyer/packaging showing the AWB number.</li>
          <li><strong>Approval:</strong> Admin will review the evidence with the vendor. If approved, a replacement or refund will be authorized.</li>
          <li><strong>Collection:</strong> A reverse pickup will be arranged from the customer's address (if applicable), or the customer may be asked to discard the item.</li>
        </ol>

        <h2>3. Refund Settlement</h2>
        <ul>
          <li><strong>If replacement is authorized:</strong> A new order will be created at zero cost to the reseller.</li>
          <li><strong>If refund is authorized:</strong> The wholesale cost + platform fees will be refunded to the reseller's wallet. If the profit was already settled, it will be reversed.</li>
          <li><strong>Vendor Liability:</strong> If the vendor shipped a defective/wrong product, the product cost and associated courier fees will be deducted from the vendor's wallet.</li>
        </ul>

        <h2>4. Non-Returnable Items</h2>
        <p>Unless damaged upon arrival, the following categories are generally not eligible for return:</p>
        <ul>
          <li>Intimate apparel and undergarments.</li>
          <li>Health, hygiene, and personal care items once opened.</li>
          <li>Customized or personalized products.</li>
          <li>Products explicitly marked as "Non-Returnable" on their catalog page.</li>
        </ul>

        <h2>5. Packaging Requirements</h2>
        <p>
          If a physical return is required, the item must be in its original packaging, unused, and with all tags, accessories, and manuals included. Items returned in damaged condition (not reported initially) may be rejected.
        </p>

        <h2>6. Courier Damages</h2>
        <p>
          If a product is damaged in transit by the courier (e.g., shattered fragile items), PakDropship will file a claim with the courier. Approval of these claims depends on the courier's investigation. Vendors must pack fragile items securely to qualify for courier claims.
        </p>
      </div>
    </div>
  );
}
