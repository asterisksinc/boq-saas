import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function parseEnv(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  }
  return env;
}

describe("Project Template Detail API Integration & Real Records", () => {
  const env = parseEnv(path.resolve(__dirname, "../.env.local"));
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  it("loads actual templates from Supabase and verifies dynamic data contract", async () => {
    expect(supabaseUrl).toBeDefined();
    expect(supabaseKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data, error } = await supabase
      .from("project_templates")
      .select("id, template_code, name, status, business_type, tags, structure, costing_boq, workflow, documents, use_count, current_version")
      .is("archived_at", null)
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    const first = data![0];
    expect(first.id).toBeDefined();
    expect(first.name).toBeDefined();
    expect(typeof first.name).toBe("string");
    expect(first.status).toBeDefined();

    console.log(`Live DB verified template: "${first.name}" (ID: ${first.id}, version: ${first.current_version})`);
  });
});
