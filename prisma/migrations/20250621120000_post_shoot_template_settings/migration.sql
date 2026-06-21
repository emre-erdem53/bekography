-- CreateTable
CREATE TABLE "PostShootTemplateSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "variables" JSONB NOT NULL DEFAULT '[]',
    "digital" JSONB NOT NULL DEFAULT '{}',
    "editing" JSONB NOT NULL DEFAULT '{}',
    "printing" JSONB NOT NULL DEFAULT '{}',
    "noPrintingText" TEXT NOT NULL DEFAULT 'Baskı yok',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostShootTemplateSettings_pkey" PRIMARY KEY ("id")
);
