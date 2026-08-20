import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PakDropship",
  description: "PakDropship Privacy Policy — how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1 className="text-3xl font-black text-charcoal">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following information when you register and use PakDropship:</p>
        <ul>
          <li><strong>Account Info:</strong> Name, email, phone number, CNIC, bank account details.</li>
          <li><strong>Business Info:</strong> Brand name, pickup address, return address (vendors).</li>
          <li><strong>Order Data:</strong> Customer names, addresses, phone numbers, order details.</li>
          <li><strong>Financial Data:</strong> Wallet transactions, withdrawal history, settlement records.</li>
          <li><strong>Usage Data:</strong> Login activity, pages visited, features used.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To verify your identity (KYC) and maintain your account.</li>
          <li>To process orders, courier bookings, and financial settlements.</li>
          <li>To communicate order updates, notifications, and support messages.</li>
          <li>To improve the platform and user experience.</li>
          <li>To comply with legal requirements and prevent fraud.</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <ul>
          <li><strong>Courier Partners:</strong> Customer delivery details are shared with courier companies for shipping.</li>
          <li><strong>Vendors:</strong> Receive only necessary order information (customer name, city, address) for fulfillment. Customer phone numbers are partially masked.</li>
          <li><strong>Payment Processors:</strong> Bank details are used for wallet withdrawals.</li>
          <li>We do <strong>not</strong> sell your personal data to third parties.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement industry-standard security measures including encrypted connections (HTTPS),
          secure password hashing, and access controls to protect your data. Shopify tokens and API keys
          are stored server-side and never exposed to the client.
        </p>

        <h2>5. Your Rights</h2>
        <ul>
          <li>You can view and update your profile information at any time.</li>
          <li>You can request deletion of your account by contacting support.</li>
          <li>You can request a copy of your data.</li>
        </ul>

        <h2>6. Cookies</h2>
        <p>
          PakDropship uses essential cookies for authentication and session management.
          No third-party advertising cookies are used.
        </p>

        <h2>7. Contact</h2>
        <p>For privacy-related inquiries: <strong>support@pakdropship.site</strong></p>
      </div>
    </div>
  );
}
