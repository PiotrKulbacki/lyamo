-- CreateTable
CREATE TABLE "user_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_categories_userId_idx" ON "user_categories"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_categories_userId_name_key" ON "user_categories"("userId", "name");

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy built-in category keys
UPDATE "transactions" SET "category" = 'CoffeeShop' WHERE "category" = 'Coffee';
UPDATE "transactions" SET "category" = 'Other' WHERE "category" IN ('Shopping', 'Utilities');
UPDATE "recurring_expenses" SET "category" = 'CoffeeShop' WHERE "category" = 'Coffee';
UPDATE "recurring_expenses" SET "category" = 'Other' WHERE "category" IN ('Shopping', 'Utilities');
