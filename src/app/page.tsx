"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AppShell from "@/components/AppShell";
import { saveSlackIdentity } from "@/lib/identity";

export default function SlackCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Connecting to Slack...");

  useEffect(() => {
    const error = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (error) {
      setMessage("Slack sign-in was canceled.");
      return;
    }

    if (!code || !state) {
      setMessage("Missing Slack authorization details.");
      return;
    }

    const completeAuth = async () => {
      try {
        const response = await fetch(
          `/api/auth/slack/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        );
        const data = (await response.json()) as {
          ok: boolean;
          message?: string;
          identity?: { id: string; displayName: string; teamId?: string; teamName?: string };
        };

        if (!response.ok || !data.ok || !data.identity) {
          throw new Error(data.message || "Slack sign-in failed.");
        }

        saveSlackIdentity(data.identity);
        router.replace("/");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Slack sign-in failed.";
        setMessage(errorMessage);
      }
    };

    void completeAuth();
  }, [router, searchParams]);

  return (
    <AppShell title="Showasis" subtitle="Slack sign-in">
      <section className="panel panel-solid">
        <p className="panel-body">{message}</p>
      </section>
    </AppShell>
  );
}
