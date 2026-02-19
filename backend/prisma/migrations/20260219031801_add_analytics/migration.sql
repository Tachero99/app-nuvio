-- CreateTable
CREATE TABLE "menu_views" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "userAgent" TEXT,
    "ipAddress" VARCHAR(45),
    "referer" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_clicks" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "productId" INTEGER,
    "userAgent" TEXT,
    "ipAddress" VARCHAR(45),
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_views_businessId_idx" ON "menu_views"("businessId");

-- CreateIndex
CREATE INDEX "menu_views_viewedAt_idx" ON "menu_views"("viewedAt");

-- CreateIndex
CREATE INDEX "product_clicks_businessId_idx" ON "product_clicks"("businessId");

-- CreateIndex
CREATE INDEX "product_clicks_productId_idx" ON "product_clicks"("productId");

-- CreateIndex
CREATE INDEX "product_clicks_clickedAt_idx" ON "product_clicks"("clickedAt");

-- AddForeignKey
ALTER TABLE "menu_views" ADD CONSTRAINT "menu_views_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_clicks" ADD CONSTRAINT "product_clicks_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_clicks" ADD CONSTRAINT "product_clicks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
