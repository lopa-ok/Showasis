"use client";

import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/AppShell";
import { clearIdentity, loadLocalIdentity } from "@/lib/identity";
import type { LocalIdentity } from "@/lib/identity";
import type { SlotView, SlotsResponse } from "@/lib/types";

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

const formatTime = (iso: string, timezone: string) =>
  DateTime.fromISO(iso, { zone: timezone }).toFormat("h:mm a");

const formatRange = (start: string, end: string, timezone: string) =>
  `${formatTime(start, timezone)} - ${formatTime(end, timezone)}`;

const formatTimezoneLabel = (zone: string) =>
  zone === "America/Chicago" ? "Austin (Central)" : zone;

export default function HomePage() {
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [status, setStatus] = useState<StatusState>({ type: "loading", message: "Syncing slots..." });
  const [isSyncing, setIsSyncing] = useState(false);
  const [identity, setIdentity] = useState<LocalIdentity>({ id: "", displayName: "" });
  const [timezone, setTimezone] = useState("America/Chicago");
  const [currentSlotId, setCurrentSlotId] = useState<string | undefined>();
  const [nextSlotId, setNextSlotId] = useState<string | undefined>();
  const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);

  const loadSlots = async (showStatus = false) => {
    if (showStatus) {
      setStatus({ type: "loading", message: "Refreshing slots..." });
    }
    setIsSyncing(true);
    try {
      const response = await fetch("/api/slots", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load slots.");
      }
      const data = (await response.json()) as SlotsResponse;
      setSlots(data.slots);
      setTimezone(data.timezone);
      setCurrentSlotId(data.currentSlotId);
      setNextSlotId(data.nextSlotId);
      setScheduleWarnings(data.scheduleWarnings ?? []);
      setStatus({ type: "success", message: "Slots are live." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load slots.";
      setStatus({ type: "error", message });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setIdentity(loadLocalIdentity());
    loadSlots(true);
    const interval = window.setInterval(() => loadSlots(), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const dayGroups = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; slots: SlotView[] }>();
    slots.forEach((slot) => {
      const date = DateTime.fromISO(slot.startTime, { zone: timezone });
      const key = date.toFormat("yyyy-LL-dd");
      const label = date.toFormat("EEE, LLL dd");
      if (!groups.has(key)) {
        groups.set(key, { key, label, slots: [] });
      }
      groups.get(key)?.slots.push(slot);
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      slots: group.slots.sort(
        (a, b) =>
          DateTime.fromISO(a.startTime, { zone: timezone }).toMillis() -
          DateTime.fromISO(b.startTime, { zone: timezone }).toMillis()
      ),
    }));
  }, [slots, timezone]);

  const currentSlot = slots.find((slot) => slot.id === currentSlotId);
  const nextSlot = slots.find((slot) => slot.id === nextSlotId);
  const isSignedIn = Boolean(identity.id && identity.displayName);

  const handleSignOut = () => {
    clearIdentity();
    setIdentity({ id: "", displayName: "" });
  };

  const handleBook = async (slotId: string) => {
    setStatus({ type: "loading", message: "Locking your shower slot..." });
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          userId: identity.id,
          displayName: identity.displayName,
        }),
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Unable to book slot.");
      }
      setStatus({ type: "success", message: data.message });
      await loadSlots();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to book slot.";
      setStatus({ type: "error", message });
    }
  };

  const handleCancel = async (slotId: string) => {
    setStatus({ type: "loading", message: "Canceling your booking..." });
    try {
      const response = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, userId: identity.id }),
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Unable to cancel booking.");
      }
      setStatus({ type: "success", message: data.message });
      await loadSlots();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to cancel booking.";
      setStatus({ type: "error", message });
    }
  };

  return (
    <AppShell subtitle="Reserve your shower slot">
      <section className="calendar-layout">
        <aside className="calendar-sidebar">
          <article className="panel panel-solid panel-glow">
            <header className="panel-header">
              <p className="label">account</p>
              <span className="panel-tag">slack</span>
            </header>
            <p className="panel-body">
              {isSignedIn ? `Signed in as ${identity.displayName}.` : "Sign in with Slack to book a slot."}
            </p>
            <div className="panel-footer">
              {isSignedIn ? (
                <button className="button button-ghost" onClick={handleSignOut}>
                  sign out
                </button>
              ) : (
                <a className="button button-accent" href="/api/auth/slack">
                  sign in with slack
                </a>
              )}
            </div>
          </article>

          <article className="panel panel-solid panel-accent">
            <header className="panel-header">
              <p className="label">live cycle</p>
              <span className="panel-tag">{formatTimezoneLabel(timezone)}</span>
            </header>
            <div className="slot-highlight">
              <div>
                <p className="slot-label">current slot</p>
                <p className="slot-time">
                  {currentSlot ? formatTime(currentSlot.startTime, timezone) : "No slot active"}
                </p>
              </div>
              <div>
                <p className="slot-label">next slot</p>
                <p className="slot-time">
                  {nextSlot ? formatTime(nextSlot.startTime, timezone) : "No upcoming slot"}
                </p>
              </div>
            </div>
          </article>

          <article className="panel panel-solid">
            <header className="panel-header">
              <p className="label">showasis rules</p>
              <span className="panel-tag">server enforced</span>
            </header>
            <ul className="panel-list">
              <li>15 min booking slots, 5 min buffers</li>
              <li>One shower at a time + 12 hour cooldown</li>
              <li>Bookings must be 5+ minutes ahead</li>
              <li>Cancel your own booking anytime</li>
            </ul>
            {scheduleWarnings.length > 0 && (
              <div className="warning-panel">
                <p className="warning-title">schedule warnings</p>
                <ul>
                  {scheduleWarnings.map((warning, index) => (
                    <li key={`warning-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </aside>

        <section className="calendar-board">
          <header className="calendar-header">
            <div>
              <p className="label">next 24 hours</p>
              <p className="calendar-range">
                {DateTime.now().setZone(timezone).toFormat("EEEE, LLL dd")} · {formatTimezoneLabel(timezone)}
              </p>
            </div>
            <div className="status-banner" data-state={status.type}>
              {status.message}
              {isSyncing && <span className="status-pulse"> syncing</span>}
            </div>
          </header>

          {dayGroups.length === 0 && status.type === "loading" ? (
            <div className="calendar-empty">Loading slot calendar...</div>
          ) : dayGroups.length === 0 ? (
            <div className="calendar-empty">No slots in the next 24 hours.</div>
          ) : (
            <div className="calendar-days">
              {dayGroups.map((day) => (
                <div key={day.key} className="calendar-day">
                  <div className="day-header">
                    <div>
                      <p className="day-name">{day.label}</p>
                      <p className="day-meta">
                        {day.slots.filter((slot) => slot.type === "booking").length} bookable
                      </p>
                    </div>
                    <p className="day-count">{day.slots.length} slots</p>
                  </div>
                  <ul className="calendar-slots">
                    {day.slots.map((slot) => {
                      const isOwner = slot.bookedBy && slot.bookedBy === identity.id;
                      const canInteract = isSignedIn && slot.type === "booking";
                      return (
                        <li
                          key={slot.id}
                          className={`calendar-slot ${slot.type} ${slot.isBooked ? "booked" : "open"}`}
                        >
                          <div className="slot-info">
                            <p className="slot-time">{formatTime(slot.startTime, timezone)}</p>
                            <p className="slot-range">{formatRange(slot.startTime, slot.endTime, timezone)}</p>
                            <p className="slot-meta">
                              {slot.type === "buffer"
                                ? "buffer slot"
                                : slot.isBooked
                                  ? `booked by ${slot.bookedName}`
                                  : "open"}
                            </p>
                          </div>
                          <div className="slot-actions">
                            {slot.type === "buffer" ? (
                              <span className="slot-chip">buffer</span>
                            ) : slot.isBooked ? (
                              <button
                                className={`button ${isOwner ? "button-ghost" : "button-disabled"}`}
                                onClick={() => isOwner && handleCancel(slot.id)}
                                disabled={!isOwner}
                              >
                                {isOwner ? "cancel" : "booked"}
                              </button>
                            ) : (
                              <button
                                className="button button-accent"
                                onClick={() => handleBook(slot.id)}
                                disabled={!canInteract}
                              >
                                book
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {!isSignedIn && <p className="panel-footnote">Sign in with Slack to book a slot.</p>}
        </section>
      </section>
    </AppShell>
  );
}
