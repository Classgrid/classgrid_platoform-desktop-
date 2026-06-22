import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://bumxgscngzjadyozdpce.supabase.co";

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXhnc2NuZ3pqYWR5b3pkcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzQ4MzUsImV4cCI6MjA4Njk1MDgzNX0.jpnG_wEjzLDz5mMOgCCQsnuWe9uwzZq58LrKotRuXu8";

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-anon-key"
);

const BUCKET = "support-attachments";

export async function uploadToSupabase(
  file: File,
  folder: string = "uploads"
): Promise<{ url: string; path: string } | null> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase upload error: missing Supabase URL or anon key");
      return null;
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${folder}/${timestamp}_${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

export async function deleteFromSupabase(path: string): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase delete error: missing Supabase URL or anon key");
      return false;
    }

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      console.error("Supabase delete error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Delete failed:", err);
    return false;
  }
}
