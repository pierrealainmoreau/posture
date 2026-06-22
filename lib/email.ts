import { Resend } from "resend";
import { createHmac } from "crypto";

const FROM = "L'équipe Posture <no-reply@posture.pamoreau.xyz>";

function getHmacSecret(): string {
  const s = process.env.EMAIL_HMAC_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("EMAIL_HMAC_SECRET manquant — à définir en variable d'environnement");
  return s;
}

// ─── Lien de désinscription (signé, sans authentification requise) ────────────

function signUserId(userId: string): string {
  return createHmac("sha256", getHmacSecret()).update(userId).digest("hex").slice(0, 32);
}

export function buildUnsubscribeUrl(userId: string, appUrl: string): string {
  return `${appUrl}/api/unsubscribe?u=${encodeURIComponent(userId)}&s=${signUserId(userId)}`;
}

export function verifyUnsubscribeSignature(userId: string, signature: string): boolean {
  return signUserId(userId) === signature;
}

// ─── Tracking par destinataire (signé, identifie le user dans le pixel/clic) ──

function signTrackingToken(broadcastId: string, userId: string): string {
  return createHmac("sha256", getHmacSecret()).update(`track:${broadcastId}:${userId}`).digest("hex").slice(0, 32);
}

export function verifyTrackingToken(broadcastId: string, userId: string, signature: string): boolean {
  return signTrackingToken(broadcastId, userId) === signature;
}

function signClickUrl(broadcastId: string, url: string): string {
  return createHmac("sha256", getHmacSecret()).update(`click-url:${broadcastId}:${url}`).digest("hex").slice(0, 16);
}

export function verifyClickUrl(broadcastId: string, url: string, sig: string): boolean {
  if (!sig) return false;
  return signClickUrl(broadcastId, url) === sig;
}

// ─── Types broadcast ──────────────────────────────────────────────────────────

export type EmailBlock =
  | { id: string; type: "text";    content: string; bold: boolean; italic: boolean }
  | { id: string; type: "callout"; content: string }
  | { id: string; type: "cta";     label: string;   url: string   }
  | { id: string; type: "image";   src: string;     alt: string   };

const DARK_MODE_STYLE = `<style>
    @media (prefers-color-scheme: dark) {
      .logo-light { display: none !important; }
      .logo-dark  { display: block !important; }
    }
  </style>`;

