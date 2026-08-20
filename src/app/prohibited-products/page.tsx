import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prohibited Products — PakDropship",
  description: "List of items that cannot be sold on the PakDropship platform.",
};

export default function ProhibitedProductsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Prohibited Products Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <p>
          To maintain a safe and legal marketplace, PakDropship prohibits the listing and sale of certain items. Vendors attempting to list prohibited items will have their products rejected, and repeated violations may lead to account termination.
        </p>

        <h2>Prohibited Categories</h2>
        <ul>
          <li><strong>Illegal Items:</strong> Narcotics, drugs, unauthorized medicines, and related paraphernalia.</li>
          <li><strong>Weapons:</strong> Firearms, ammunition, explosives, and restricted knives/blades.</li>
          <li><strong>Counterfeit Goods:</strong> Fake, replica, or unauthorized branded items (e.g., fake Apple products, replica Nike shoes) without authorization.</li>
          <li><strong>Adult Content:</strong> Pornography, sexually explicit materials, and related items.</li>
          <li><strong>Hazardous Materials:</strong> Flammable liquids, toxic substances, and items restricted by courier companies.</li>
          <li><strong>Live Animals:</strong> Pets, livestock, and animal parts restricted by law.</li>
          <li><strong>Stolen Property:</strong> Any goods obtained illegally.</li>
          <li><strong>Digital Goods:</strong> Non-physical items, software keys, accounts, or cryptocurrencies.</li>
        </ul>

        <h2>Restricted Categories (Require Prior Approval)</h2>
        <p>Some categories require special permission and documentation before listing:</p>
        <ul>
          <li>Dietary supplements and vitamins.</li>
          <li>Food and perishable items.</li>
          <li>High-value electronics and jewelry.</li>
        </ul>

        <h2>Courier Restrictions</h2>
        <p>
          Products must also comply with the shipping restrictions of our courier partners (Trax, PostEx, Leopards). Extremely oversized items or liquids without proper sealing may be rejected at pickup.
        </p>
      </div>
    </div>
  );
}
