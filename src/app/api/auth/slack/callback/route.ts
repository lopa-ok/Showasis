import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSlackConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { clientId, clientSecret, redirectUri, allowedUserIds } = getSlackConfig();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = cookies().get("slack_oauth_state")?.value;

    if (!code || !state) {
      return NextResponse.json(
        { ok: false, message: "Missing Slack authorization details." },
        { status: 400 }
      );
    }

    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { ok: false, message: "Slack state did not match. Please try again." },
        { status: 400 }
      );
    }

    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    const tokenData = (await tokenResponse.json()) as {
      ok: boolean;
      error?: string;
      access_token?: string;
      authed_user?: { id?: string; access_token?: string };
      team?: { id?: string; name?: string };
    };

    if (!tokenResponse.ok || !tokenData.ok) {
      return NextResponse.json(
        { ok: false, message: tokenData.error || "Slack token exchange failed." },
        { status: 400 }
      );
    }

    const userId = tokenData.authed_user?.id;
    const userToken = tokenData.authed_user?.access_token ?? tokenData.access_token;

    if (!userId || !userToken) {
      return NextResponse.json(
        { ok: false, message: "Slack did not return a usable token." },
        { status: 400 }
      );
    }
    
    if (allowedUserIds.length > 0 && !allowedUserIds.includes(userId)) {
      return NextResponse.json(
        { ok: false, message: "Your Slack ID is not authorized to use this application." },
        { status: 403 }
      );
    }

    const userResponse = await fetch(
      `https://slack.com/api/users.info?user=${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const userData = (await userResponse.json()) as {
      ok: boolean;
      error?: string;
      user?: {
        id: string;
        real_name?: string;
        profile?: { display_name?: string; real_name?: string };
      };
    };

    if (!userResponse.ok || !userData.ok || !userData.user) {
      return NextResponse.json(
        { ok: false, message: userData.error || "Slack user lookup failed." },
        { status: 400 }
      );
    }

    const displayName =
      userData.user.profile?.display_name ||
      userData.user.real_name ||
      userData.user.profile?.real_name ||
      userData.user.id;

    const response = NextResponse.json({
      ok: true,
      identity: {
        id: userData.user.id,
        displayName,
        teamId: tokenData.team?.id,
        teamName: tokenData.team?.name,
      },
    });

    response.cookies.set("slack_oauth_state", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slack sign-in failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
