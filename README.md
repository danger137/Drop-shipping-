# PakDropship Connect

Build a complete, enterprise-grade B2B Dropshipping & Reseller SaaS Platform named "PakDropship" using Vite, React, Tailwind CSS, TypeScript, and Supabase (for Authentication, Database, and Storage).

==================================================

🛠️ SPECIAL DEV & DEMO TESTING MODE (MUST INCLUDE)

==================================================

- NAVBAR DEV ROLE SWITCHER: Add a sticky top-bar / header dropdown switcher with 3 options:

  1. "View as Guest" (Public Landing Page)

  2. "View as Reseller User" (Dropshipper Dashboard)

  3. "View as MAIN OWNER ADMIN" (Full Control Panel)

  - This allows instant 1-click panel switching without requiring repeated logins during testing!

- PRE-CONFIGURED DUMMY TEST STATE:

  - Pre-populate a dummy Reseller user ("Waseem Store") with brand logo, 2 dummy orders, active chat history, and PKR 1,800 profit balance (to test withdrawal).

  - Add quick test trigger buttons on Reseller Dashboard:

    - Button: "Simulate -PKR 500 Lock State" (Instantly triggers negative balance lock modal).

    - Button: "Add PKR 1,500 Test Profit" (Instantly unlocks withdrawal button).

- FULLY FUNCTIONAL MOCK/SUPABASE DATABASE: Ensure all category additions, product uploads, order status toggles, screenshot submissions, and chat messages update state in real-time.

==================================================

🎨 1. GLOBAL DESIGN & VISUAL SYSTEM

==================================================

