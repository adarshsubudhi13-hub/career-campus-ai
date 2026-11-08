import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ParsedResume } from "./parse-resume.functions";

const SaveInput = z.object({
  file_name: z.string().min(1).max(300),
  file_path: z.string().min(1).max(500),
  file_size: z.number().int().nonnegative().nullable().optional(),
  mime_type: z.string().max(200).nullable().optional(),
  parsed: z.any(),
});

export const saveResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: data.file_name,
        file_path: data.file_path,
        file_size: data.file_size ?? null,
        mime_type: data.mime_type ?? null,
        parsed: data.parsed,
      })
      .select("id, file_name, file_path, file_size, mime_type, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listResumes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("resumes")
      .select("id, file_name, file_path, file_size, mime_type, parsed, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      file_name: string;
      file_path: string;
      file_size: number | null;
      mime_type: string | null;
      parsed: ParsedResume;
      created_at: string;
    }>;
  });

export const deleteResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error: fetchErr } = await supabase
      .from("resumes")
      .select("file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (row?.file_path) {
      await supabase.storage.from("resumes").remove([row.file_path]);
    }
    const { error } = await supabase.from("resumes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getResumeSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: signed, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
