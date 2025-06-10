
// src/app/page.tsx
"use client";

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { BookText, ThermometerSun, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <ThermometerSun className="h-24 w-24 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold font-headline mb-4 text-primary">Welcome to ThermoAI</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Your intelligent assistant for smart thermostat automation and energy savings.
            Manage your properties efficiently and provide optimal comfort.
          </p>
          <Link href="/dashboard" passHref>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-shadow">
              <Zap className="mr-2 h-5 w-5" /> Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Developer Notes Section */}
        <div className="mt-16 w-full max-w-3xl p-6 border rounded-xl bg-card text-card-foreground shadow-lg">
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
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
        © {new Date().getFullYear()} ThermoAI. All rights reserved.
      </footer>
    </div>
  );
}
