const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with Supplier module data...");

  // 1. Clear existing data
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.supplier.deleteMany({});

  // 2. Create Suppliers
  const s1 = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-1001",
      companyName: "Global Pharma Ltd.",
      contactPerson: "Sarah Jenkins",
      phone: "+1 (555) 012-3456",
      email: "orders@globalpharma.com",
      address: "4522 Medical Way, PA",
      city: "Philadelphia",
      state: "PA",
      country: "USA",
      postalCode: "19104",
      taxNumber: "TX-998877",
      website: "www.globalpharma.com",
      status: "ACTIVE",
      notes: "Primary supplier for antibiotics and basic analgesics.",
    },
  });

  const s2 = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-1002",
      companyName: "BioCare Solutions",
      contactPerson: "Dr. Robert Chen",
      phone: "+1 (555) 987-6543",
      email: "billing@biocare.io",
      address: "12 Innovation Drive, Boston",
      city: "Boston",
      state: "MA",
      country: "USA",
      postalCode: "02111",
      taxNumber: "TX-445566",
      website: "www.biocare.io",
      status: "ACTIVE",
      notes: "Supplies premium vitals and generic formulas.",
    },
  });

  const s3 = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-1003",
      companyName: "NextGen Supplies",
      contactPerson: "Marcus Vance",
      phone: "+1 (555) 444-5566",
      email: "support@nextgen.com",
      address: "99 Logistics Hub, Houston",
      city: "Houston",
      state: "TX",
      country: "USA",
      postalCode: "77001",
      taxNumber: "TX-112233",
      website: "www.nextgen.com",
      status: "ACTIVE",
      notes: "Logistics provider with huge warehousing.",
    },
  });

  const s4 = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-1004",
      companyName: "HealthLink Dist.",
      contactPerson: "Elena Rostova",
      phone: "+1 (555) 222-3311",
      email: "sales@healthlink.net",
      address: "303 Health Plaza, Chicago",
      city: "Chicago",
      state: "IL",
      country: "USA",
      postalCode: "60601",
      taxNumber: "TX-778899",
      website: "www.healthlink.net",
      status: "INACTIVE",
      notes: "Contract suspended temporarily.",
    },
  });

  const s5 = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-1005",
      companyName: "Apex Pharmaceuticals",
      contactPerson: "David Miller",
      phone: "+1 (555) 666-7788",
      email: "info@apexpharma.com",
      address: "777 Summit Blvd, Seattle",
      city: "Seattle",
      state: "WA",
      country: "USA",
      postalCode: "98101",
      taxNumber: "TX-334455",
      website: "www.apexpharma.com",
      status: "ACTIVE",
      notes: "Reliable local supply channel.",
    },
  });

  console.log("Suppliers created successfully.");

  // 3. Create Medicines associated with suppliers
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  await prisma.medicine.create({
    data: {
      name: "Paracetamol 500mg",
      category: "Analgesics",
      quantity: 3, // Low stock
      buyPrice: 5.0,
      sellPrice: 8.0,
      expiryDate: nextYear,
      supplierId: s1.id,
    },
  });

  await prisma.medicine.create({
    data: {
      name: "Amoxicillin 250mg",
      category: "Antibiotics",
      quantity: 12, // Low stock
      buyPrice: 10.0,
      sellPrice: 15.0,
      expiryDate: nextYear,
      supplierId: s1.id,
    },
  });

  await prisma.medicine.create({
    data: {
      name: "Ibuprofen 400mg",
      category: "Analgesics",
      quantity: 50,
      buyPrice: 4.0,
      sellPrice: 7.0,
      expiryDate: nextYear,
      supplierId: s2.id,
    },
  });

  await prisma.medicine.create({
    data: {
      name: "D-Cold Total",
      category: "Cold & Cough",
      quantity: 19, // Low stock
      buyPrice: 6.0,
      sellPrice: 9.0,
      expiryDate: nextYear,
      supplierId: s3.id,
    },
  });

  await prisma.medicine.create({
    data: {
      name: "Cetirizine 10mg",
      category: "Antihistamines",
      quantity: 100,
      buyPrice: 2.0,
      sellPrice: 4.0,
      expiryDate: nextYear,
      supplierId: s5.id,
    },
  });

  console.log("Medicines created successfully.");

  // 4. Create Purchase Orders linked to suppliers
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-1001",
      supplierId: s1.id,
      status: "PENDING",
      totalAmount: 4500.0,
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-1002",
      supplierId: s1.id,
      status: "COMPLETED",
      totalAmount: 2500.0,
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-1003",
      supplierId: s2.id,
      status: "PENDING",
      totalAmount: 1800.0,
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-1004",
      supplierId: s3.id,
      status: "PENDING",
      totalAmount: 3200.0,
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-1005",
      supplierId: s5.id,
      status: "PENDING",
      totalAmount: 1200.0,
    },
  });

  console.log("Purchase Orders created successfully.");
  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
