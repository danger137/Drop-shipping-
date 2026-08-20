import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Agreement — PakDropship",
  description: "Terms and conditions for supplying products on the PakDropship platform.",
};

export default function VendorAgreementPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Vendor Agreement</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <p>This Vendor Agreement outlines the terms under which suppliers ("Vendors") provide products to be sold through the PakDropship platform.</p>

        <h2>1. Account Setup and Verification (KYC)</h2>
        <ul>
          <li>Vendors must provide valid business details, CNIC of the owner, and accurate bank/payment information.</li>
          <li>A valid pickup address where couriers can collect parcels must be maintained.</li>
          <li>Approval of the vendor account is subject to KYC verification by PakDropship administrators.</li>
        </ul>

        <h2>2. Product Listings and Inventory</h2>
        <ul>
          <li>Vendors are responsible for uploading accurate product details, images, weights, and wholesale pricing.</li>
          <li>Products must be in stock if listed as available. Selling products that are out of stock will result in penalties.</li>
          <li>PakDropship reserves the right to reject product listings that violate our <a href="/prohibited-products">Prohibited Products</a> policy or lack sufficient quality.</li>
        </ul>

        <h2>3. Order Fulfillment and Shipping</h2>
        <ul>
          <li>Vendors must pack and prepare orders within <strong>24 hours</strong> of receiving them on the dashboard.</li>
          <li>All shipments are processed using PakDropship's integrated courier network. Vendors must hand over parcels to the designated courier upon pickup.</li>
          <li>Vendors are responsible for secure packaging. Fragile items must be packed to withstand courier transit.</li>
        </ul>

        <h2>4. Financial Settlement</h2>
        <ul>
          <li>Vendors are paid the agreed wholesale price minus the applicable platform fee.</li>
          <li>Settlement occurs after the order is successfully delivered to the customer and the courier remits funds to PakDropship (typically 3-7 business days).</li>
          <li>Vendors can request withdrawals from their wallet balance.</li>
        </ul>

        <h2>5. Returns and RTOs</h2>
        <ul>
          <li><strong>RTO (Return to Origin):</strong> If a customer refuses delivery, the parcel will be returned to the vendor at no charge to the vendor. The vendor must accept the return and restock the item.</li>
          <li><strong>Defective Returns:</strong> If a product is returned due to a defect or incorrect item shipped by the vendor, the cost of the product and associated shipping/handling fees will be deducted from the vendor's wallet.</li>
        </ul>

        <h2>6. Termination</h2>
        <p>
          PakDropship may suspend or terminate a vendor account for consistent failure to fulfill orders, shipping counterfeit/prohibited items, or violating these terms.
        </p>
      </div>
    </div>
  );
}
