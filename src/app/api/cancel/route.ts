import { NextResponse } from "next/server";

import { deleteBooking, fetchBookings } from "@/lib/airtable";
import { buildSlotView, generateScheduleSlots, mergeBookingsIntoSlots } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slotId = String(body.slotId || "").trim();
    const userId = String(body.userId || "").trim();

    if (!slotId || !userId) {
      return NextResponse.json({ ok: false, message: "Slot and user are required." }, { status: 400 });
    }

    const schedule = generateScheduleSlots();
    const bookings = await fetchBookings();
    const slot = mergeBookingsIntoSlots(schedule, bookings).find((entry) => entry.id === slotId);
    if (!slot || !slot.bookedBy) {
      return NextResponse.json({ ok: false, message: "That slot is already open." }, { status: 400 });
    }

    if (slot.bookedBy !== userId) {
      return NextResponse.json({ ok: false, message: "You can only cancel your own booking." }, { status: 403 });
    }

    const booking = bookings.find(
      (entry) => entry.bookedBy === userId && entry.startTime === slot.startTime && entry.endTime === slot.endTime
    );
    if (!booking) {
      return NextResponse.json({ ok: false, message: "No booking record found for this slot." }, { status: 404 });
    }

    await deleteBooking(booking.id);
    const clearedSlot = { ...slot, bookedBy: null, bookedName: null };
    return NextResponse.json({ ok: true, message: "Booking canceled.", slot: buildSlotView(clearedSlot) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel booking.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