- Color Palette:

  - Primary Accent Green: #17990F (Buttons, Highlights, Badges, Active States)

  - Dark Charcoal / Black: #181818 (Headings, Dark Sections, Cards, Modern Typography)

  - Background Base: #FFFFFF (Crisp White for clean readability)

  - Surface Accent: Light Gray (#F9FAFB) for subtle card contrast.

- Responsiveness: 100% Mobile, Tablet, and Desktop responsive layout with fluid grid breakpoints.

- Media: Populate all landing sections, category cards, sliders, and products using high-resolution Unsplash image URLs. No blank gray placeholders anywhere.

==================================================

🏠 2. LANDING PAGE & GUEST ACCESS RULE

==================================================

STRICT ACCESS RULE: Guest users can ONLY view public pages. Product Catalog, Wholesale Prices, Product Details, and App Dashboards MUST BE STRICTLY HIDDEN until user logs in or switches role via Dev Switcher.

10-Section Landing Page Layout:

1. Header Navbar: Logo ("PakDropship" in #181818 & #17990F Green), Public Nav Links (Home, About Us, How It Works, Vision, Team, FAQ, Contact), "Login / Register" Buttons, and the Dev Role Switcher Bar.

2. Hero Carousel Slider: Interactive banner slider with 3 high-res e-commerce/logistics banners, bold copy ("Start Your Zero-Inventory Business Today"), and action CTA buttons.

3. Feature Highlight Banner: High-impact image banner highlighting Faisalabad Karkhana Bazaar Direct Sourcing & Zero Dead Stock Guarantee.

4. How PakDropship Works: 4-step process cards (Pick Product -> Set Selling Price -> Receive Order -> We Dispatch & You Keep Profit).

5. Visual Category Grid: Dynamic cards with images for categories created natively by Owner Admin.

6. Interactive Flip Cards Section: Showcase featured product benefits. On mouse hover, cards trigger a smooth 3D flip animation showing text summary, features, and ad hooks on the back side.

7. Interactive Profit Calculator Card: Dynamic slider estimating monthly profit based on daily order targets (e.g., 50–100 orders/day).

8. Our Vision & Mission: Visual narrative section showcasing physical warehouse operations and local seller empowerment.

9. Sticky Dual-Column FAQ Section: 

   - Left Column: Sticky/Fixed visual card containing FAQ Title, Support Badge, and Warehouse image. Remains pinned on screen as user scrolls down.

   - Right Column: Scrollable Accordion list answering delivery times, RTO rules, payout minimums, and account lock policies.

10. Premium Footer: Dark (#181818) footer with quick navigation links, Terms of Service, Refund Policy, Privacy Policy, Faisalabad Office Address, and Social Handles.

==================================================

👤 3. RESELLER USER PANEL & BRAND CUSTOMIZATION

==================================================

- Account Settings & Brand Personalization: Upload/Edit custom Brand Name and Brand Logo.

- Catalog & Product View (Locked to Logged-in Users):

  - Displays Wholesale Price, Suggested Selling Price, Stock Status, and Variants (Colors, Sizes).

  - Profit Calculator on every product page.

  - 1-Click Asset Download: Batch download product images, TikTok video hooks copy, and Facebook ad text.

- B2B Single-Page Checkout Flow:

  - Customer Name, Phone 1, Phone 2, City Dropdown (Pakistan Cities), Full Address, Variant Selection.

  - CRITICAL FIELD: "Amount to Collect from Customer (COD)" input field.

  - Dynamic Profit Breakdown Box: Calculates `[Amount Collected from Customer] - [Wholesale Price + PKR 250 Delivery Fee] = Reseller Net Profit`.

- Reseller Dashboard & Wallet Ledger:

  - Metric Cards: Total Orders, Dispatched, Delivered, Returned (RTO), Current Wallet Balance, Total Net Profit Earned.

  - Real-time Wallet Ledger Table: Itemized list of all credits/debits with transaction tags.

- TWO-WAY PAYOUT SCREENSHOT ENGINE (Minimum PKR 1,500):

  - When Net Profit balance reaches PKR 1,500+, the "Request Profit Withdrawal" button unlocks.

  - Reseller inputs Bank / EasyPaisa / JazzCash account details and submits payout request to Owner.

  - Once Owner transfers funds offline, Owner uploads the Payment Confirmation Screenshot Proof and marks as Paid.

  - Reseller can view, enlarge, and download Owner's payment proof screenshot directly in their dashboard ledger.

- STRICT NEGATIVE BALANCE LOCK LOGIC (-PKR 500 Rule):

  - Initial allowance to place up to 2 orders.

  - Return Penalty (RTO): When marked "Returned/RTO", PKR 250 is automatically deducted per returned parcel (-PKR 250 for 1st return, -PKR 500 for 2nd return).

  - Account Lock Trigger: If Wallet Balance hits -PKR 500 (or below 0), ORDER PLACEMENT IS AUTOMATICALLY BLOCKED.

  - Lock Warning Modal: Displays Owner's EasyPaisa/JazzCash/Bank Account details. Reseller inputs Transaction ID (TRX ID), attaches Payment Receipt Screenshot, and submits "Request Account Unlock".

- Live Support Chat Box: Floating chat widget to talk directly with Owner Admin in real-time.

==================================================

👑 4. MAIN OWNER ADMIN PANEL (Platform Controller)

==================================================

- DYNAMIC CATEGORY MANAGER:

  - Owner creates new categories by uploading a Category Cover Image and typing Category Title.

  - Created categories dynamically sync to Landing Page grid and Product Upload category dropdowns.

- NATIVE PRODUCT & VARIANT MANAGER:

  - Native form to Add / Edit / Delete products inside Admin Panel (No external links).

  - Fields: Title, Description, Wholesale Cost, Suggested Selling Price, Stock Count, Category Dropdown, Product Image Gallery, and Variants (Colors, Sizes, Variant Stock).

  - Pre-populate database with 100 realistic dummy products across categories using Unsplash images.

- MASTER ORDER MANAGEMENT & AUTOMATED RTO PENALTY:

  - Global Order Table displaying Customer Collection Amount, Reseller Profit, and Shipping Details.

  - 1-Click Status Toggles: Pending -> Dispatched -> Delivered -> Returned (RTO).

  - Toggling status to "Returned/RTO" AUTOMATICALLY executes the -PKR 250 wallet deduction on that specific reseller's account.

- DUAL SCREENSHOT APPROVAL ENGINE (TWO-WAY PROOF):

  1. Account Unlock Requests (-PKR 500 Lock):

     - Admin reviews reseller's uploaded top-up screenshot & TRX ID.

     - Admin clicks "Approve & Unlock" -> System automatically credits +PKR 500 to reseller wallet and UNLOCKS order placement access immediately.

  2. Profit Payout Requests (PKR 1,500+ Withdrawal):

     - Admin reviews pending reseller payout requests with bank details.

     - Admin pays reseller offline via EasyPaisa/Bank, uploads the Payment Confirmation Screenshot Proof image, and clicks "Mark Paid".

     - System updates request status to Paid and pins the payment proof screenshot to Reseller Ledger.

- ALL USER ACCOUNTS INSPECTOR:

  - Master user table where Owner can inspect any reseller's profile, view total orders, wallet balance, uploaded brand logo, and manual balance overrides.

- LIVE SUPPORT CHAT INBOX:

  - Dedicated Admin Chat Inbox tab to view and reply to Reseller chat messages in real time (pre-filled with dummy test conversations).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c71875e-1300-43ef-ba8c-cc566715ad8d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
# pakdropship
