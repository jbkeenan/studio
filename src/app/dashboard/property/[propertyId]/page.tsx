
// src/app/dashboard/property/[propertyId]/page.tsx
"use client";

import { useState, useEffect, type FormEvent, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ThermostatControl } from '@/components/thermostat/ThermostatControl';
import { SmartScheduleForm } from '@/components/smart-schedule/SmartScheduleForm';
import { SmartScheduleDisplay } from '@/components/smart-schedule/SmartScheduleDisplay';
import type { SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import type { IcalEvent } from '@/ai/flows/parse-ical-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar as ShadCalendar, type CalendarProps } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertCircle, CalendarDays, ChevronLeft, Home as HomeIcon, Loader2, Rss, Settings2, ExternalLink, Edit2 } from "lucide-react";
import { getPropertyById, type Property } from '@/lib/mock-properties';
import { parseIcalFeedAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format, getMonth, getYear, isWithinInterval, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, isEqual, formatISO, setHours, setMinutes, setSeconds, addHours, subHours } from 'date-fns';

export default function PropertyDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [scheduleData, setScheduleData] = useState<SmartScheduleSuggestionsOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  const [icalUrl, setIcalUrl] = useState<string>('https://app.ownerrez.com/feeds/ical/6b5cb4a943524fd1b9231177736b3053');
  const [hoursBeforeCheckIn, setHoursBeforeCheckIn] = useState<number>(2);
  const [hoursAfterCheckOut, setHoursAfterCheckOut] = useState<number>(1);
  const [checkoutPresetTemp, setCheckoutPresetTemp] = useState<string>('18°C / 64°F');
  const [bookingEvents, setBookingEvents] = useState<IcalEvent[]>([]);
  const [isLoadingIcal, setIsLoadingIcal] = useState(false);
  const [icalError, setIcalError] = useState<string | null>(null);

  const [selectedEventForTable, setSelectedEventForTable] = useState<IcalEvent | null>(null);
  const [isEventDetailDialogOpen, setIsEventDetailDialogOpen] = useState(false);

  const [selectedEventForOverride, setSelectedEventForOverride] = useState<IcalEvent | null>(null);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideAcOnTime, setOverrideAcOnTime] = useState(''); // HH:MM
  const [overrideAcAdjustTime, setOverrideAcAdjustTime] = useState(''); // HH:MM
  const [overrideCheckoutPresetTemp, setOverrideCheckoutPresetTemp] = useState('');


  const localStorageKeyPrefix = `thermoai_prop_${propertyId}_`;
  const getBookingOverrideKey = (uid: string, field: string) => `${localStorageKeyPrefix}booking_${uid}_${field}`;


  const fetchAndDisplayIcalEvents = useCallback(async (urlToFetch: string) => {
    if (!urlToFetch) {
      setIcalError("Please enter an iCal feed URL.");
      toast({ title: "Missing URL", description: "iCal feed URL is required.", variant: "destructive" });
      return;
    }
    setIsLoadingIcal(true);
    setIcalError(null);
    
    const result = await parseIcalFeedAction({ icalUrl: urlToFetch });

    if (result.success && result.data) {
      setBookingEvents(result.data.events || []);
      if (result.data.events?.length === 0 && !result.data.error) {
        if (!isLoadingIcal) toast({ title: "Calendar Sync", description: "No bookings found in the iCal feed." });
      } else if (result.data.events && result.data.events.length > 0) {
        if (!isLoadingIcal) toast({ title: "Calendar Synced", description: `Found ${result.data.events.length} booking(s).` });
      }
      if(result.data.error) {
        setIcalError(`Partial success: ${result.data.error}`);
        if (!isLoadingIcal) toast({ title: "Calendar Sync Warning", description: result.data.error, variant: "destructive" });
      }
    } else {
      setIcalError(result.error || "Failed to parse iCal feed.");
      if (!isLoadingIcal) toast({ title: "Calendar Sync Error", description: result.error || "Unknown error.", variant: "destructive" });
    }
    setIsLoadingIcal(false);
  }, [toast, isLoadingIcal]);

  useEffect(() => {
    if (propertyId) {
      const foundProperty = getPropertyById(propertyId);
      setProperty(foundProperty || null);

      const storedIcalUrl = localStorage.getItem(`${localStorageKeyPrefix}icalUrl`);
      const storedHoursBefore = localStorage.getItem(`${localStorageKeyPrefix}hoursBeforeCheckIn`);
      const storedHoursAfter = localStorage.getItem(`${localStorageKeyPrefix}hoursAfterCheckOut`);
      const storedCheckoutTemp = localStorage.getItem(`${localStorageKeyPrefix}checkoutPresetTemp`);

      let urlToLoad = icalUrl; 
      if (storedIcalUrl) {
        setIcalUrl(storedIcalUrl);
        urlToLoad = storedIcalUrl;
      }
      
      if (storedHoursBefore) setHoursBeforeCheckIn(parseInt(storedHoursBefore, 10));
      if (storedHoursAfter) setHoursAfterCheckOut(parseInt(storedHoursAfter, 10));
      if (storedCheckoutTemp) setCheckoutPresetTemp(storedCheckoutTemp);
      
      fetchAndDisplayIcalEvents(urlToLoad);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, localStorageKeyPrefix]);

  const handleSaveAutomationSettings = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`${localStorageKeyPrefix}icalUrl`, icalUrl);
    localStorage.setItem(`${localStorageKeyPrefix}hoursBeforeCheckIn`, hoursBeforeCheckIn.toString());
    localStorage.setItem(`${localStorageKeyPrefix}hoursAfterCheckOut`, hoursAfterCheckOut.toString());
    localStorage.setItem(`${localStorageKeyPrefix}checkoutPresetTemp`, checkoutPresetTemp);
    toast({
      title: "Settings Saved",
      description: "Automation settings have been saved locally for this property.",
    });
  };

  const handleManualSync = () => {
    fetchAndDisplayIcalEvents(icalUrl);
  };
  
  const handleScheduleSuccess = (data: SmartScheduleSuggestionsOutput) => {
    setScheduleData(data);
    setServerError(null);
  };

  const eventsForSelectedMonth = useMemo(() => {
    if (!calendarDate || bookingEvents.length === 0) return [];
    const year = getYear(calendarDate);
    const month = getMonth(calendarDate); 
    const interval = {
      start: startOfMonth(new Date(year, month, 1)),
      end: endOfMonth(new Date(year, month, 1)),
    };
    return bookingEvents.filter(event => {
      try {
        const startDate = parseISO(event.startDate);
        const endDate = parseISO(event.endDate);
        return isWithinInterval(startDate, interval) || isWithinInterval(endDate, interval) || 
               (startDate < interval.start && endDate > interval.end); 
      } catch (e) {
        return false;
      }
    }).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  }, [calendarDate, bookingEvents]);

  const handleEventRowClick = (event: IcalEvent) => {
    setSelectedEventForTable(event);
    setIsEventDetailDialogOpen(true);
  };

  const bookedDaysModifier = useMemo(() => {
    const dates: Date[] = [];
    bookingEvents.forEach(event => {
      try {
        const start = parseISO(event.startDate);
        const end = parseISO(event.endDate);
        // For day-long events, DTEND might be the start of the next day.
        // We want to include the actual last day of the event.
        const actualEnd = end > start && format(end, 'HH:mm:ss') === '00:00:00' ? subHours(end, 1) : end;
        const intervalDates = eachDayOfInterval({ start, end: actualEnd });
        dates.push(...intervalDates);
      } catch (e) { /* ignore_error */ }
    });
    return dates;
  }, [bookingEvents]);

  const calendarModifiers: CalendarProps['modifiers'] = {
    booked: bookedDaysModifier,
    // future: can add 'overrideApplied' modifier too
  };
  const calendarModifiersClassNames: CalendarProps['modifiersClassNames'] = {
    booked: 'day-booked',
  };
  
  const handleDayClick: CalendarProps['onDayClick'] = (day, modifiers) => {
    if (modifiers.booked) {
        const clickedDayEvents = bookingEvents.filter(event => {
            try {
                const startDate = parseISO(event.startDate);
                const endDate = parseISO(event.endDate);
                const actualEnd = endDate > startDate && format(endDate, 'HH:mm:ss') === '00:00:00' ? subHours(endDate, 1) : endDate;
                return eachDayOfInterval({start: startDate, end: actualEnd}).some(d => isEqual(d, day));
            } catch (e) {
                return false;
            }
        });

        if (clickedDayEvents.length > 0) {
            const eventToOverride = clickedDayEvents[0]; // For simplicity, take the first event
            setSelectedEventForOverride(eventToOverride);
            // Load existing overrides from localStorage
            const storedOnTime = localStorage.getItem(getBookingOverrideKey(eventToOverride.uid, 'overrideAcOnTime'));
            const storedAdjustTime = localStorage.getItem(getBookingOverrideKey(eventToOverride.uid, 'overrideAcAdjustTime'));
            const storedPresetTemp = localStorage.getItem(getBookingOverrideKey(eventToOverride.uid, 'overrideCheckoutPresetTemp'));
            
            setOverrideAcOnTime(storedOnTime || '');
            setOverrideAcAdjustTime(storedAdjustTime || '');
            setOverrideCheckoutPresetTemp(storedPresetTemp || '');
            
            setIsOverrideDialogOpen(true);
        } else {
             toast({ title: "No booking found", description: "No specific booking record found for this day to override." });
        }
    }
  };

  const handleSaveBookingOverrides = () => {
    if (!selectedEventForOverride) return;

    if (overrideAcOnTime) localStorage.setItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideAcOnTime'), overrideAcOnTime);
    else localStorage.removeItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideAcOnTime'));

    if (overrideAcAdjustTime) localStorage.setItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideAcAdjustTime'), overrideAcAdjustTime);
    else localStorage.removeItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideAcAdjustTime'));

    if (overrideCheckoutPresetTemp) localStorage.setItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideCheckoutPresetTemp'), overrideCheckoutPresetTemp);
    else localStorage.removeItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideCheckoutPresetTemp'));
    
    toast({ title: "Overrides Saved", description: `Custom automation settings for booking "${selectedEventForOverride.summary}" saved.` });
    setIsOverrideDialogOpen(false);
  };
  
  const handleClearBookingOverrides = () => {
    if (!selectedEventForOverride) return;
    localStorage.removeItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideAcOnTime'));
    localStorage.removeItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideAcAdjustTime'));
    localStorage.removeItem(getBookingOverrideKey(selectedEventForOverride.uid, 'overrideCheckoutPresetTemp'));
    setOverrideAcOnTime('');
    setOverrideAcAdjustTime('');
    setOverrideCheckoutPresetTemp('');
    toast({ title: "Overrides Cleared", description: `Custom settings for booking "${selectedEventForOverride.summary}" cleared. Property defaults will apply.` });
    setIsOverrideDialogOpen(false);
  };

  const calculateDefaultTime = (eventDateISO: string, offsetHours: number, isCheckIn: boolean) => {
    try {
      let baseDate = parseISO(eventDateISO);
      if (isCheckIn) {
        baseDate = subHours(baseDate, offsetHours);
      } else {
        baseDate = addHours(baseDate, offsetHours);
      }
      return format(baseDate, "MMM d, h:mm a");
    } catch {
      return "N/A";
    }
  };


  if (property === undefined) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading property details...</p>
        </main>
        <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
          © {new Date().getFullYear()} ThermoAI. All rights reserved.
        </footer>
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The property you are looking for does not exist or could not be loaded.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Link>
          </Button>
        </main>
        <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
          © {new Date().getFullYear()} ThermoAI. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm" className="hover:bg-accent/10">
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-headline font-semibold text-primary mb-1">{property.name}</h1>
        <p className="text-muted-foreground mb-8 flex items-center">
          <HomeIcon className="h-4 w-4 mr-2 flex-shrink-0" /> {property.address}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-8">
            <section aria-labelledby="thermostat-control-heading">
              <h2 id="thermostat-control-heading" className="text-2xl font-headline font-semibold mb-4 text-primary">
                Live Controls
              </h2>
              {property.thermostats.length > 0 ? (
                <div className="space-y-6">
                  {property.thermostats.map(thermostatConfig => (
                    <ThermostatControl
                      key={thermostatConfig.id}
                      initialName={thermostatConfig.initialName}
                      initialThermostatType={thermostatConfig.initialThermostatType}
                      initialTargetTempC={thermostatConfig.initialTargetTempC}
                      initialBrand={thermostatConfig.initialBrand}
                      initialUnit={thermostatConfig.initialUnit}
                    />
                  ))}
                </div>
              ) : (
                <Card className="rounded-xl shadow-md">
                  <CardContent className="pt-6">
                     <p className="text-muted-foreground text-center">No thermostats configured for this property.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            <section aria-labelledby="calendar-heading">
              <h2 id="calendar-heading" className="text-2xl font-headline font-semibold mb-4 text-primary flex items-center">
                <CalendarDays className="mr-2 h-6 w-6" /> Property Calendar
              </h2>
              <Card className="shadow-lg rounded-xl">
                <CardContent className="p-0 flex justify-center items-center">
                  <ShadCalendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={setCalendarDate}
                    className="rounded-md"
                    month={calendarDate} 
                    onMonthChange={setCalendarDate} 
                    modifiers={calendarModifiers}
                    modifiersClassNames={calendarModifiersClassNames}
                    onDayClick={handleDayClick}
                  />
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground mt-2 text-center">Click a booked day to set custom automation.</p>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section aria-labelledby="ical-sync-heading">
               <h2 id="ical-sync-heading" className="text-2xl font-headline font-semibold mb-4 text-primary flex items-center">
                <Rss className="mr-2 h-6 w-6" /> Calendar Sync & Automation
              </h2>
              <Card className="shadow-xl rounded-xl">
                <CardHeader>
                  <CardTitle>iCal Feed Sync</CardTitle>
                  <CardDescription>Sync with your booking calendar to automate thermostat settings.
                    {icalUrl.startsWith("https://app.ownerrez.com") && 
                      <span className="text-xs block mt-1">
                        (Using OwnerRez sample feed. <a href={icalUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">View Raw Feed <ExternalLink className="inline h-3 w-3"/></a>)
                      </span>
                    }
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="icalUrl">iCalendar Feed URL</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="icalUrl"
                        type="url"
                        placeholder="https://your-ical-provider.com/feed.ics"
                        value={icalUrl}
                        onChange={(e) => setIcalUrl(e.target.value)}
                        className="flex-grow"
                      />
                      <Button onClick={handleManualSync} disabled={isLoadingIcal}>
                        {isLoadingIcal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync"}
                      </Button>
                    </div>
                  </div>
                  {icalError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Sync Error</AlertTitle>
                      <AlertDescription>{icalError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {isLoadingIcal && eventsForSelectedMonth.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Loading bookings...</p>}
                  
                  {!isLoadingIcal && eventsForSelectedMonth.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Bookings for {format(calendarDate || new Date(), "MMMM yyyy")}:</h4>
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Summary</TableHead>
                              <TableHead>Check-in</TableHead>
                              <TableHead>Check-out</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventsForSelectedMonth.map(event => (
                              <TableRow key={event.uid} onClick={() => handleEventRowClick(event)} className="cursor-pointer hover:bg-muted/50">
                                <TableCell className="font-medium truncate max-w-xs" title={event.summary}>{event.summary || "N/A"}</TableCell>
                                <TableCell>{format(parseISO(event.startDate), "MMM d, h:mm a")}</TableCell>
                                <TableCell>{format(parseISO(event.endDate), "MMM d, h:mm a")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                  {!isLoadingIcal && !icalError && eventsForSelectedMonth.length === 0 && bookingEvents.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No bookings found for {format(calendarDate || new Date(), "MMMM yyyy")}. Select another month.</p>
                  )}
                  {!isLoadingIcal && !icalError && bookingEvents.length === 0 && (
                       <p className="text-sm text-muted-foreground text-center py-4">No bookings found in the provided iCal feed, or the feed is empty.</p>
                  )}
                </CardContent>
                
                <CardHeader className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className='flex items-center'>
                     <Settings2 className="mr-2 h-5 w-5 text-primary" />
                     <CardTitle className="text-lg">Automation Rules</CardTitle>
                    </div>
                  </div>
                  <CardDescription>Define how thermostats behave around check-in/out times. These settings are saved locally in your browser for this property.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSaveAutomationSettings}>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="hoursBeforeCheckIn">Turn On Before Check-in (Hours)</Label>
                                <Input id="hoursBeforeCheckIn" type="number" value={hoursBeforeCheckIn} onChange={e => setHoursBeforeCheckIn(parseInt(e.target.value))} min="0" className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="hoursAfterCheckOut">Adjust After Check-out (Hours)</Label>
                                <Input id="hoursAfterCheckOut" type="number" value={hoursAfterCheckOut} onChange={e => setHoursAfterCheckOut(parseInt(e.target.value))} min="0" className="mt-1" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="checkoutPresetTemp">Checkout Preset Temperature</Label>
                            <Input id="checkoutPresetTemp" type="text" value={checkoutPresetTemp} onChange={e => setCheckoutPresetTemp(e.target.value)} placeholder="e.g., 18°C or 64°F or Off" className="mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">Set a specific temperature or type 'Off'.</p>
                        </div>
                    </CardContent>
                    <CardContent className="pt-0">
                        <Button type="submit" className="w-full md:w-auto">Save Automation Settings</Button>
                    </CardContent>
                </form>
              </Card>
            </section>

            <section aria-labelledby="smart-schedule-heading" className="mt-8">
              <h2 id="smart-schedule-heading" className="text-2xl font-headline font-semibold mb-4 text-primary">
                AI Scheduling Assistant
              </h2>
              {serverError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <SmartScheduleForm
                onSubmitSuccess={handleScheduleSuccess}
                isLoading={isLoadingSuggestions}
                setIsLoading={setIsLoadingSuggestions}
                setServerError={setServerError}
              />
              {isLoadingSuggestions && (
                <div className="mt-8 text-center py-4">
                  <Loader2 className="h-6 w-6 text-primary animate-spin mr-2 inline-block" />
                  <p className="text-muted-foreground inline-block">AI is thinking... Please wait.</p>
                </div>
              )}
              {!isLoadingSuggestions && scheduleData && (
                <SmartScheduleDisplay data={scheduleData} />
              )}
            </section>
          </div>
        </div>
      </main>

      {selectedEventForTable && (
        <Dialog open={isEventDetailDialogOpen} onOpenChange={setIsEventDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedEventForTable.summary || "Booking Details"}</DialogTitle>
              <DialogDescription>
                Details for the selected booking and associated automation rules.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Booking Information:</h4>
                <p><strong>Check-in:</strong> {format(parseISO(selectedEventForTable.startDate), "MMM d, yyyy 'at' h:mm a")}</p>
                <p><strong>Check-out:</strong> {format(parseISO(selectedEventForTable.endDate), "MMM d, yyyy 'at' h:mm a")}</p>
                {selectedEventForTable.description && <p><strong>Description:</strong> {selectedEventForTable.description}</p>}
                {selectedEventForTable.location && <p><strong>Location:</strong> {selectedEventForTable.location}</p>}
              </div>
              <div>
                <h4 className="font-semibold mb-1">Configured Automation Rules:</h4>
                <p>Turn on thermostats: <strong>{hoursBeforeCheckIn} hours</strong> before check-in (approx. {calculateDefaultTime(selectedEventForTable.startDate, hoursBeforeCheckIn, true)}).</p>
                <p>Adjust thermostats: <strong>{hoursAfterCheckOut} hours</strong> after check-out (approx. {calculateDefaultTime(selectedEventForTable.endDate, hoursAfterCheckOut, false)}).</p>
                <p>Checkout Preset Temperature: <strong>{checkoutPresetTemp || "Not set"}</strong>.</p>
              </div>
               <div>
                <h4 className="font-semibold mb-1">Custom Overrides for this booking:</h4>
                <p>AC On Time: <strong>{localStorage.getItem(getBookingOverrideKey(selectedEventForTable.uid, 'overrideAcOnTime')) || "Default"}</strong></p>
                <p>AC Adjust Time: <strong>{localStorage.getItem(getBookingOverrideKey(selectedEventForTable.uid, 'overrideAcAdjustTime')) || "Default"}</strong></p>
                <p>Checkout Preset: <strong>{localStorage.getItem(getBookingOverrideKey(selectedEventForTable.uid, 'overrideCheckoutPresetTemp')) || "Default"}</strong></p>
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => {
                const eventToEdit = bookingEvents.find(e => e.uid === selectedEventForTable.uid);
                if (eventToEdit) {
                   setIsEventDetailDialogOpen(false); // Close this dialog first
                   handleDayClick(parseISO(eventToEdit.startDate), { booked: true }); // Simulate day click to open override
                }
              }}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit Overrides
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedEventForOverride && (
        <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-headline">Custom Automation for "{selectedEventForOverride.summary}"</DialogTitle>
                    <DialogDescription>
                        Override default property settings for this specific booking. Original check-in: {format(parseISO(selectedEventForOverride.startDate), "MMM d, yyyy 'at' h:mm a")}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Property Defaults:</h4>
                        <p className="text-xs text-muted-foreground">AC turns ON approx: {calculateDefaultTime(selectedEventForOverride.startDate, hoursBeforeCheckIn, true)}</p>
                        <p className="text-xs text-muted-foreground">AC adjusts at checkout approx: {calculateDefaultTime(selectedEventForOverride.endDate, hoursAfterCheckOut, false)}</p>
                        <p className="text-xs text-muted-foreground">Checkout Preset Temp: {checkoutPresetTemp || "Not set"}</p>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="overrideAcOnTime">Custom AC ON Time (HH:MM on check-in day)</Label>
                            <Input 
                                id="overrideAcOnTime" 
                                type="time" 
                                value={overrideAcOnTime} 
                                onChange={(e) => setOverrideAcOnTime(e.target.value)}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Leave blank to use property default.</p>
                        </div>
                        <div>
                            <Label htmlFor="overrideAcAdjustTime">Custom AC ADJUST Time (HH:MM on check-out day)</Label>
                            <Input 
                                id="overrideAcAdjustTime" 
                                type="time" 
                                value={overrideAcAdjustTime}
                                onChange={(e) => setOverrideAcAdjustTime(e.target.value)} 
                                className="mt-1"
                            />
                             <p className="text-xs text-muted-foreground mt-1">Leave blank to use property default.</p>
                        </div>
                        <div>
                            <Label htmlFor="overrideCheckoutPresetTemp">Custom Checkout Preset Temperature</Label>
                            <Input 
                                id="overrideCheckoutPresetTemp" 
                                type="text" 
                                placeholder="e.g., 20°C or Off"
                                value={overrideCheckoutPresetTemp}
                                onChange={(e) => setOverrideCheckoutPresetTemp(e.target.value)} 
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Leave blank to use property default.</p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button type="button" variant="destructive" onClick={handleClearBookingOverrides}>
                        Clear Overrides & Use Defaults
                    </Button>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSaveBookingOverrides}>Save Custom Settings</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
        © {new Date().getFullYear()} ThermoAI. All rights reserved.
      </footer>
    </div>
  );
}

