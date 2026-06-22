import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Partial<ResponseCookie>) {
          request.cookies.set({ name, value, ...options } as ResponseCookie);
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options } as ResponseCookie);
        },
        remove(name: string, options: Partial<ResponseCookie>) {
          request.cookies.set({ name, value: "", ...options } as ResponseCookie);
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options } as ResponseCookie);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const pathSegments = pathname.split("/");

  // Icebreaker participant page: /icebreaker/room/[code] (not host subpage)
  const isIcebreakerParticipantPage =
    pathSegments[1] === "icebreaker" &&
    pathSegments[2] === "room" &&
    pathSegments[3] !== undefined &&
    pathSegments[4] === undefined;

  // All mini-jeux pages are public (team games, no account needed for participants)
  const isMiniJeuxPage = pathSegments[1] === "mini-jeux";

  // All Boussole pages are public — no login required to create or join a session.
  // The host uses a pseudo (no account needed). Guests join the same way.
  const isBoussoleGuestPage = pathSegments[1] === "boussole";

  // Retrospective participant pages are public — the room code is the access credential.
  // Only creation requires a manager account (/toolbox/health-radar/create).
  const isRetrospectivePage =
    pathSegments[1] === "retrospective" && pathSegments[2] !== undefined && pathSegments[2] !== "create";

  // Reunion-maker guest pages (Kudo Cards, ABCDE…) are public for the same reason.
  const isReunionMakerGuestPage = pathSegments[1] === "reunion-maker";

  // Coach manual evaluation pages are public — the token is the access credential.
  const isCoachManualPage =
    pathSegments[1] === "coach" && pathSegments[2] === "manual" && pathSegments[3] !== undefined;

  // Toolbox mini-jeux participant pages are public — no account needed to join a session.
  // Hub (/toolbox/{game}) and create (/toolbox/{game}/create) remain protected (host only).
  // Public: /toolbox/{game}/join  and  /toolbox/{game}/{code}/**  (lobby, play, results…)
  const isToolboxParticipantPage =
    pathSegments[1] === "toolbox" &&
    pathSegments[2] !== undefined &&
    (pathSegments[3] === "join" || pathSegments[4] !== undefined);

  const isPublicRoomPage =
    isIcebreakerParticipantPage ||
    isMiniJeuxPage ||
    isBoussoleGuestPage ||
    isRetrospectivePage ||
    isReunionMakerGuestPage ||
    isCoachManualPage ||
    isToolboxParticipantPage;

  // Pages qui redirigent les utilisateurs déjà connectés vers /
  const isAuthOnlyPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-email" ||
    pathname === "/email-confirmed";

  // Lien de désinscription email — accessible sans compte (le token signé fait foi)
  const isUnsubscribePage = pathname === "/unsubscribe";

  // Toutes les pages accessibles sans compte
  const isPublicPage = isAuthOnlyPage || isPublicRoomPage || isUnsubscribePage;

  const isApiRoute = pathname.startsWith("/api/");
  const isStaticAsset = pathname.startsWith("/_next/");

  if (pathname.startsWith("/api/admin/")) {
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  if (isStaticAsset || isApiRoute) return response;

  // Non connecté sur une page protégée → signup (pages join) ou login (reste)
  if (!user && !isPublicPage) {
    const isJoinPage = pathname.endsWith("/join") || pathname.includes("/join?");
    const redirectTo = isJoinPage ? "/signup" : "/login";
    const next = request.nextUrl.pathname + request.nextUrl.search;
    const url = new URL(redirectTo, request.url);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // Connecté sur une page auth-only (login/signup…) → next ou dashboard
  if (user && isAuthOnlyPage) {
    const next = request.nextUrl.searchParams.get("next");
    const dest = next && next.startsWith("/") ? next : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (pathname.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
