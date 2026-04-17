import bcrypt from "bcryptjs";
import { db, pool, usersTable, categoriesTable, productsTable, deliveryAreasTable, settingsTable, snackCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Ensures snack store tables exist when `drizzle-kit push` was not run yet.
 * Keeps column definitions aligned with lib/db/src/schema/snackCategories.ts and snacks.ts.
 */
async function ensureSnackStoreSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS snack_categories (
      id SERIAL PRIMARY KEY NOT NULL,
      name VARCHAR(100) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE snacks ADD COLUMN IF NOT EXISTS snack_category_id INTEGER;
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'snacks_snack_category_id_snack_categories_id_fk'
      ) THEN
        ALTER TABLE snacks
          ADD CONSTRAINT snacks_snack_category_id_snack_categories_id_fk
          FOREIGN KEY (snack_category_id) REFERENCES snack_categories(id);
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END $$;
  `);
}

async function ensureGallerySchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_items (
      id SERIAL PRIMARY KEY NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

await ensureSnackStoreSchema();
await ensureGallerySchema();

const adminPass = await bcrypt.hash("admin123", 10);
const existing = await db.select().from(usersTable).limit(1);
if (existing.length === 0) {
  await db.insert(usersTable).values({ name: "Maharaj Ji", email: "admin@saatvik.com", password: adminPass, phone: "+91 98765 43210", role: "admin", status: 1 });
  console.log("Admin user created: admin@saatvik.com / admin123");
} else {
  console.log("Users already exist, updating admin...");
  await db.update(usersTable).set({ password: adminPass, role: "admin" }).where(eq(usersTable.email, "admin@saatvik.com"));
}

const existingCats = await db.select().from(categoriesTable).limit(1);
if (existingCats.length === 0) {
  const cats = await db.insert(categoriesTable).values([
    { name: "Regular Thali", status: 1 },
    { name: "Special Thali", status: 1 },
    { name: "Evening Nasta", status: 1 },
    { name: "Sweets & Desserts", status: 1 },
    { name: "Beverages", status: 1 },
  ]).returning();
  
  await db.insert(productsTable).values([
    { name: "Dal Fry", description: "Creamy yellow dal with cumin temper", price: "60", imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80", categoryId: cats[0].id, isSpecial: true, stock: 50, status: 1 },
    { name: "Aloo Tamatar Sabzi", description: "Potatoes in tangy tomato gravy", price: "55", imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80", categoryId: cats[0].id, isSpecial: false, stock: 40, status: 1 },
    { name: "Palak Paneer", description: "Cottage cheese in rich spinach gravy", price: "80", imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80", categoryId: cats[0].id, isSpecial: false, stock: 30, status: 1 },
    { name: "Gujarati Thali", description: "Complete thali with roti, dal, sabzi, rice, dessert", price: "150", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80", categoryId: cats[1].id, isSpecial: true, stock: 60, status: 1 },
    { name: "Plain Roti 4 pcs", description: "Freshly made whole wheat rotis", price: "30", imageUrl: "https://images.unsplash.com/photo-1574481692016-e92a97c1f1a2?w=400&q=80", categoryId: cats[1].id, isSpecial: false, stock: 100, status: 1 },
    { name: "Jeera Rice", description: "Aromatic basmati rice with cumin", price: "60", imageUrl: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400&q=80", categoryId: cats[1].id, isSpecial: false, stock: 50, status: 1 },
    { name: "Dhokla 8 pcs", description: "Steamed Gujarati chickpea cake", price: "50", imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80", categoryId: cats[2].id, isSpecial: false, stock: 30, status: 1 },
    { name: "Khandvi", description: "Rolled savory chickpea flour snack", price: "60", imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80", categoryId: cats[2].id, isSpecial: true, stock: 25, status: 1 },
    { name: "Methi Thepla 4 pcs", description: "Gujarati flatbread with fenugreek", price: "40", imageUrl: "https://images.unsplash.com/photo-1574481692016-e92a97c1f1a2?w=400&q=80", categoryId: cats[2].id, isSpecial: false, stock: 60, status: 1 },
    { name: "Shiro Halwa", description: "Semolina halwa with saffron and dry fruits", price: "55", imageUrl: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400&q=80", categoryId: cats[3].id, isSpecial: false, stock: 35, status: 1 },
    { name: "Mohanthal", description: "Traditional besan fudge with cardamom", price: "70", imageUrl: "https://images.unsplash.com/photo-1560781290-7dc94c0f8f4f?w=400&q=80", categoryId: cats[3].id, isSpecial: true, stock: 20, status: 1 },
    { name: "Buttermilk Chaas", description: "Refreshing spiced buttermilk", price: "25", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80", categoryId: cats[4].id, isSpecial: false, stock: 80, status: 1 },
    { name: "Aam Panna", description: "Tangy raw mango summer drink", price: "35", imageUrl: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&q=80", categoryId: cats[4].id, isSpecial: false, stock: 40, status: 1 },
  ]);
  console.log("Categories and products created");
} else {
  console.log("Products already exist");
}

const existingAreas = await db.select().from(deliveryAreasTable).limit(1);
if (existingAreas.length === 0) {
  await db.insert(deliveryAreasTable).values([
    { name: "Vastrapur", deliveryCharge: "20", status: 1 },
    { name: "Bodakdev", deliveryCharge: "25", status: 1 },
    { name: "Prahladnagar", deliveryCharge: "30", status: 1 },
    { name: "Satellite", deliveryCharge: "25", status: 1 },
    { name: "Navrangpura", deliveryCharge: "35", status: 1 },
    { name: "Maninagar", deliveryCharge: "40", status: 1 },
    { name: "Ghatlodia", deliveryCharge: "35", status: 1 },
  ]);
  console.log("Delivery areas created");
} else {
  console.log("Delivery areas already exist");
}

const existingSnackCats = await db.select().from(snackCategoriesTable).limit(1);
if (existingSnackCats.length === 0) {
  await db.insert(snackCategoriesTable).values([
    { name: "Khakhra", sortOrder: 1, status: 1 },
    { name: "Namkeen", sortOrder: 2, status: 1 },
    { name: "Farsan", sortOrder: 3, status: 1 },
    { name: "Sweets", sortOrder: 4, status: 1 },
  ]);
  console.log("Snack categories created");
} else {
  console.log("Snack categories already exist");
}

const existingSettings = await db.select().from(settingsTable).limit(1);
if (existingSettings.length === 0) {
  await db.insert(settingsTable).values({ orderCutoffTime: "18:30:00", maintenanceMode: false, announcement: "Orders close today at 6:30 PM — Order now for fresh Jain meals!", businessName: "Saatvik Jain Aahar Gruh", contactNumber: "+91 98765 43210", status: 1 });
  console.log("Settings created");
} else {
  console.log("Settings already exist");
}

console.log("Seeding complete!");
await pool.end();
