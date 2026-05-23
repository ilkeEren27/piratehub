"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { places } from "@/data/places";
import { upsertEventAction } from "@/app/events/_actions";
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
  Calendar as CalendarLucide
} from "lucide-react";

export default function EventForm({ initialEvent }) {
  const t = useTranslations("eventForm");

  const [detailsJson, setDetailsJson] = useState(
    initialEvent?.detailsJson ?? { type: "doc", content: [] }
  );

  // Helpers
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

  // Start "today" at midnight for calendar constraints
  const todayStart = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const isEditing = !!initialEvent?.id;

  // Start datetime state
  const [startDate, setStartDate] = useState(() =>
    initialEvent?.startsAt ? new Date(initialEvent.startsAt) : new Date()
  );
  const [startTime, setStartTime] = useState(() =>
    initialEvent?.startsAt ? toTimeString(new Date(initialEvent.startsAt)) : ""
  );

  // End datetime state
  const [endDate, setEndDate] = useState(() =>
    initialEvent?.endsAt ? new Date(initialEvent.endsAt) : new Date()
  );
  const [endTime, setEndTime] = useState(() =>
    initialEvent?.endsAt ? toTimeString(new Date(initialEvent.endsAt)) : ""
  );

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
                            fromDate={todayStart}
                            disabled={(d) => d < todayStart}
                            onSelect={(d) => {
                              setStartDate(d);
                              setOpenStart(false);
                            }}
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
                          onChange={(e) => setStartTime(e.target.value)}
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
                            defaultMonth={endDate ?? todayStart}
                            fromDate={todayStart}
                            disabled={(d) => d < todayStart}
                            onSelect={(d) => {
                              setEndDate(d);
                              setOpenEnd(false);
                            }}
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
                          onChange={(e) => setEndTime(e.target.value)}
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

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
              >
                {initialEvent ? t("saveChanges") : t("createButton")}
              </Button>
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
