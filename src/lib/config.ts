import "server-only";

declare const process: { env: Record<string, string | undefined> };

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export type AirtableConfig = {
  apiToken: string;
  baseId: string;
  tableName: string;
};

export const getAirtableConfig = (): AirtableConfig => {
  const apiToken = requireEnv("AIRTABLE_API_TOKEN");
  const rawBaseId = requireEnv("AIRTABLE_BASE_ID");
  const tableName = requireEnv("AIRTABLE_TABLE_NAME");

  return {
    apiToken,
    baseId: rawBaseId.split("/")[0],
    tableName,
  };
};

export type SlackConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
};

export const getSlackConfig = (): SlackConfig => {
  const clientId = requireEnv("SLACK_CLIENT_ID");
  const clientSecret = requireEnv("SLACK_CLIENT_SECRET");
  const redirectUri =
    process.env.SLACK_REDIRECT_URI ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/auth/slack/callback`
      : "");

  if (!redirectUri) {
    throw new Error(
      "Missing required environment variable: SLACK_REDIRECT_URI (or NEXT_PUBLIC_APP_URL)"
    );
  }

  const scopes = (process.env.SLACK_SCOPES || "users:read,users:read.email")
    .split(",")
  .map((scope: string) => scope.trim())
    .filter(Boolean);

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
  };
};

export const EVENT_TIMEZONE = "America/Chicago";