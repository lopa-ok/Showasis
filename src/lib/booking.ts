import { DateTime } from "luxon";

import { EVENT_TIMEZONE } from "./config";
import type { Booking, Slot, SlotType, SlotView } from "./types";

const toDateTime = (iso: string) => DateTime.fromISO(iso, { zone: EVENT_TIMEZONE });

export const buildSlotView = (slot: Slot): SlotView => ({
    ...slot,
    isBooked: Boolean(slot.bookedBy),
    isBuffer: slot.type === "buffer",
});

const toIso = (value: DateTime) =>
    value.toUTC().toISO() ?? value.toUTC().toFormat("yyyy-LL-dd'T'HH:mm:ss'Z'");

export const generateScheduleSlots = (options?: {
    startDate?: string;
    days?: number;
    dayStart?: string;
    dayEnd?: string;
    bookingMinutes?: number;
    bufferMinutes?: number;
    bookingsPerCycle?: number;
}): Slot[] => {
    const startDate = options?.startDate;
    const days = options?.days ?? 7;
    const dayStart = options?.dayStart ?? "00:00";
    const dayEnd = options?.dayEnd ?? "23:59";
    const bookingMinutes = options?.bookingMinutes ?? 15;
    const bufferMinutes = options?.bufferMinutes ?? 5;
    const bookingsPerCycle = options?.bookingsPerCycle ?? 3;

    const [startHour, startMinute] = dayStart.split(":").map(Number);
    const [endHour, endMinute] = dayEnd.split(":").map(Number);
    if (Number.isNaN(startHour) || Number.isNaN(startMinute)) {
        throw new Error("Invalid dayStart time.");
    }
    if (Number.isNaN(endHour) || Number.isNaN(endMinute)) {
        throw new Error("Invalid dayEnd time.");
    }

    const startDay = startDate
        ? DateTime.fromISO(startDate, { zone: EVENT_TIMEZONE }).startOf("day")
        : DateTime.now().setZone(EVENT_TIMEZONE).startOf("day");
    const endDay = startDay.plus({ days: days - 1 });

    const slots: Slot[] = [];
    const cycleMinutes = bookingsPerCycle * bookingMinutes + bufferMinutes;

    for (let day = startDay; day <= endDay; day = day.plus({ days: 1 })) {
        const dayStartTime = day.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
        const dayEndTime = day.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
        if (dayEndTime <= dayStartTime) {
            throw new Error("dayEnd must be after dayStart.");
        }

        const addSlot = (cursor: DateTime, type: SlotType, minutes: number, showerId: number = 1) => {
            slots.push({
                id: `${cursor.toFormat("yyyyLLdd")}-${cursor.toFormat("HHmm")}-${type}-${showerId}`,
                createdTime: toIso(cursor),
                startTime: toIso(cursor),
                endTime: toIso(cursor.plus({ minutes })),
                type,
                bookedBy: null,
                bookedName: null,
            });
        };

        let cursor = dayStartTime;
        while (cursor.plus({ minutes: cycleMinutes }) <= dayEndTime) {
            for (let i = 0; i < bookingsPerCycle; i += 1) {
                addSlot(cursor, "booking", bookingMinutes, 1);
                addSlot(cursor, "booking", bookingMinutes, 2);
                cursor = cursor.plus({ minutes: bookingMinutes });
            }
            addSlot(cursor, "buffer", bufferMinutes, 1);
            cursor = cursor.plus({ minutes: bufferMinutes });
        }
    }

    return slots;
};

export const mergeBookingsIntoSlots = (slots: Slot[], bookings: Booking[]): Slot[] => {
    const bookingsByTime = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
        const key = `${booking.startTime}|${booking.endTime}`;
        if (!bookingsByTime.has(key)) {
            bookingsByTime.set(key, []);
        }
        bookingsByTime.get(key)!.push(booking);
    });

    return slots.map((slot) => {
        if (slot.type !== "booking") {
            return slot;
        }
        const key = `${slot.startTime}|${slot.endTime}`;
        const queue = bookingsByTime.get(key);
        if (!queue || queue.length === 0) return slot;
        
        const booking = queue.shift();
        if (!booking) return slot;
        
        return {
            ...slot,
            createdTime: booking.createdTime,
            bookedBy: booking.bookedBy,
            bookedName: booking.bookedName,
        };
    });
};

