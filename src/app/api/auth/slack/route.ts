import { NextResponse } from "next/server";
import crypto from "crypto";

import { getSlackConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const { clientId, redirectUri, scopes } = getSlackConfig();
  const state = crypto.randomUUID();

  const authUrl = new URL("https://slack.com/oauth/v2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scopes.join(","));
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("slack_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
