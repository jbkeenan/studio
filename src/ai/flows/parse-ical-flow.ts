
'use server';
/**
 * @fileOverview A Genkit flow for parsing iCalendar (iCal) feeds.
 *
 * - parseIcalFeed - Fetches and parses an iCal feed URL.
 * - ParseIcalInput - Input type for the iCal URL.
 * - ParseIcalOutput - Output type for the parsed calendar events.
 * - IcalEvent - Type for a single parsed iCal event.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IcalEventSchema = z.object({
  uid: z.string().describe("Unique identifier of the event."),
  summary: z.string().describe("Summary or title of the event (e.g., Guest Name or 'Reserved')."),
  startDate: z.string().datetime({ message: "Invalid datetime string for startDate. Expected ISO 8601 format." }).describe("Start date and time of the event in ISO 8601 format."),
  endDate: z.string().datetime({ message: "Invalid datetime string for endDate. Expected ISO 8601 format." }).describe("End date and time of the event in ISO 8601 format."),
  description: z.string().optional().describe("Full description of the event."),
  location: z.string().optional().describe("Location of the event."),
});
export type IcalEvent = z.infer<typeof IcalEventSchema>;

// Not exported due to 'use server' restrictions on exporting non-async functions/objects
const ParseIcalInputSchemaInternal = z.object({
  icalUrl: z.string().url({ message: "Invalid URL format for iCal feed." }).describe("The URL of the iCalendar (.ics) feed."),
});
export type ParseIcalInput = z.infer<typeof ParseIcalInputSchemaInternal>;

const ParseIcalOutputSchemaInternal = z.object({
  events: z.array(IcalEventSchema).describe("A list of parsed calendar events."),
  error: z.string().optional().describe("Error message if parsing failed."),
});
export type ParseIcalOutput = z.infer<typeof ParseIcalOutputSchemaInternal>;

export async function parseIcalFeed(input: ParseIcalInput): Promise<ParseIcalOutput> {
  return parseIcalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseIcalPrompt',
  input: { schema: z.object({ icalContent: z.string() }) },
  output: { schema: ParseIcalOutputSchemaInternal },
  prompt: `You are an expert iCalendar data parser. Given the following iCalendar (.ics) data, extract all VEVENT components.
For each VEVENT, provide:
- uid: The unique identifier (UID property).
- summary: The event summary (SUMMARY property).
- startDate: The event start date and time (DTSTART property). Convert this to a full ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). If a TZID is present (e.g., DTSTART;TZID=America/New_York:20240820T140000), ensure the time is correctly converted to UTC. If the date is a date-only value (e.g., DTSTART;VALUE=DATE:20240820), assume it starts at midnight UTC (YYYY-MM-DDT00:00:00.000Z).
- endDate: The event end date and time (DTEND property). Convert this to a full ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). If a TZID is present, ensure the time is correctly converted to UTC. If the date is a date-only value (e.g., DTEND;VALUE=DATE:20240821), assume it ends at the beginning of that day UTC (YYYY-MM-DDT00:00:00.000Z), effectively meaning the event lasts until the end of the previous day.
- description: The event description (DESCRIPTION property), if present.
- location: The event location (LOCATION property), if present.

Return only events that have a DTSTART.
Ensure all dates are in strict ISO 8601 UTC format (ending with 'Z').

If there are parsing errors, the iCalendar data is invalid, or no valid events are found, set the 'error' field in the output with a descriptive message and return an empty events list. Otherwise, return the list of events and omit the 'error' field.

iCalendar Data:
\`\`\`
{{{icalContent}}}
\`\`\`
`,
});

const parseIcalFlow = ai.defineFlow(
  {
    name: 'parseIcalFlow',
    inputSchema: ParseIcalInputSchemaInternal,
    outputSchema: ParseIcalOutputSchemaInternal,
  },
  async (input) => {
    try {
      const response = await fetch(input.icalUrl, { headers: { 'User-Agent': 'ThermoAI-iCal-Parser/1.0' }});
      if (!response.ok) {
        return { events: [], error: `Failed to fetch iCal feed: ${response.status} ${response.statusText}` };
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.toLowerCase().includes("text/calendar")) {
        const contentPreview = await response.text(); // Read text to show preview
        return { 
          events: [], 
          error: `Unexpected content type: ${contentType || 'N/A'}. Expected 'text/calendar'. Response preview (first 200 chars): '${contentPreview.substring(0,200).replace(/\n/g, "\\n")}'`
        };
      }
      
      const icalContent = await response.text();

      if (!icalContent.trim().startsWith("BEGIN:VCALENDAR")) {
         return { 
           events: [], 
           error: `Invalid iCal feed: Does not start with BEGIN:VCALENDAR. Content preview (first 200 chars): '${icalContent.substring(0,200).replace(/\n/g, "\\n")}'` 
         };
      }
      // Removed the explicit check for VEVENT here. Let the AI try to parse it.
      // If the AI returns no events and no error, it implies an empty but valid calendar.

      const {output} = await prompt({ icalContent });
      if (!output) {
        return { events: [], error: "AI failed to parse the iCal content or returned no output." };
      }
      
      const validatedEvents = [];
      if (output.events && Array.isArray(output.events)) {
        for (const event of output.events) {
          const parsedEvent = IcalEventSchema.safeParse(event);
          if (parsedEvent.success) {
            validatedEvents.push(parsedEvent.data);
          } else {
            // console.warn("Invalid event structure from LLM:", parsedEvent.error.flatten()); // This log is for server-side/dev console
          }
        }
      }
      
      if(validatedEvents.length === 0 && !output.error && output.events && output.events.length > 0) {
         // This case covers when the AI returns events, but they fail Zod validation.
         return { events: [], error: "AI returned event data in an unexpected format. Please check iCal feed structure and content." };
      }

      // If validatedEvents is empty and output.error is also empty, it means the AI correctly processed an empty (but valid) calendar.
      // The UI should then show "No bookings found".
      return { events: validatedEvents, error: output.error };

    } catch (error) {
      // console.error("Error in parseIcalFlow:", error); // This log is for server-side/dev console
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during iCal parsing.";
      return { events: [], error: errorMessage };
    }
  }
);

