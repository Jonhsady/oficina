CREATE TYPE "Role" AS ENUM ('admin', 'tecnico');

CREATE TYPE "OrderStatus" AS ENUM ('aberto', 'em_diagnostico', 'aguardando_peca', 'pronto', 'entregue');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "replacedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Equipment" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "serial" TEXT,
  CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Equipment_customerId_idx" ON "Equipment"("customerId");

ALTER TABLE "Equipment"
  ADD CONSTRAINT "Equipment_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ServiceOrder" (
  "id" TEXT NOT NULL,
  "number" SERIAL NOT NULL,
  "customerId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'aberto',
  "assigneeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceOrder_number_key" ON "ServiceOrder"("number");
CREATE INDEX "ServiceOrder_status_idx" ON "ServiceOrder"("status");
CREATE INDEX "ServiceOrder_customerId_idx" ON "ServiceOrder"("customerId");

ALTER TABLE "ServiceOrder"
  ADD CONSTRAINT "ServiceOrder_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceOrder"
  ADD CONSTRAINT "ServiceOrder_equipmentId_fkey"
  FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceOrder"
  ADD CONSTRAINT "ServiceOrder_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OrderPhoto" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderPhoto_orderId_idx" ON "OrderPhoto"("orderId");

ALTER TABLE "OrderPhoto"
  ADD CONSTRAINT "OrderPhoto_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