export const getScheduleWarnings = (slots: Slot[]): string[] => {
    const warnings: string[] = [];
    let bookingCount = 0;

    slots.forEach((slot, index) => {
        const start = toDateTime(slot.startTime);
        const end = toDateTime(slot.endTime);
        const duration = Math.round(end.diff(start, "minutes").minutes);

        if (slot.type === "booking" && duration !== 15) {
            warnings.push(`Slot ${index + 1} is a booking but it lasts ${duration} minutes.`);
        }

        if (slot.type === "buffer" && duration !== 5) {
            warnings.push(`Slot ${index + 1} is a buffer but it only lasts ${duration} minutes.`);
        }

        if (slot.type === "booking") {
            bookingCount += 1;
            if (bookingCount > 6) {
                warnings.push(`Slot ${index + 1} breaks the 3-booking cycle (6 slots total).`);
            }
        } else {
            if (bookingCount !== 6) {
                warnings.push(`Slot ${index + 1} is a buffer but it only comes after ${bookingCount} booking(s).`);
            }
            bookingCount = 0;
        }
    });

    if (bookingCount !== 0 && bookingCount !== 6) {
        warnings.push(`Final Cycle ends after ${bookingCount} booking slots.`);
    }
    return warnings;
};

export const getCurrentAndNextSlots = (slots: Slot[]) => {
    const now = DateTime.now().setZone(EVENT_TIMEZONE);
    let current: Slot | undefined;
    let next: Slot | undefined;

    for (const slot of slots) {
        if (slot.type !== "booking") {
            continue;
        }
        const start = toDateTime(slot.startTime);
        const end = toDateTime(slot.endTime);
        if (!current && start <= now && end > now) {
            current = slot;
            continue;
        }
        if (!next && start > now) {
            next = slot;
            break;
        }
    }
    return { current, next };
};

export const validateBooking = (slot: Slot, allSlots: Slot[], userId: string) => {
    const now = DateTime.now().setZone(EVENT_TIMEZONE);
    const start = toDateTime(slot.startTime);
    const end = toDateTime(slot.endTime);
    const duration = Math.round(end.diff(start, "minutes").minutes);

    let bookingCount = 0;
    for (const entry of allSlots) {
        if (entry.type === "booking") {
            bookingCount += 1;
            if (bookingCount > 6 && entry.id === slot.id) {
                return { ok: false, message: "That slot breaks the 3-booking cycle." };
            }
        } else {
            bookingCount = 0;
        }
    }

    if (slot.type !== "booking") {
        return { ok: false, message: "Only booking slots can be reserved." };
    }

    if (duration !== 15) {
        return { ok: false, message: "Booking slots must last exactly 15 minutes." };
    }

    if (slot.bookedBy) {
        return { ok: false, message: "That slot is already booked." };
    }

    if (start.diff(now, "minutes").minutes < 5) {
        return { ok: false, message: "Bookings must be made at least 5 minutes in advance." };
    }

    const activeBooking = allSlots.find((entry) => {
        if (entry.bookedBy !== userId) return false;
        return toDateTime(entry.endTime) > now;
    });
    if (activeBooking) {
        return { ok: false, message: "You already have an active or upcoming booking." };
    }

    const cooldownBooking = now.minus({ hours: 12 });
    const recentBooking = allSlots.find((entry) => {
        if (entry.bookedBy !== userId) return false;
        const created = DateTime.fromISO(entry.createdTime, { zone: EVENT_TIMEZONE });
        return created > cooldownBooking;
    });
    if (recentBooking) {
        return { ok: false, message: "You have booked a slot recently." };
    }
    return { ok: true, message: "Slot is valid for booking." };
};