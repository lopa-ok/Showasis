import { NextResponse } from "next/server";

import { createBooking, fetchBookings } from "@/lib/airtable";
import {
  buildSlotView,
  generateScheduleSlots,
  mergeBookingsIntoSlots,
  validateBooking,
} from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slotId = String(body.slotId || "").trim();
    const userId = String(body.userId || "").trim();
    const displayName = String(body.displayName || "").trim();

    if (!slotId || !userId || !displayName) {
      return NextResponse.json({ ok: false, message: "Slack sign-in is required to book." }, { status: 400 });
    }

    const schedule = generateScheduleSlots();
    const bookings = await fetchBookings();
    const mergedSlots = mergeBookingsIntoSlots(schedule, bookings);
    const slot = mergedSlots.find((entry) => entry.id === slotId);
    if (!slot) {
      return NextResponse.json({ ok: false, message: "That slot is not available." }, { status: 404 });
    }

    const validation = validateBooking(slot, mergedSlots, userId);

    if (!validation.ok) {
      return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
    }

    const booking = await createBooking({
      start_time: slot.startTime,
      end_time: slot.endTime,
      booked_by: userId,
      booked_name: displayName,
    });
    const bookedSlot = {
      ...slot,
      bookedBy: booking.bookedBy,
      bookedName: booking.bookedName,
    };
    return NextResponse.json({ ok: true, message: "Booked!", slot: buildSlotView(bookedSlot) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to book slot.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}