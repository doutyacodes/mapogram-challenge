import { POST_CATEGORY_TEMPLATES, USER_POSTS } from "./schema";
import {
  boolean,
  date,
  datetime,
  decimal,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  unique,
  varchar,
  uniqueKeyName,
  index,
} from "drizzle-orm/mysql-core";

// Sub-categories table for each main category
export const CLASSIFIED_SUB_CATEGORIES = mysqlTable("classified_sub_categories", {
  id: int("id").primaryKey().autoincrement(),
  main_category_id: int("main_category_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
  name: varchar("name", { length: 100 }).notNull(), // "Cars", "Mobiles & Tablets", etc.
  slug: varchar("slug", { length: 100 }).notNull(), // "cars", "mobiles-tablets"
  is_active: boolean("is_active").default(true),
}, (table) => ({
  idxMainCategory: index("idx_classified_sub_categories_main_category").on(table.main_category_id),
}));

// Main classifieds details table
export const USER_CLASSIFIED_DETAILS = mysqlTable("user_classified_details", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().unique().references(() => USER_POSTS.id, { onDelete: 'cascade' }),
  sub_category_id: int("sub_category_id").notNull().references(() => CLASSIFIED_SUB_CATEGORIES.id),
  
  // Common fields for all classifieds
  listing_type: mysqlEnum("listing_type", ["sell", "rent", "buy", "exchange"]).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }),
  price_type: mysqlEnum("price_type", ["fixed", "negotiable"]).default("negotiable"),
  condition: mysqlEnum("condition", ["new", "like_new", "good", "fair", "needs_repair"]),
  
  // Contact & preference fields
  contact_phone: varchar("contact_phone", { length: 20 }),
  contact_email: varchar("contact_email", { length: 100 }),
  preferred_contact: mysqlEnum("preferred_contact", ["phone", "email", "both"]).default("both"),
  
  // Availability
//   available_from: date("available_from"),
  available_until: date("available_until"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  idxPostId: index("idx_classified_details_post_id").on(table.post_id),
  idxSubCategory: index("idx_classified_details_sub_category").on(table.sub_category_id),
  idxListingType: index("idx_classified_details_listing_type").on(table.listing_type),
  idxPrice: index("idx_classified_details_price").on(table.price),
  idxCondition: index("idx_classified_details_condition").on(table.condition),
}));

// Vehicle specific details
export const CLASSIFIED_VEHICLE_DETAILS = mysqlTable("classified_vehicle_details", {
  id: int("id").primaryKey().autoincrement(),
  classified_id: int("classified_id").notNull().unique().references(() => USER_CLASSIFIED_DETAILS.id, { onDelete: 'cascade' }),
  
  brand_id: int("brand_id").references(() => VEHICLE_BRANDS.id),
  model_id: int("model_id").references(() => VEHICLE_MODELS.id),
  year: int("year"),
  mileage_km: int("mileage_km"),
  
  fuel_type: mysqlEnum("fuel_type", ["petrol", "diesel", "electric", "hybrid", "cng"]),
  transmission: mysqlEnum("transmission", ["manual", "automatic", "semi_automatic"]),
  
  // For vehicles that support it
  engine_capacity: varchar("engine_capacity", { length: 20 }), // "1200cc", "150cc"
  
  // Vehicle specific fields
  registration_year: int("registration_year"),
  insurance_valid_until: date("insurance_valid_until"),
  pollution_certificate_valid: boolean("pollution_certificate_valid").default(false),
  
  // Additional vehicle info
  color: varchar("color", { length: 50 }),
  number_of_owners: int("number_of_owners").default(1),
  
}, (table) => ({
  idxBrand: index("idx_vehicle_details_brand").on(table.brand_id),
  idxModel: index("idx_vehicle_details_model").on(table.model_id),
  idxYear: index("idx_vehicle_details_year").on(table.year),
  idxFuelType: index("idx_vehicle_details_fuel_type").on(table.fuel_type),
}));

// Electronics specific details
export const CLASSIFIED_ELECTRONICS_DETAILS = mysqlTable("classified_electronics_details", {
  id: int("id").primaryKey().autoincrement(),
  classified_id: int("classified_id").notNull().unique().references(() => USER_CLASSIFIED_DETAILS.id, { onDelete: 'cascade' }),
  
  brand_id: int("brand_id").references(() => ELECTRONICS_BRANDS.id),
  model: varchar("model", { length: 100 }),
  
  // Common electronics fields
  warranty_months_left: int("warranty_months_left"),
  bill_available: boolean("bill_available").default(false),
  box_available: boolean("box_available").default(false),
  
  // Specific to type
  storage_capacity: varchar("storage_capacity", { length: 50 }), // "64GB", "1TB"
  ram: varchar("ram", { length: 20 }), // "8GB"
  processor: varchar("processor", { length: 100 }),
  screen_size: varchar("screen_size", { length: 20 }), // "6.1 inch", "32 inch"
  
  // For appliances
  energy_rating: int("energy_rating"), // 1-5 stars
  
}, (table) => ({
  idxBrand: index("idx_electronics_details_brand").on(table.brand_id),
  idxWarranty: index("idx_electronics_details_warranty").on(table.warranty_months_left),
}));

