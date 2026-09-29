-- CreateTable
CREATE TABLE "diagnostic_sessions" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "adapter" TEXT NOT NULL,
    "vehicleVin" TEXT,
    "notes" TEXT,

    CONSTRAINT "diagnostic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_readings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telemetry_readings_sessionId_recordedAt_idx" ON "telemetry_readings"("sessionId", "recordedAt");

-- CreateIndex
CREATE INDEX "telemetry_readings_name_recordedAt_idx" ON "telemetry_readings"("name", "recordedAt");

-- AddForeignKey
ALTER TABLE "telemetry_readings" ADD CONSTRAINT "telemetry_readings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
