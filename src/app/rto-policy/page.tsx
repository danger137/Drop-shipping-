import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return to Origin (RTO) Policy — PakDropship",
  description: "PakDropship RTO Policy — understanding handling fees, deductions, and procedures for failed deliveries.",
};

export default function RTOPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Return to Origin (RTO) Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2>1. What is RTO?</h2>
        <p>
          Return to Origin (RTO) occurs when a courier attempts to deliver an order to a customer, but the delivery fails and the parcel is returned to the vendor. Common reasons include:
        </p>
        <ul>
          <li>Customer refused to accept the parcel.</li>
          <li>Customer unavailable after multiple delivery attempts.</li>
          <li>Incomplete or incorrect address/phone number provided by the reseller.</li>
          <li>Customer cancelled the order while it was in transit.</li>
        </ul>

        <h2>2. Financial Impact of RTO</h2>
        <p>
          When an order is RTO'd, courier companies still charge shipping and return handling fees. Since PakDropship covers these costs upfront through our master courier account, an RTO handling fee is charged to the reseller.
        </p>

        <h3>For Resellers:</h3>
        <ul>
          <li>A standard RTO penalty (usually PKR 250, as per current platform config) is deducted from your wallet balance.</li>
          <li>If your wallet balance is insufficient, it will show a negative balance. You must clear the negative balance before placing new orders.</li>
          <li>Consistently high RTO rates may result in account suspension or mandatory COD security deposits.</li>
        </ul>

        <h3>For Vendors:</h3>
        <ul>
          <li>Vendors do not pay RTO fees as the failure is typically on the buyer side.</li>
          <li>The physical product is returned to the vendor's return address by the courier.</li>
          <li>Once received, the vendor's reserved stock for that item is released back into available inventory.</li>
        </ul>

        <h2>3. RTO Prevention Strategies</h2>
        <p>We advise resellers to follow these practices to minimize RTOs:</p>
        <ul>
          <li><strong>Confirm Orders:</strong> Always call the customer to confirm the order, address, and COD amount before placing it on PakDropship.</li>
          <li><strong>Accurate Details:</strong> Ensure the city, address, and active phone numbers are correct.</li>
          <li><strong>Track & Follow Up:</strong> Monitor tracking statuses and contact the customer if the courier reports delivery issues.</li>
        </ul>

        <h2>4. Disputing an RTO</h2>
        <p>
          If you believe an order was falsely marked as RTO by the courier, contact PakDropship support within 48 hours of the RTO status update. We will escalate the issue with the respective courier company.
        </p>

        <h2>5. Vendor Responsibility on Return</h2>
        <p>
          Vendors must ensure someone is available at their registered return address to receive RTO parcels from the courier. Failure to accept returns may result in the parcel being disposed of by the courier without compensation.
        </p>
      </div>
    </div>
  );
}
