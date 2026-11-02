-- AlterTable: SalesOrderProduct.quantity 由 INTEGER 改为 REAL，以支持小数重量（如 1.5 斤）
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalesOrderProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productUnitId" INTEGER,
    "quantity" REAL NOT NULL,
    "baseQuantity" REAL NOT NULL DEFAULT 0,
    "price" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0.00,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesOrderProduct_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesOrderProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrderProduct_productUnitId_fkey" FOREIGN KEY ("productUnitId") REFERENCES "ProductUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalesOrderProduct" ("baseQuantity", "createdAt", "id", "price", "productId", "productUnitId", "quantity", "salesOrderId", "totalAmount", "updatedAt")
SELECT "baseQuantity", "createdAt", "id", "price", "productId", "productUnitId", "quantity", "salesOrderId", "totalAmount", "updatedAt" FROM "SalesOrderProduct";
DROP TABLE "SalesOrderProduct";
ALTER TABLE "new_SalesOrderProduct" RENAME TO "SalesOrderProduct";
CREATE UNIQUE INDEX "SalesOrderProduct_salesOrderId_productId_key" ON "SalesOrderProduct"("salesOrderId", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
