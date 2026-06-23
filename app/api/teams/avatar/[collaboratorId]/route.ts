import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "collaborator-avatars";
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Vérify collaborator belongs to user
    const { data: collab } = await supabase
      .from("collaborators")
      .select("id")
      .eq("id", params.collaboratorId)
      .eq("user_id", user.id)
      .single<{ id: string }>();
    if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.size) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Format non supporté (jpg, png, webp)" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux (max 2 Mo)" }, { status: 400 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const fileName = `${user.id}/${params.collaboratorId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const admin = createAdminSupabaseClient();

    // Create bucket if needed
    await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: "2MB" });

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: file.type, upsert: true });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(fileName);

    // Add cache-busting param so browser reloads after re-upload
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("collaborators")
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq("id", params.collaboratorId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: collab } = await supabase
      .from("collaborators")
      .select("id")
      .eq("id", params.collaboratorId)
      .eq("user_id", user.id)
      .single<{ id: string }>();
    if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    const admin = createAdminSupabaseClient();
    const exts = ["jpg", "png", "webp"];
    await Promise.all(exts.map((ext) => admin.storage.from(BUCKET).remove([`${user.id}/${params.collaboratorId}.${ext}`])));

    await supabase
      .from("collaborators")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", params.collaboratorId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur serveur" }, { status: 500 });
  }
}
