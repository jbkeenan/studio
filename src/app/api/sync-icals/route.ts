
// src/app/api/sync-icals/route.ts
import { NextResponse } from 'next/server';
import { mockProperties, updatePropertySyncData } from '@/lib/mock-properties';
import { parseIcalFeed } from '@/ai/flows/parse-ical-flow';
import type { IcalEvent } from '@/ai/flows/parse-ical-flow';

export async function POST() {
  // In a real application, this endpoint should be secured (e.g., API key, or only callable by an authorized scheduler service).
  // It should also probably not use GET if it's performing an action, POST is more appropriate.
  // For simplicity in this demo, it's a POST and open.

  console.log('Attempting to sync all iCal feeds...');
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const property of mockProperties) {
    if (property.icalUrl) {
      try {
        console.log(`Syncing iCal for property: ${property.name} (ID: ${property.id}) from URL: ${property.icalUrl}`);
        const parseResult = await parseIcalFeed({ icalUrl: property.icalUrl });

        if (parseResult.error && !(parseResult.events && parseResult.events.length === 0)) {
          // Log actual errors, but if events are empty and there's a "benign" error (like no events found), treat as success.
          const benignErrorMessages = [
            "no vevent components", "no events found", "valid but contains no vevent", "valid but contains no events"
          ];
          const isBenignError = benignErrorMessages.some(msg => parseResult.error!.toLowerCase().includes(msg));

          if (!isBenignError) {
            console.error(`Error parsing iCal for property ${property.id}: ${parseResult.error}`);
            results.push({ propertyId: property.id, name: property.name, status: 'error', message: parseResult.error });
            errorCount++;
            // Update with empty events and error timestamp if parse failed hard
            updatePropertySyncData(property.id, [], new Date().toISOString());
            continue;
          }
          // If benign error, means empty calendar, proceed as success with empty events.
        }
        
        const eventsToStore: IcalEvent[] = parseResult.events || [];
        const timestamp = new Date().toISOString();
        
        updatePropertySyncData(property.id, eventsToStore, timestamp);
        
        results.push({ propertyId: property.id, name: property.name, status: 'success', eventsFetched: eventsToStore.length });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
        console.error(`Unhandled exception syncing iCal for property ${property.id}:`, error);
        results.push({ propertyId: property.id, name: property.name, status: 'error', message: errorMessage });
        updatePropertySyncData(property.id, [], new Date().toISOString()); // Store empty events on error
        errorCount++;
      }
    } else {
      results.push({ propertyId: property.id, name: property.name, status: 'skipped', message: 'No iCal URL configured' });
    }
  }

  console.log(`Sync complete. Success: ${successCount}, Errors: ${errorCount}, Skipped: ${mockProperties.length - successCount - errorCount}`);
  return NextResponse.json({
    message: 'iCal sync process completed.',
    summary: {
      totalProperties: mockProperties.length,
      successfulSyncs: successCount,
      failedSyncs: errorCount,
      skipped: mockProperties.length - successCount - errorCount,
    },
    details: results,
  });
}

// Optional: Add a GET handler if you want to trigger it via browser for easy testing (not recommended for prod schedulers)
export async function GET() {
    return POST();
}
