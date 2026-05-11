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

const airtableConfig: AirtableConfig = {
  apiToken: requireEnv("AIRTABLE_API_TOKEN"),
  baseId: requireEnv("AIRTABLE_BASE_ID").split("/")[0],
  tableName: requireEnv("AIRTABLE_TABLE_NAME"),
};

export const getAirtableConfig = (): AirtableConfig => ({ ...airtableConfig });

export const AIRTABLE_API_TOKEN = airtableConfig.apiToken;
export const AIRTABLE_BASE_ID = airtableConfig.baseId;
export const AIRTABLE_TABLE_NAME = airtableConfig.tableName;

export type SlackConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
allowedUserIds: string[];
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


  const allowedUserIds = (process.env.SLACK_ALLOWED_USER_IDS || "")
    .split(",")
    .map((id: string) => id.trim())
    .filter(Boolean);

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    allowedUserIds,
  };
};

export const EVENT_TIMEZONE = "America/Chicago";