function logoHtml(appUrl: string): string {
  return `<img src="${appUrl}/brand/posture-logo-beta-black.png" alt="Posture" width="130" class="logo-light" style="display:block;width:130px;height:auto;margin:0 0 32px;border:0;">
          <img src="${appUrl}/brand/posture-logo-beta-white.png" alt="Posture" width="130" class="logo-dark" style="display:none;width:130px;height:auto;margin:0 0 32px;border:0;">`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface TrackingConfig { broadcastId: string; userId: string; signature: string; appUrl: string }

function renderBlocks(blocks: EmailBlock[], tracking?: TrackingConfig): string {
  return blocks.map((b) => {
    if (b.type === "text") {
      const safe = escHtml(b.content).replace(/\n/g, "<br>");
      const style = `margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;${b.bold ? "font-weight:700;" : ""}${b.italic ? "font-style:italic;" : ""}`;
      return `<p style="${style}">${safe}</p>`;
    }
    if (b.type === "callout") {
      const safe = escHtml(b.content).replace(/\n/g, "<br>");
      return `<div style="background:#eff6ff;border-left:3px solid #1d4ed8;border-radius:6px;padding:14px 16px;margin:0 0 16px;"><p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;">${safe}</p></div>`;
    }
    if (b.type === "cta") {
      const label = escHtml(b.label || "En savoir plus");
      const rawUrl = b.url || "https://posture.pamoreau.xyz";
      const href = tracking
        ? escHtml(`${tracking.appUrl}/api/track/email/${tracking.broadcastId}/click?u=${encodeURIComponent(tracking.userId)}&s=${tracking.signature}&url=${encodeURIComponent(rawUrl)}&us=${signClickUrl(tracking.broadcastId, rawUrl)}`)
        : escHtml(rawUrl);
      return `<div style="margin:0 0 24px;"><a href="${href}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">${label}</a></div>`;
    }
    if (b.type === "image") {
      const src = escHtml(b.src || "");
      const alt = escHtml(b.alt || "");
      if (!src) return "";
      return `<div style="margin:0 0 24px;"><img src="${src}" alt="${alt}" style="max-width:100%;border-radius:10px;display:block;" /></div>`;
    }
    return "";
  }).join("\n");
}

export function buildBroadcastHtml(
  firstName: string,
  blocks: EmailBlock[],
  appUrl: string,
  unsubscribeUrl: string,
  trackingRecipient?: { broadcastId: string; userId: string },
): string {
  const tracking: TrackingConfig | undefined = trackingRecipient
    ? { ...trackingRecipient, signature: signTrackingToken(trackingRecipient.broadcastId, trackingRecipient.userId), appUrl }
    : undefined;
  const pixel = tracking
    ? `<img src="${appUrl}/api/track/email/${tracking.broadcastId}/open?u=${encodeURIComponent(tracking.userId)}&s=${tracking.signature}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  ${DARK_MODE_STYLE}
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 36px;box-sizing:border-box;">
        <tr><td>
          ${logoHtml(appUrl)}
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Bonjour ${escHtml(firstName)},</p>
          ${renderBlocks(blocks, tracking)}
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0 20px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">posture.pamoreau.xyz</a>
            &nbsp;·&nbsp;
            <a href="${escHtml(unsubscribeUrl)}" style="color:#9ca3af;text-decoration:underline;">Se désinscrire</a>
          </p>
          ${pixel}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export type SuggestionStatus = "planned" | "done" | "rejected";

type EmailableStatus = "planned" | "done";

const TEMPLATES: Record<EmailableStatus, { subject: string; heading: string; intro: string; body: string; cta: string }> = {
  planned: {
    subject: "Votre suggestion sur Posture 💡",
    heading: "On vous a entendu !",
    intro:   "",
    body:    "Merci pour votre suggestion. Nous l'avons bien notée et elle est intégrée à notre feuille de route pour de prochaines évolutions de Posture. Votre retour compte vraiment pour nous.",
    cta:     "On vous prévient dès que c'est livré 🚀",
  },
  done: {
    subject: "Votre suggestion est en ligne ✅",
    heading: "C'est déjà en production !",
    intro:   "Vous nous aviez soumis la suggestion suivante :",
    body:    "Bonne nouvelle : Elle vient d'être implémentée dans Posture. Connectez-vous pour la découvrir. Merci d'avoir contribué à améliorer l'outil !",
    cta:     "Découvrir la nouveauté →",
  },
};

function buildHtml(
  firstName: string,
  excerpt: string,
  tpl: (typeof TEMPLATES)[EmailableStatus],
  appUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  ${DARK_MODE_STYLE}
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 36px;box-sizing:border-box;">
        <tr><td>
          <!-- Logo -->
          ${logoHtml(appUrl)}

          <!-- Heading -->
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">${tpl.heading}</h1>

          <!-- Greeting -->
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Bonjour ${firstName},</p>

          ${tpl.intro ? `
          <!-- Intro (before excerpt) -->
          <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${tpl.intro}</p>

          <!-- Suggestion excerpt -->
          <div style="background:#f3f4f6;border-left:3px solid #6366f1;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
            <p style="margin:0;font-size:13px;color:#6b7280;font-style:italic;">"${excerpt}"</p>
          </div>

          <!-- Body (after excerpt) -->
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">${tpl.body}</p>
          ` : `
          <!-- Body -->
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">${tpl.body}</p>

          <!-- Suggestion excerpt -->
          <div style="background:#f3f4f6;border-left:3px solid #6366f1;border-radius:6px;padding:14px 16px;margin:0 0 28px;">
            <p style="margin:0;font-size:13px;color:#6b7280;font-style:italic;">"${excerpt}"</p>
          </div>
          `}

          <!-- CTA -->
          <a href="${appUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;margin:0 0 32px;">${tpl.cta}</a>

          <!-- Footer -->
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Vous recevez cet email car vous avez soumis une suggestion sur Posture.<br>
            <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">posture.pamoreau.xyz</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendSuggestionEmail({
  to,
  firstName,
  excerpt,
  status,
  appUrl = "https://posture.pamoreau.xyz",
}: {
  to: string;
  firstName: string;
  excerpt: string;
  status: EmailableStatus;
  appUrl?: string;
}) {
  const tpl = TEMPLATES[status];

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from:     FROM,
    to:       [to],
    replyTo: "pierrealainmoreau@gmail.com",
    subject:  tpl.subject,
    html:     buildHtml(firstName, excerpt.slice(0, 200), tpl, appUrl),
  });

  if (error) throw new Error(error.message);
}
