import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Policy — PakDropship",
  description: "PakDropship Payment Policy covering wallet settlements, fees, and withdrawals.",
};

export default function PaymentPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Payment & Settlement Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2>1. Cash on Delivery (COD) Processing</h2>
        <p>
          All orders on PakDropship are processed on a Cash on Delivery (COD) basis. The courier collects the cash from the customer upon successful delivery. The collected amount is remitted to PakDropship's master accounts.
        </p>

        <h2>2. Settlement Timeline</h2>
        <p>
          Once an order is marked as "Delivered" by the courier, it enters the settlement cycle:
        </p>
        <ul>
          <li><strong>Courier Remittance:</strong> Couriers typically remit funds to PakDropship within 3-7 business days after delivery.</li>
          <li><strong>Wallet Credit:</strong> Upon receiving funds from the courier, PakDropship settles the order and credits the respective amounts (wholesale for vendors, profit for resellers) to the platform wallets.</li>
        </ul>

        <h2>3. Platform Fees</h2>
        <p>
          PakDropship charges a nominal platform fee per successful order to cover operational costs. This fee is automatically deducted during the settlement process.
        </p>

        <h2>4. Wallet Withdrawals</h2>
        <p>Users can withdraw funds from their available wallet balance under the following conditions:</p>
        <ul>
          <li><strong>Minimum Threshold:</strong> The minimum withdrawal amount is PKR 1,500.</li>
          <li><strong>Payment Methods:</strong> Withdrawals can be made to verified Bank Accounts, EasyPaisa, or JazzCash accounts matching the user's profile.</li>
          <li><strong>Processing Time:</strong> Withdrawal requests are typically processed within 24-48 hours. Proof of payment will be attached to the ledger record in your dashboard.</li>
        </ul>

        <h2>5. Negative Balances</h2>
        <p>
          If a reseller incurs RTO penalties that exceed their available balance, the wallet may go into the negative. A negative balance must be cleared (topped up) before new orders can be placed.
        </p>
      </div>
    </div>
  );
}
