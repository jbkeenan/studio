// src/app/page.tsx
"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ThermostatControl } from '@/components/thermostat/ThermostatControl';
import { SmartScheduleForm } from '@/components/smart-schedule/SmartScheduleForm';
import { SmartScheduleDisplay } from '@/components/smart-schedule/SmartScheduleDisplay';
import type { SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function ThermoAIDashboard() {
  const [scheduleData, setScheduleData] = useState<SmartScheduleSuggestionsOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleScheduleSuccess = (data: SmartScheduleSuggestionsOutput) => {
    setScheduleData(data);
    setServerError(null); // Clear previous errors
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Thermostat Control Column */}
          <div className="lg:col-span-1 space-y-8">
            <section aria-labelledby="thermostat-control-heading">
              <h2 id="thermostat-control-heading" className="text-2xl font-headline font-semibold mb-4 text-primary">
                Live Controls
              </h2>
              <div className="space-y-6">
                <ThermostatControl name="Living Room" thermostatType="central" initialTargetTemp={21} />
                <ThermostatControl name="Bedroom" thermostatType="split" initialTargetTemp={23} />
              </div>
            </section>
          </div>

          {/* Smart Schedule Suggestions Column */}
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
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        © {new Date().getFullYear()} ThermoAI. All rights reserved.
      </footer>
    </div>
  );
}
