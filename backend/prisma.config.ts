// prisma.config.ts
/// <reference types="node" />

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Solo la URL, el provider ya está en schema.prisma
    url: process.env.DATABASE_URL!,
  },
});
