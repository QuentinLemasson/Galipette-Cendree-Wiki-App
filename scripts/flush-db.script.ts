#!/usr/bin/env node

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { flushDatabase } from "../src/database/operations/flushOperation.js";

async function main() {
  try {
    console.log("Starting database flush script...");
    const result = await flushDatabase();
    console.log(result.message);
    process.exit(0);
  } catch (error) {
    console.error("Error in flush script:", error);
    process.exit(1);
  }
}

main();
