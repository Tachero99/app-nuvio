// backend/lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error("Falta SUPABASE_URL en .env");
if (!serviceRole) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env");

export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { persistSession: false },
});
