// Quick ENV Check Script
// Run: node check-env.js

import "dotenv/config";

console.log("🔍 ENV Check:");
console.log("============");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORTAL_BASE_URL:", process.env.PORTAL_BASE_URL || "(not set - will use default: http://localhost:5173)");
console.log("ADMIN_BASE_URL:", process.env.ADMIN_BASE_URL || "(not set - will use default: http://localhost:5175)");
console.log("");

const portalUrl = process.env.PORTAL_BASE_URL ?? 
  (process.env.NODE_ENV === "production"
    ? "https://www.caisty.com"
    : "http://localhost:5173");

console.log("✅ Final PORTAL_BASE_URL:", portalUrl);

if (portalUrl.includes("5175") || portalUrl.includes("admin")) {
  console.log("");
  console.log("❌ ERROR: PORTAL_BASE_URL zeigt auf Admin-Port!");
  console.log("   Ändere in .env: PORTAL_BASE_URL=http://localhost:5173");
} else {
  console.log("");
  console.log("✅ PORTAL_BASE_URL ist korrekt!");
}

