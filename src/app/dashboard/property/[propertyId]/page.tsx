
// src/app/dashboard/property/[propertyId]/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ThermostatControl } from '@/components/thermostat/ThermostatControl';
import { SmartScheduleForm } from '@/components/smart-schedule/SmartScheduleForm';
import { SmartScheduleDisplay } from '@/components/smart-schedule/SmartScheduleDisplay';
import type { SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import type { IcalEvent } from '@/ai/flows/parse-ical-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar as ShadCalendar } from "@/components/ui/calendar"; // Renamed to avoid conflict
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, CalendarDays, ChevronLeft, Home as HomeIcon, Loader2, Rss, Settings2 } from "lucide-react";
import { getPropertyById, type Property } from '@/lib/mock-properties';
import { parseIcalFeedAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function PropertyDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [scheduleData, setScheduleData] = useState<SmartScheduleSuggestionsOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // iCal and Automation State
  const [icalUrl, setIcalUrl] = useState<string>('https://app.ownerrez.com/feeds/ical/6b5cb4a943524fd1b9231177736b3053');
  const [hoursBeforeCheckIn, setHoursBeforeCheckIn] = useState<number>(2);
  const [hoursAfterCheckOut, setHoursAfterCheckOut] = useState<number>(1);
  const [checkoutPresetTemp, setCheckoutPresetTemp] = useState<string>('18°C / 64°F');
  const [bookingEvents, setBookingEvents] = useState<IcalEvent[]>([]);
  const [isLoadingIcal, setIsLoadingIcal] = useState(false);
  const [icalError, setIcalError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      const foundProperty = getPropertyById(propertyId);
      setProperty(foundProperty || null);
    }
  }, [propertyId]);

  const handleScheduleSuccess = (data: SmartScheduleSuggestionsOutput) => {
    setScheduleData(data);
    setServerError(null);
  };

  const handleLoadIcal = async (e: FormEvent) => {
    e.preventDefault();
    if (!icalUrl) {
      setIcalError("Please enter an iCal feed URL.");
      return;
    }
    setIsLoadingIcal(true);
    setIcalError(null);
    setBookingEvents([]);

    const result = await parseIcalFeedAction({ icalUrl });

    if (result.success && result.data) {
      setBookingEvents(result.data.events || []);
      if (result.data.events?.length === 0 && !result.data.error) {
        toast({ title: "Calendar Sync", description: "No upcoming bookings found in the iCal feed." });
      } else if (result.data.events?.length > 0) {
        toast({ title: "Calendar Synced", description: `Found ${result.data.events.length} booking(s).` });
      }
      if(result.data.error) {
        setIcalError(`Partial success: ${result.data.error}`);
        toast({ title: "Calendar Sync Warning", description: result.data.error, variant: "destructive" });
      }
    } else {
      setIcalError(result.error || "Failed to parse iCal feed.");
      toast({ title: "Calendar Sync Error", description: result.error || "Unknown error.", variant: "destructive" });
    }
    setIsLoadingIcal(false);
  };
  
  const handleSaveAutomationSettings = (e: FormEvent) => {
    e.preventDefault();
    // Future: Implement saving these settings
    toast({
      title: "Settings Saved (Mock)",
      description: "Automation settings have been saved (simulated).",
    });
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
                    // TODO: Future enhancement - highlight bookingEvents on this calendar
                  />
                </CardContent>
              </Card>
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
                  <CardDescription>Sync with your booking calendar (e.g., Airbnb, VRBO, OwnerRez) to automate thermostat settings.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLoadIcal}>
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
                        <Button type="submit" disabled={isLoadingIcal}>
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
                    {bookingEvents.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Upcoming Bookings:</h4>
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
                              {bookingEvents.map(event => (
                                <TableRow key={event.uid}>
                                  <TableCell className="font-medium truncate max-w-xs" title={event.summary}>{event.summary}</TableCell>
                                  <TableCell>{format(new Date(event.startDate), "MMM d, yyyy h:mm a")}</TableCell>
                                  <TableCell>{format(new Date(event.endDate), "MMM d, yyyy h:mm a")}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    {bookingEvents.length === 0 && !isLoadingIcal && icalUrl && !icalError && (
                         <p className="text-sm text-muted-foreground text-center py-4">No bookings found in the provided iCal feed, or the feed is empty.</p>
                    )}
                  </CardContent>
                </form>
                <CardHeader className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className='flex items-center'>
                     <Settings2 className="mr-2 h-5 w-5 text-primary" />
                     <CardTitle className="text-lg">Automation Rules</CardTitle>
                    </div>
                  </div>
                  <CardDescription>Define how thermostats behave around check-in/out times.</CardDescription>
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
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
        © {new Date().getFullYear()} ThermoAI. All rights reserved.
      </footer>
    </div>
  );
}
