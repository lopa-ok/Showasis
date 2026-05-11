import { NextResponse } from "next/server";
import { DateTime } from "luxon";

import { fetchBookings } from "@/lib/airtable";
import {
  buildSlotView,
  generateScheduleSlots,
  getCurrentAndNextSlots,
  getScheduleWarnings,
  mergeBookingsIntoSlots,
} from "@/lib/booking";
import { EVENT_TIMEZONE } from "@/lib/config";

export const revalidate = 15;

export async function GET() {
  try {
    const [bookings] = await Promise.all([fetchBookings()]);
    const schedule = generateScheduleSlots();
    const slots = mergeBookingsIntoSlots(schedule, bookings);
    const scheduleWarnings = getScheduleWarnings(slots);
    const now = DateTime.now().setZone(EVENT_TIMEZONE);
    const cutoff = now.plus({ hours: 24 });
    const windowedSlots = slots.filter((slot) => {
      const start = DateTime.fromISO(slot.startTime, { zone: EVENT_TIMEZONE });
      const end = DateTime.fromISO(slot.endTime, { zone: EVENT_TIMEZONE });
      return end > now && start <= cutoff;
    });
    const { current, next } = getCurrentAndNextSlots(windowedSlots);

    return NextResponse.json({
      slots: windowedSlots.map(buildSlotView),
      serverTime: new Date().toISOString(),
      timezone: EVENT_TIMEZONE,
      currentSlotId: current?.id,
      nextSlotId: next?.id,
      scheduleWarnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch slots.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
