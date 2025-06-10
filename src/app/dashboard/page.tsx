
// src/app/dashboard/page.tsx
"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ThermostatControl } from '@/components/thermostat/ThermostatControl';
import { SmartScheduleForm } from '@/components/smart-schedule/SmartScheduleForm';
import { SmartScheduleDisplay } from '@/components/smart-schedule/SmartScheduleDisplay';
import type { SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CalendarDays } from "lucide-react";

export default function DashboardPage() {
  const [scheduleData, setScheduleData] = useState<SmartScheduleSuggestionsOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleScheduleSuccess = (data: SmartScheduleSuggestionsOutput) => {
    setScheduleData(data);
    setServerError(null); // Clear previous errors
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Thermostats & Calendar */}
          <div className="lg:col-span-1 space-y-8">
            <section aria-labelledby="thermostat-control-heading">
              <h2 id="thermostat-control-heading" className="text-2xl font-headline font-semibold mb-4 text-primary">
                Live Controls
              </h2>
              <div className="space-y-6">
                <ThermostatControl
                  initialName="Living Room"
                  initialThermostatType="central"
                  initialTargetTempC={21}
                  initialBrand="Nest"
                  initialUnit="C"
                />
                <ThermostatControl
                  initialName="Bedroom"
                  initialThermostatType="split"
                  initialTargetTempC={23}
                  initialBrand="Daikin"
                  initialUnit="F"
                />
              </div>
            </section>

            <section aria-labelledby="calendar-heading">
                <h2 id="calendar-heading" className="text-2xl font-headline font-semibold mb-4 text-primary flex items-center">
                    <CalendarDays className="mr-2 h-6 w-6" /> Calendar
                </h2>
                <Card className="shadow-lg rounded-xl">
                    <CardContent className="p-0 flex justify-center items-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                    />
                    </CardContent>
                </Card>
            </section>
          </div>

          {/* Right Column: Smart Schedule Suggestions */}
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
              />
              {isLoadingSuggestions && (
                <div className="mt-8 text-center py-4">
                  <p className="text-muted-foreground animate-pulse">AI is thinking... Please wait.</p>
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
