
// src/app/actions.ts
"use server";

import { smartScheduleSuggestions, type SmartScheduleSuggestionsInput, type SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import { parseIcalFeed, ParseIcalInputSchema, type ParseIcalInput, type ParseIcalOutput } from '@/ai/flows/parse-ical-flow';
import { z } from 'zod';

// Re-define or import the input schema if you need to use it directly in server components for validation before calling the action
const SmartScheduleSuggestionsInputSchema = z.object({
  propertyType: z.string().min(1, "Property type is required."),
  location: z.string().min(1, "Location is required."),
  averageOccupancy: z.coerce.number().min(0, "Average occupancy must be a positive number."),
  historicalEnergyUsage: z.string().min(1, "Historical energy usage is required."), // Could be more specific, e.g., "1500 kWh"
  desiredTemperature: z.string().min(1, "Desired temperature is required."), // e.g., "70°F"
  energySavingPreference: z.string().min(1, "Energy saving preference is required."), // e.g., "15%"
});

export async function getSmartScheduleSuggestionsAction(
  input: SmartScheduleSuggestionsInput
): Promise<{ success: boolean; data?: SmartScheduleSuggestionsOutput; error?: any }> {
  try {
    // Validate input on server-side as well (optional if validated thoroughly on client, but good practice)
    const validatedInput = SmartScheduleSuggestionsInputSchema.safeParse(input);
    if (!validatedInput.success) {
      return { success: false, error: validatedInput.error.flatten().fieldErrors  };
    }
    
    const result = await smartScheduleSuggestions(validatedInput.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting smart schedule suggestions:", error);
    return { success: false, error: "Failed to get smart schedule suggestions. Please try again." };
  }
}

export async function parseIcalFeedAction(
  input: ParseIcalInput
): Promise<{ success: boolean; data?: ParseIcalOutput; error?: string }> {
  try {
    const validatedInput = ParseIcalInputSchema.safeParse(input);
    if (!validatedInput.success) {
      // Collect all Zod error messages
      const errorMessages = validatedInput.error.errors.map(e => `${e.path.join('.')} : ${e.message}`).join('; ');
      return { success: false, error: `Invalid input: ${errorMessages}` };
    }
    const result = await parseIcalFeed(validatedInput.data);
    if (result.error && (!result.events || result.events.length === 0)) {
        return { success: false, error: result.error, data: {events: result.events || []} };
    }
    // If there are events, even with a minor error, consider it a partial success for display
    return { success: true, data: result };
  } catch (error) {
    console.error("Error parsing iCal feed in action:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to parse iCal feed.";
    return { success: false, error: errorMessage };
  }
}
