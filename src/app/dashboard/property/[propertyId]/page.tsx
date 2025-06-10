
// src/app/dashboard/property/[propertyId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ThermostatControl } from '@/components/thermostat/ThermostatControl';
import { SmartScheduleForm } from '@/components/smart-schedule/SmartScheduleForm';
import { SmartScheduleDisplay } from '@/components/smart-schedule/SmartScheduleDisplay';
import type { SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CalendarDays, ChevronLeft, Home as HomeIcon, Loader2 } from "lucide-react"; // Renamed Home to HomeIcon
import { getPropertyById, type Property } from '@/lib/mock-properties';
import { Button } from '@/components/ui/button';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null | undefined>(undefined); // undefined: loading, null: not found
  const [scheduleData, setScheduleData] = useState<SmartScheduleSuggestionsOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (propertyId) {
      const foundProperty = getPropertyById(propertyId);
      setProperty(foundProperty || null); // Set to null if not found
    }
  }, [propertyId]);

  const handleScheduleSuccess = (data: SmartScheduleSuggestionsOutput) => {
    setScheduleData(data);
    setServerError(null);
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
                <CalendarDays className="mr-2 h-6 w-6" /> Calendar
              </h2>
              <Card className="shadow-lg rounded-xl">
                <CardContent className="p-0 flex justify-center items-center">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={setCalendarDate}
                    className="rounded-md"
                  />
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section aria-labelledby="smart-schedule-heading">
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
                // TODO: Pass property context (e.g., property.type, property.location)
                // to the form/AI action if the AI model needs it.
                // For now, the form is generic.
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
