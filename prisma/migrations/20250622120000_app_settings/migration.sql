CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
