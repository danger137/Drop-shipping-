import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — PakDropship",
  description: "PakDropship Shipping Policy — delivery times, courier partners, and tracking.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Shipping Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2>1. Courier Partners</h2>
        <p>
          PakDropship has integrated multiple leading courier services in Pakistan to provide extensive nationwide coverage. Our active courier partners include:
        </p>
        <ul>
          <li>Trax</li>
          <li>PostEx</li>
          <li>Leopards Courier</li>
        </ul>
        <p>
          Resellers can compare rates from these couriers at checkout and select the preferred service for each order.
        </p>

        <h2>2. Delivery Timelines</h2>
        <p>Estimated delivery times depend on the origin (vendor's city) and destination (customer's city):</p>
        <ul>
          <li><strong>Same-City Delivery:</strong> 1-2 business days.</li>
          <li><strong>Major Cities (Karachi, Lahore, Islamabad, etc.):</strong> 2-4 business days.</li>
          <li><strong>Other Cities & Remote Areas:</strong> 3-6 business days.</li>
        </ul>
        <p><em>Note: Delivery times may be affected by extreme weather, public holidays, or unforeseen operational delays by the courier.</em></p>

        <h2>3. Vendor Fulfillment</h2>
        <p>
          Under our vendor-based fulfillment model, vendors are responsible for packing the orders and handing them over to the courier.
        </p>
        <ul>
          <li>Vendors must prepare orders within 24 hours of receiving them on their dashboard.</li>
          <li>Courier pickups are scheduled automatically based on the vendor's registered pickup address.</li>
        </ul>

        <h2>4. Shipping Charges</h2>
        <p>
          Shipping charges are dynamically calculated at checkout based on:
        </p>
        <ul>
          <li>Origin City (Vendor's location)</li>
          <li>Destination City (Customer's location)</li>
          <li>Parcel Weight (Volumetric or physical, whichever is higher)</li>
          <li>Courier selected</li>
        </ul>
        <p>The shipping fee is included in the total deductions before reseller profit is calculated.</p>

        <h2>5. Tracking Orders</h2>
        <p>
          Once a courier is booked, a tracking ID and Air Waybill (AWB) number are generated. Resellers can track the real-time status of orders directly from their PakDropship dashboard. Customers can track their orders using the tracking link provided by the respective courier company.
        </p>

        <h2>6. Failed Deliveries & RTO</h2>
        <p>
          Couriers typically make 2-3 attempts to deliver a parcel. If all attempts fail, the parcel is marked as Return to Origin (RTO) and sent back to the vendor. Please refer to our <a href="/rto-policy">RTO Policy</a> for details on handling fees and procedures.
        </p>
      </div>
    </div>
  );
}
