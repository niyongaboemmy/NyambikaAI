import { db } from "../db";
import { paymentSettings } from "../shared/schema.dialect";

export async function seedPaymentSettings() {
  console.log("🌱 Seeding payment settings...");

  // Clear existing data
  await db.delete(paymentSettings).execute();

  // Insert default payment settings
  const defaultSettings = [
    {
      name: "try_on_fee",
      description: "Fee for using the AI Try-On feature",
      amountInRwf: 500,
    },
    {
      name: "product_boost",
      description: "Boost product visibility to first page",
      amountInRwf: 100,
    },
    {
      name: "product_ads",
      description: "Ads on first page per product",
      amountInRwf: 5000,
    },
    {
      name: "company_boost",
      description: "Boost company visibility to first page",
      amountInRwf: 10000,
    },
  ];

  await db.insert(paymentSettings).values(defaultSettings).execute();

  console.log("✅ Payment settings seeded successfully");
  return defaultSettings;
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedPaymentSettings()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error seeding payment settings:", error);
      process.exit(1);
    });
}
