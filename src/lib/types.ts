export type SlotType = "booking" | "buffer";

export type AirtableBookingFields = {
    start_time: string;
    end_time: string;
    booked_by: string;
    booked_name: string;
};

export type AirtableRecord<Tfields> = {
    id: string;
    fields: Tfields;
    createdTime: string;
};

export type Booking = {
    id: string;
    createdTime: string;
    startTime: string;
    endTime: string;
    bookedBy: string;
    bookedName: string;
};

export type Slot = {
    id: string;
    createdTime: string;
    startTime: string;
    endTime: string;
    type: SlotType;
    bookedBy?: string | null;
    bookedName?: string | null;
};

export type SlotView = Slot & {
    isBooked: boolean;
    isBuffer: boolean;
};

export type BookingState = {
    slotId: string;
    startTime: string;
    endTime: string;
    bookedName: string | null;
};

export type UserIdentity = {
    id: string;
    displayName: string;
};

export type SlotsResponse = {
    slots: SlotView[];
    serverTime: string;
    timezone: string;
    currentSlotId?: string;
    nextSlotId?: string;
    scheduleWarnings?: string[];
};

export type BookingResponse = {
    ok: boolean;
    message: string;
    slot?: SlotView;
};