// Furniture specific details
export const CLASSIFIED_FURNITURE_DETAILS = mysqlTable("classified_furniture_details", {
  id: int("id").primaryKey().autoincrement(),
  classified_id: int("classified_id").notNull().unique().references(() => USER_CLASSIFIED_DETAILS.id, { onDelete: 'cascade' }),
  
  material: varchar("material", { length: 100 }), // "Wood", "Metal", "Plastic", "Fabric"
  color: varchar("color", { length: 50 }),
  dimensions: varchar("dimensions", { length: 100 }), // "L x W x H"
  weight_kg: decimal("weight_kg", { precision: 6, scale: 2 }),
  
  // Furniture specific
  seating_capacity: int("seating_capacity"), // for sofas, chairs
  number_of_pieces: int("number_of_pieces").default(1),
  assembly_required: boolean("assembly_required").default(false),
  
  // Brand/manufacturer
  brand: varchar("brand", { length: 100 }),
  
}, (table) => ({
  idxMaterial: index("idx_furniture_details_material").on(table.material),
  idxBrand: index("idx_furniture_details_brand").on(table.brand),
}));

// Real Estate specific details
export const CLASSIFIED_REAL_ESTATE_DETAILS = mysqlTable("classified_real_estate_details", {
  id: int("id").primaryKey().autoincrement(),
  classified_id: int("classified_id").notNull().unique().references(() => USER_CLASSIFIED_DETAILS.id, { onDelete: 'cascade' }),
  
  property_type: mysqlEnum("property_type", ["apartment", "house", "villa", "plot", "commercial", "office", "shop"]),
  
  // Size details
  area_sqft: int("area_sqft"),
  area_unit: mysqlEnum("area_unit", ["sqft", "sqm", "acres", "cents"]).default("sqft"),
  
  // Property details
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  floor_number: int("floor_number"),
  total_floors: int("total_floors"),
  
  // Amenities (can be JSON or separate table)
  parking: boolean("parking").default(false),
  furnished: mysqlEnum("furnished", ["unfurnished", "semi_furnished", "fully_furnished"]),
  
  // For rental properties
  monthly_rent: decimal("monthly_rent", { precision: 12, scale: 2 }),
  security_deposit: decimal("security_deposit", { precision: 12, scale: 2 }),
  maintenance_charges: decimal("maintenance_charges", { precision: 12, scale: 2 }),
  
  // Property age
  construction_year: int("construction_year"),
  ready_to_move: boolean("ready_to_move").default(true),
  
  // Legal
  clear_title: boolean("clear_title").default(true),
  
}, (table) => ({
  idxPropertyType: index("idx_real_estate_property_type").on(table.property_type),
  idxBedrooms: index("idx_real_estate_bedrooms").on(table.bedrooms),
  idxArea: index("idx_real_estate_area").on(table.area_sqft),
  idxRent: index("idx_real_estate_rent").on(table.monthly_rent),
}));

// AFTER (fixed version)
export const VEHICLE_BRANDS = mysqlTable("vehicle_brands", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(), // ✅ Removed .unique()
  vehicle_type: mysqlEnum("vehicle_type", ["car", "bike", "bicycle", "commercial"]),
  is_active: boolean("is_active").default(true),
}, (table) => ({
  idxVehicleType: index("idx_vehicle_brands_type").on(table.vehicle_type),
  uniqueNameType: unique().on(table.name, table.vehicle_type), // ✅ Added composite unique constraint
}));

export const VEHICLE_MODELS = mysqlTable("vehicle_models", {
  id: int("id").primaryKey().autoincrement(),
  brand_id: int("brand_id").notNull().references(() => VEHICLE_BRANDS.id),
  name: varchar("name", { length: 100 }).notNull(),
  is_active: boolean("is_active").default(true),
}, (table) => ({
  idxBrand: index("idx_vehicle_models_brand").on(table.brand_id),
  uniqueBrandModel: unique().on(table.brand_id, table.name),
}));

export const ELECTRONICS_BRANDS = mysqlTable("electronics_brands", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(),
  category: mysqlEnum("category", ["mobile", "laptop", "tv", "appliance", "camera", "other"]),
  is_active: boolean("is_active").default(true),
}, (table) => ({
  idxCategory: index("idx_electronics_brands_category").on(table.category),
  uniqueNameCategory: unique().on(table.name, table.category),
}));

// Images table for multiple images per classified
export const CLASSIFIED_IMAGES = mysqlTable("classified_images", {
  id: int("id").primaryKey().autoincrement(),
  classified_id: int("classified_id").notNull().references(() => USER_CLASSIFIED_DETAILS.id, { onDelete: 'cascade' }),
  image_url: text("image_url").notNull(),
  is_primary: boolean("is_primary").default(false),
  display_order: int("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxClassified: index("idx_classified_images_classified").on(table.classified_id),
  idxPrimary: index("idx_classified_images_primary").on(table.is_primary),
}));