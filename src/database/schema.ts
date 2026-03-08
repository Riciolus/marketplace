import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().$type<"admin" | "user">().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const statusEnum = pgEnum("status", ["draft", "active", "archived"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    title: text("title").notNull(),

    description: varchar("description", { length: 2000 }).notNull(),

    slug: varchar("slug", { length: 255 }).notNull().unique(),

    status: statusEnum().notNull().default("draft"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sellerIdx: index("products_seller_idx").on(table.sellerId),
  })
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    sku: text("sku").notNull(),

    price: integer("price").notNull(),

    stock: integer("stock").notNull().default(0),

    attributes: jsonb("attributes").$type<Record<string, string>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index("variants_product_idx").on(table.productId),
    skuProductIdx: uniqueIndex("variants_product_sku_idx").on(
      table.productId,
      table.sku
    ),
  })
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    url: varchar("url", { length: 500 }).notNull(),

    position: integer("position").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index("product_images_product_idx").on(table.productId),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull().unique(),

    slug: varchar("slug", { length: 255 }).notNull().unique(),

    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    parentIdx: index("categories_parent_idx").on(table.parentId),

    parentNameUnique: uniqueIndex("categories_parent_name_unique").on(
      table.parentId,
      table.name
    ),
  })
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.productId, table.categoryId],
    }),

    categoryIdx: index("product_categories_category_idx").on(table.categoryId),
  })
);
