import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const resellerHash = await bcrypt.hash('password', 10)
  const adminHash = await bcrypt.hash('admin123', 10)
  const vendorHash = await bcrypt.hash('vendor123', 10)

  // ── Platform Config ────────────────────────────────────────────────────
  await prisma.platformConfig.create({
    data: {
      deliveryFee: 250,
      platformFeePerOrder: 100,
      vendorFeePercent: 60,
      resellerFeePercent: 40,
      minWithdrawal: 1500,
      codReserveAmount: 500,
      firstOrdersMonitor: 2,
    }
  })

  // ── Reseller ──────────────────────────────────────────────────────────
  const reseller1 = await prisma.reseller.create({
    data: {
      id: "r1",
      name: "Waseem Ahmad",
      brandName: "Waseem Store",
      brandLogo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
      phone: "0300-1234567",
      balance: 1800,
      user: {
        create: {
          email: "waseem@example.com",
          passwordHash: resellerHash,
          role: "reseller"
        }
      }
    }
  })

  // ── Vendor ────────────────────────────────────────────────────────────
  const vendor1 = await prisma.vendor.create({
    data: {
      id: "v1",
      name: "Ali Textiles",
      brandName: "Ali Textiles Co.",
      brandLogo: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d",
      phone: "0312-5556677",
      bankName: "Meezan Bank",
      accountName: "Ali Textiles",
      accountNumber: "02340012345678",
      balance: 0,
      user: {
        create: {
          email: "vendor@example.com",
          passwordHash: vendorHash,
          role: "vendor"
        }
      }
    }
  })

  const vendor2 = await prisma.vendor.create({
    data: {
      id: "v2",
      name: "Tech Mart",
      brandName: "Tech Mart PK",
      brandLogo: "https://images.unsplash.com/photo-1550009158-9fffc39a4f73?w=400",
      phone: "0321-9988776",
      bankName: "HBL",
      accountName: "Tech Mart PK",
      accountNumber: "01234567890123",
      balance: 0,
      user: {
        create: {
          email: "techmart@example.com",
          passwordHash: vendorHash,
          role: "vendor"
        }
      }
    }
  })

  // ── Admin ────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: "admin@pakdropship.pk",
      passwordHash: adminHash,
      role: "admin"
    }
  })

  // ── Categories ────────────────────────────────────────────────────────
  const catGadgets = await prisma.category.create({
    data: { title: "Gadgets & Electronics", image: "https://images.unsplash.com/photo-1550009158-9fffc39a4f73?w=500&q=80" }
  })
  const catFashion = await prisma.category.create({
    data: { title: "Men's Fashion", image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&q=80" }
  })
  const catLadies = await prisma.category.create({
    data: { title: "Ladies Wear", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80" }
  })
  const catWatches = await prisma.category.create({
    data: { title: "Watches & Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" }
  })
  const catFootwear = await prisma.category.create({
    data: { title: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" }
  })

  // ── Products ──────────────────────────────────────────────────────────
  await prisma.product.create({
    data: {
      id: "p1",
      sku: "TWS-001",
      categoryId: catGadgets.id,
      vendorId: vendor2.id,
      title: "TWS Wireless Earbuds",
      hook: "Bhai ye earbuds AirPods se behtar hain",
      description: "Premium TWS earbuds with noise cancellation, 30hr battery life, and crystal clear sound.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"]),
      colors: JSON.stringify(["Black", "White"]),
      sizes: JSON.stringify([]),
      wholesale: 1200,
      suggested: 2499,
      stock: 150,
      reservedStock: 0,
      soldQty: 0,
      lowStockThreshold: 10,
      weight: 85,
      approvalStatus: "APPROVED",
      isActive: true,
    }
  })

  await prisma.product.create({
    data: {
      id: "p2",
      sku: "SMW-002",
      categoryId: catWatches.id,
      vendorId: vendor2.id,
      title: "Smart Watch Pro Max",
      hook: "Fitness + Style ek saath",
      description: "Full touch AMOLED display, heart rate monitor, sleep tracker, 7-day battery.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"]),
      colors: JSON.stringify(["Black", "Silver", "Rose Gold"]),
      sizes: JSON.stringify([]),
      wholesale: 2500,
      suggested: 4999,
      stock: 80,
      reservedStock: 0,
      soldQty: 0,
      lowStockThreshold: 5,
      weight: 120,
      approvalStatus: "APPROVED",
      isActive: true,
    }
  })

  await prisma.product.create({
    data: {
      id: "p3",
      sku: "KST-001",
      categoryId: catFashion.id,
      vendorId: vendor1.id,
      title: "Premium Khaddar Shalwar Kameez",
      hook: "Winter mein style aur warmth dono",
      description: "Soft premium khaddar fabric, winter collection 2025. Available in classic designs.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80"]),
      colors: JSON.stringify(["Navy Blue", "Charcoal", "Maroon"]),
      sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
      wholesale: 800,
      suggested: 1699,
      stock: 200,
      reservedStock: 0,
      soldQty: 0,
      lowStockThreshold: 15,
      weight: 500,
      approvalStatus: "APPROVED",
      isActive: true,
    }
  })

  await prisma.product.create({
    data: {
      id: "p4",
      sku: "LDE-001",
      categoryId: catLadies.id,
      vendorId: vendor1.id,
      title: "Embroidered Lawn Suit",
      hook: "Ghar mein baithe yeh suit pahen aur khubsoorat lag",
      description: "3-piece embroidered lawn suit, stitched & ready to wear.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"]),
      colors: JSON.stringify(["Pink", "Yellow", "Blue"]),
      sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
      wholesale: 1100,
      suggested: 2299,
      stock: 120,
      reservedStock: 0,
      soldQty: 0,
      lowStockThreshold: 10,
      weight: 400,
      approvalStatus: "APPROVED",
      isActive: true,
    }
  })

  await prisma.product.create({
    data: {
      id: "p5",
      sku: "SNK-001",
      categoryId: catFootwear.id,
      vendorId: vendor2.id,
      title: "Air Foam Running Sneakers",
      hook: "Chalo bhaago, aur stylish lagoge",
      description: "Lightweight air-foam sole, breathable upper, anti-slip grip. Perfect for gym & daily use.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"]),
      colors: JSON.stringify(["White", "Black", "Red"]),
      sizes: JSON.stringify(["39", "40", "41", "42", "43", "44"]),
      wholesale: 1500,
      suggested: 2999,
      stock: 100,
      reservedStock: 0,
      soldQty: 0,
      lowStockThreshold: 8,
      weight: 600,
      approvalStatus: "APPROVED",
      isActive: true,
    }
  })

  console.log('✅ Seed completed successfully!')
  console.log('🔑 Logins:')
  console.log('   Admin:    admin@pakdropship.pk / admin123')
  console.log('   Vendor 1: vendor@example.com / vendor123')
  console.log('   Vendor 2: techmart@example.com / vendor123')
  console.log('   Reseller: waseem@example.com / password')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
