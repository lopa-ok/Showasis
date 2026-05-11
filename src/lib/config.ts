import "server-only";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const AIRTABLE_API_TOKEN = requireEnv("AIRTABLE_API_TOKEN");
const rawBaseId = requireEnv("AIRTABLE_BASE_ID");
export const AIRTABLE_BASE_ID = rawBaseId.split("/")[0];
export const AIRTABLE_TABLE_NAME = requireEnv("AIRTABLE_TABLE_NAME");

export const EVENT_TIMEZONE = "America/Chicago";