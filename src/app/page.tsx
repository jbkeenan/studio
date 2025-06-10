
// src/app/page.tsx
"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ThermostatControl, type ThermostatType } from '@/components/thermostat/ThermostatControl';
import { SmartScheduleForm } from '@/components/smart-schedule/SmartScheduleForm';
import { SmartScheduleDisplay } from '@/components/smart-schedule/SmartScheduleDisplay';
import type { SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BookText } from "lucide-react"; 

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

        {/* Developer Notes Section */}
        <div className="mt-12 p-6 border rounded-xl bg-card text-card-foreground shadow-lg">
          <div className="flex items-center mb-3">
            <BookText className="h-6 w-6 mr-3 text-primary" />
            <h3 className="font-headline text-xl font-semibold">Your Developer Notes Area</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This space is a reminder to summarize and add to your own developer notes for session continuity. When you start a new session with the AI, you can share these notes. Consider logging:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground my-2 ml-4 space-y-1">
            <li>Key features discussed and implemented.</li>
            <li>Important decisions, changes made, and their rationale.</li>
            <li>Overall project goals and specific objectives for the current session.</li>
            <li>Any unresolved questions or ideas for future development.</li>
            <li>Prompts given to the AI and summaries of its responses.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By providing a summary from your notes at the beginning of a new session, you help the AI understand the project's current state and your immediate goals.
            Remember, this section is a static guide for your personal record-keeping; the AI does not directly access or store information here.
          </p>
        </div>

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        © {new Date().getFullYear()} ThermoAI. All rights reserved.
      </footer>
    </div>
  );
}
