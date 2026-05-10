import "server-only";

import { AIRTABLE_API_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } from "./config";
import type { AirtableBookingFields, AirtableRecord, Booking } from "./types";

const TABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

const airtableFetch = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
};

const mapBooking = (record: AirtableRecord<AirtableBookingFields>): Booking => ({
  id: record.id,
  createdTime: record.createdTime,
  startTime: record.fields.start_time,
  endTime: record.fields.end_time,
  bookedBy: record.fields.booked_by,
  bookedName: record.fields.booked_name,
});

export const fetchBookings = async (): Promise<Booking[]> => {
  const records: AirtableRecord<AirtableBookingFields>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(TABLE_URL);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("sort[0][field]", "start_time");
    url.searchParams.set("sort[0][direction]", "asc");
    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const response = await airtableFetch<{ records: AirtableRecord<AirtableBookingFields>[]; offset?: string }>(
      url.toString()
    );
    const filtered = response.records.filter((record) =>
      Boolean(
        record.fields.start_time &&
          record.fields.end_time &&
          record.fields.booked_by &&
          record.fields.booked_name
      )
    );
    records.push(...filtered);
    offset = response.offset;
  } while (offset);

  return records.map(mapBooking);
};

export const fetchBookingById = async (bookingId: string): Promise<Booking> => {
  const response = await airtableFetch<AirtableRecord<AirtableBookingFields>>(`${TABLE_URL}/${bookingId}`);
  return mapBooking(response);
};

export const createBooking = async (
  fields: AirtableBookingFields
): Promise<Booking> => {
  const response = await airtableFetch<{ records: AirtableRecord<AirtableBookingFields>[] }>(TABLE_URL, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }] }),
  });

  const record = response.records[0];
  if (!record) {
    throw new Error("Airtable create failed: no record returned");
  }

  return mapBooking(record);
};

export const deleteBooking = async (bookingId: string): Promise<void> => {
  await airtableFetch(`${TABLE_URL}/${bookingId}`, { method: "DELETE" });
};
