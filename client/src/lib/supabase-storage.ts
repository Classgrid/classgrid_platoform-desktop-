import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  "";
const supabaseKey =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

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
