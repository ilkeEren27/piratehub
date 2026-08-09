"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
import { places } from "@/data/places";
import { upsertEventAction, deleteEventAction } from "@/app/events/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDownIcon,
  CalendarIcon,
  MapPinIcon,
  Clock,
  Type,
  FileText,
  Sparkles,
  Calendar as CalendarLucide,
  ImagePlus,
  Loader2,
  Trash2
} from "lucide-react";

function toTimeString(date) {
  if (!date) return "";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatForSubmission(date, timeStr) {
  // Returns local datetime string in format YYYY-MM-DDTHH:mm
  if (!date || !timeStr) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${timeStr}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Adds an hour to an "HH:mm" string. dayOffset is 1 when the result rolled
// past midnight, so the end date can follow the end time onto the next day.
function addOneHour(timeStr) {
  const [hours, minutes] = String(timeStr).split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const total = hours * 60 + minutes + 60;
  const dayOffset = Math.floor(total / 1440);
  const rest = total % 1440;
  return {
    time: `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(
      rest % 60
    ).padStart(2, "0")}`,
    dayOffset,
  };
}

export default function EventForm({ initialEvent }) {
  const t = useTranslations("eventForm");

  const [detailsJson, setDetailsJson] = useState(
    initialEvent?.detailsJson ?? { type: "doc", content: [] }
  );

  // Start "today" at midnight for calendar constraints
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  // Without an explicit end month the year dropdown stops at the current year.
  const lastMonth = useMemo(
    () => new Date(todayStart.getFullYear() + 3, 11, 31),
    [todayStart]
  );
  const isEditing = !!initialEvent?.id;

  // Start datetime state
  const [startDate, setStartDate] = useState(() =>
    startOfDay(initialEvent?.startsAt ? new Date(initialEvent.startsAt) : new Date())
  );
  const [startTime, setStartTime] = useState(() =>
    initialEvent?.startsAt ? toTimeString(new Date(initialEvent.startsAt)) : ""
  );

  // End datetime state
  const [endDate, setEndDate] = useState(() =>
    startOfDay(initialEvent?.endsAt ? new Date(initialEvent.endsAt) : new Date())
  );
  const [endTime, setEndTime] = useState(() =>
    initialEvent?.endsAt ? toTimeString(new Date(initialEvent.endsAt)) : ""
  );

  // The end fields mirror the start until the organizer edits them by hand.
  // A saved event starts out "edited" so we never overwrite stored values.
  const [endDateEdited, setEndDateEdited] = useState(isEditing);
  const [endTimeEdited, setEndTimeEdited] = useState(isEditing);
  // 1 while the auto-filled end time sits on the day after the start.
  const [autoEndDayOffset, setAutoEndDayOffset] = useState(0);

  // Popover open state
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const startsAtValue = useMemo(
    () => formatForSubmission(startDate, startTime),
    [startDate, startTime]
  );
  const endsAtValue = useMemo(
    () => formatForSubmission(endDate, endTime),
    [endDate, endTime]
  );
  const sameDay =
    startDate && endDate && startDate.getTime() === endDate.getTime();

  function onStartDateSelect(date) {
    if (!date) return;
    const day = startOfDay(date);
    setStartDate(day);
    setOpenStart(false);
    setEndDate((previous) => {
      if (!endDateEdited) return addDays(day, autoEndDayOffset);
      // Keep a hand-picked end date valid when the start moves past it.
      return previous && previous < day ? day : previous;
    });
  }

  function onEndDateSelect(date) {
    if (!date) return;
    setEndDate(startOfDay(date));
    setEndDateEdited(true);
    setOpenEnd(false);
  }

  function onStartTimeChange(value) {
    setStartTime(value);
    if (endTimeEdited || !value) return;
    const next = addOneHour(value);
    if (!next) return;
    setEndTime(next.time);
    setAutoEndDayOffset(next.dayOffset);
    if (!endDateEdited) setEndDate(addDays(startDate, next.dayOffset));
  }

  function onEndTimeChange(value) {
    setEndTime(value);
    setEndTimeEdited(true);
  }

  // Event poster
  const [imageUrl, setImageUrl] = useState(initialEvent?.imageUrl ?? "");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef(null);

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImageError("");
    setImageBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "image");
      fd.set("folder", "events");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImageUrl(data.url);
    } catch (error) {
      console.error("Event image upload error:", error);
      setImageError(`${t("errors.uploading")} ${error.message}`);
    } finally {
      setImageBusy(false);
    }
  }

  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!initialEvent?.id) return;
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.set("id", String(initialEvent.id));
      await deleteEventAction(fd);
      window.location.href = "/events";
    } catch (error) {
      console.error("Event deletion error:", error);
      alert(`${t("errors.deleting")} ${error.message}`);
      setDeleting(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    // Client-side validation: ensure end is not earlier than start
    const start = startsAtValue ? new Date(startsAtValue) : null;
    const end = endsAtValue ? new Date(endsAtValue) : null;
    if (
      !start ||
      !end ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      alert(t("errors.invalidDates"));
      return;
    }
    if (start > end) {
      alert(t("errors.endBeforeStart"));
      return;
    }
    // New: prevent creating events in the past (start must be in the future)
    const now = new Date();
    if (!isEditing && start < now) {
      alert(t("errors.pastStart"));
      return;
    }
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("detailsJson", JSON.stringify(detailsJson));
      if (initialEvent?.id) fd.set("id", String(initialEvent.id));
      await upsertEventAction(fd); // creates or updates
      // Redirect or show success message
      window.location.href = "/events";
    } catch (error) {
      console.error("Event creation error:", error);
      alert(`${t("errors.creating")} ${error.message}`);
    }
  }

  return (
    <main className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {initialEvent ? t("editTitle") : t("createTitle")}
          </h1>
          <p className="text-muted-foreground">
            {initialEvent ? t("editDescription") : t("createDescription")}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
          <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
            {/* Event Title Section */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                <Type className="w-4 h-4 text-primary" />
                {t("titleLabel")}
              </Label>
              <input
                id="title"
                name="title"
                defaultValue={initialEvent?.title ?? ""}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/60"
                placeholder={t("titlePlaceholder")}
              />
            </div>

            {/* Location Section */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
                <MapPinIcon className="w-4 h-4 text-primary" />
                {t("locationLabel")}
              </Label>
              <div className="relative">
                <select
                  id="location"
                  name="location"
                  defaultValue={initialEvent?.location ?? places[0]?.id}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none cursor-pointer"
                >
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allDay"
                  defaultChecked={!!initialEvent?.allDay}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <div>
                <span className="font-medium text-foreground">{t("allDayLabel")}</span>
                <p className="text-sm text-muted-foreground">{t("allDayHint")}</p>
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarLucide className="w-4 h-4 text-primary" />
                {t("dateAndTime")}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Start DateTime */}
                <div className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium text-sm">{t("starts")}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="start-date-picker" className="text-xs text-muted-foreground">
                        {t("date")}
                      </Label>
                      <Popover open={openStart} onOpenChange={setOpenStart}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="start-date-picker"
                            type="button"
                            className="w-full justify-between font-normal bg-background hover:bg-muted/50"
                          >
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              {startDate
                                ? startDate.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })
                                : t("selectDate")}
                            </span>
                            <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={startDate}
                            captionLayout="dropdown"
                            defaultMonth={startDate ?? todayStart}
                            startMonth={todayStart}
                            endMonth={lastMonth}
                            disabled={{ before: todayStart }}
                            onSelect={onStartDateSelect}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="start-time-picker" className="text-xs text-muted-foreground">
                        {t("time")}
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="time"
                          id="start-time-picker"
                          value={startTime}
                          onChange={(e) => onStartTimeChange(e.target.value)}
                          className="pl-10 bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <input
                    type="hidden"
                    name="startsAt"
                    value={startsAtValue}
                    required
                  />
                </div>

                {/* End DateTime */}
                <div className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="font-medium text-sm">{t("ends")}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="end-date-picker" className="text-xs text-muted-foreground">
                        {t("date")}
                      </Label>
                      <Popover open={openEnd} onOpenChange={setOpenEnd}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="end-date-picker"
                            type="button"
                            className="w-full justify-between font-normal bg-background hover:bg-muted/50"
                          >
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              {endDate
                                ? endDate.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })
                                : t("selectDate")}
                            </span>
                            <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={endDate}
                            captionLayout="dropdown"
                            defaultMonth={endDate ?? startDate ?? todayStart}
                            startMonth={startDate ?? todayStart}
                            endMonth={lastMonth}
                            disabled={{ before: startDate ?? todayStart }}
                            onSelect={onEndDateSelect}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="end-time-picker" className="text-xs text-muted-foreground">
                        {t("time")}
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="time"
                          id="end-time-picker"
                          value={endTime}
                          // On a single-day event the end can't precede the start.
                          min={sameDay && startTime ? startTime : undefined}
                          onChange={(e) => onEndTimeChange(e.target.value)}
                          className="pl-10 bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <input
                    type="hidden"
                    name="endsAt"
                    value={endsAtValue}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-primary" />
                {t("descriptionLabel")}
                <span className="text-xs text-muted-foreground font-normal">{t("optional")}</span>
              </Label>
              <textarea
                id="description"
                name="description"
                defaultValue={initialEvent?.description ?? ""}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/60 resize-none"
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            {/* Poster / Photo Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <ImagePlus className="w-4 h-4 text-primary" />
                {t("imageLabel")}
                <span className="text-xs text-muted-foreground font-normal">
                  {t("optional")}
                </span>
              </Label>

              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                <div className="relative w-full sm:w-44 shrink-0 aspect-video rounded-lg overflow-hidden border border-border bg-background">
                  {imageUrl ? (
                    <NextImage
                      alt={t("imagePreviewAlt")}
                      src={imageUrl}
                      fill
                      className="object-cover"
                      sizes="176px"
                    />
                  ) : (
                    /* No poster yet — the event falls back to the pirate icon */
                    <div className="flex h-full w-full items-center justify-center bg-primary/5">
                      <NextImage
                        alt={t("imagePreviewAlt")}
                        src="/pirate-icon.png"
                        width={56}
                        height={56}
                        className="opacity-70"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={imageBusy}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {imageBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4" />
                      )}
                      {imageBusy
                        ? t("uploadingImage")
                        : imageUrl
                        ? t("changeImage")
                        : t("uploadImage")}
                    </Button>
                    {imageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={imageBusy}
                        onClick={() => setImageUrl("")}
                        className="text-destructive border-destructive/40 hover:bg-destructive hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t("removeImage")}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("imageHint")}
                  </p>
                  {imageError && (
                    <p className="text-sm text-destructive">{imageError}</p>
                  )}
                </div>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onPickImage}
              />
              <input type="hidden" name="imageUrl" value={imageUrl} />
            </div>

            {/* Submit Button */}
            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                disabled={imageBusy}
                className="w-full py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
              >
                {initialEvent ? t("saveChanges") : t("createButton")}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleting}
                  onClick={onDelete}
                  className="w-full py-6 text-lg font-semibold rounded-xl border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-all duration-200"
                >
                  <Trash2 className="w-5 h-5" />
                  {deleting ? t("deleting") : t("deleteButton")}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Hint */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("reviewNotice")}
        </p>
      </div>
    </main>
  );
}
