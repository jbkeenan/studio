import * as functions from "firebase-functions/v2/https"; // Using v2 for onRequest
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {GoogleGenerativeAI, HarmCategory, HarmBlockThreshold} from "@google/generative-ai";

admin.initializeApp();
const db = admin.firestore();

// IMPORTANT: Set GEMINI_API_KEY in your Cloud Function's environment variables in the Firebase Console.
const API_KEY = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | undefined;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  logger.error("GEMINI_API_KEY environment variable not set. Function will not be able to parse iCal feeds with AI.");
}

interface IcalEvent {
  uid: string;
  summary: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  description?: string;
  location?: string;
}

interface ParseIcalAIOutput {
  events: IcalEvent[];
  error?: string;
}

const parseIcalPromptTemplate = (icalContent: string): string => `
You are an expert iCalendar data parser. Given the following iCalendar (.ics) data, extract all VEVENT components.
For each VEVENT, provide:
- uid: The unique identifier (UID property).
- summary: The event summary (SUMMARY property).
- startDate: The event start date and time (DTSTART property). Convert this to a full ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). If a TZID is present (e.g., DTSTART;TZID=America/New_York:20240820T140000), ensure the time is correctly converted to UTC. If the date is a date-only value (e.g., DTSTART;VALUE=DATE:20240820), assume it starts at midnight UTC (YYYY-MM-DDT00:00:00.000Z).
- endDate: The event end date and time (DTEND property). Convert this to a full ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). If a TZID is present, ensure the time is correctly converted to UTC. If the date is a date-only value (e.g., DTEND;VALUE=DATE:20240821), assume it ends at the beginning of that day UTC (YYYY-MM-DDT00:00:00.000Z), effectively meaning the event lasts until the end of the previous day.
- description: The event description (DESCRIPTION property), if present.
- location: The event location (LOCATION property), if present.

Return only events that have a DTSTART.
Ensure all dates are in strict ISO 8601 UTC format (ending with 'Z').

Output the result as a JSON object matching this structure: { "events": [{ "uid": "...", "summary": "...", "startDate": "...", "endDate": "...", "description": "optional", "location": "optional" }], "error": "optional error message" }.
If there are parsing errors or the iCalendar data is structurally invalid (e.g., malformed VCALENDAR structure), set the 'error' field in the output with a descriptive message and return an empty events list.
If the iCalendar data is valid but simply contains no VEVENT components (or no VEVENTs with a DTSTART property), then return an empty 'events' list and do not set the 'error' field.
Otherwise, return the list of events and omit the 'error' field.

iCalendar Data:
\`\`\`
${icalContent}
\`\`\`
`;

export const syncallicalfeeds = functions.onRequest(
  {
    timeoutSeconds: 540, // Allow more time for multiple fetches and AI calls
    memory: "1GiB", // Allocate more memory if needed
  },
  async (request, response) => {
  if (!genAI) {
    logger.error("GoogleGenerativeAI SDK not initialized due to missing API key. Aborting sync.");
    response.status(500).send("Server configuration error: AI SDK not initialized.");
    return;
  }

  logger.info("Starting iCal feed sync for all properties (HTTP).", {structuredData: true});
  let successCount = 0;
  let errorCount = 0;
  const results = [];

  try {
    const propertiesSnapshot = await db.collection("properties").where("icalUrl", "!=", null).get();

    if (propertiesSnapshot.empty) {
      logger.info("No properties found with an icalUrl.", {structuredData: true});
      response.status(200).json({message: "No properties configured for iCal sync."});
      return;
    }

    for (const doc of propertiesSnapshot.docs) {
      const propertyId = doc.id;
      const propertyData = doc.data();
      // Ensure icalUrl is a string and not empty
      const icalUrl = typeof propertyData.icalUrl === 'string' && propertyData.icalUrl.trim() !== '' ? propertyData.icalUrl.trim() : null;


      if (!icalUrl) {
        logger.warn(`Property ${propertyId} has an invalid or empty icalUrl, skipping.`, {propertyId, structuredData: true});
        continue;
      }

      logger.info(`Processing property: ${propertyId} from URL: ${icalUrl}`, {propertyId, icalUrl, structuredData: true});
      let currentPropertyStatus: any = { propertyId, status: "pending" };

      try {
        const icalResponse = await fetch(icalUrl, {headers: {"User-Agent": "ThermoAI-CloudFunction-iCal-Parser/1.1"}});
        if (!icalResponse.ok) {
          throw new Error(`Failed to fetch iCal feed: ${icalResponse.status} ${icalResponse.statusText}`);
        }
        const icalContent = await icalResponse.text();

        if (!icalContent.trim().toLowerCase().includes("begin:vcalendar")) {
            logger.warn(`iCal feed for ${propertyId} does not appear to be valid iCalendar data.`, {propertyId, structuredData: true});
            await db.collection("properties").doc(propertyId).update({
              syncedBookingEvents: [],
              lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
              lastSyncError: "Fetched content is not valid iCalendar data (missing BEGIN:VCALENDAR).",
            });
            currentPropertyStatus = {propertyId, status: "error_invalid_feed_content", eventsFetched: 0, message: "Fetched content is not valid iCalendar data."};
            errorCount++;
            results.push(currentPropertyStatus);
            continue;
        }
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: { responseMimeType: "application/json" },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
        });

        const prompt = parseIcalPromptTemplate(icalContent);
        const aiResult = await model.generateContent(prompt);
        const aiResponseText = aiResult.response.text();
        
        let parsedOutput: ParseIcalAIOutput;
        try {
            parsedOutput = JSON.parse(aiResponseText);
        } catch (jsonError: any) {
            logger.error(`AI response JSON parsing error for ${propertyId}: ${jsonError.message}. Raw AI response: ${aiResponseText}`, {propertyId, structuredData: true});
            throw new Error(`AI response was not valid JSON: ${jsonError.message}`);
        }


        if (parsedOutput.error) {
          logger.warn(`AI parsing logical error for ${propertyId}: ${parsedOutput.error}`, {propertyId, structuredData: true});
          await db.collection("properties").doc(propertyId).update({
            lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            lastSyncError: `AI parsing error: ${parsedOutput.error}`,
            syncedBookingEvents: parsedOutput.events && Array.isArray(parsedOutput.events) ? parsedOutput.events : [],
          });
          currentPropertyStatus = {propertyId, status: "success_with_ai_issues", message: parsedOutput.error, eventsFetched: (parsedOutput.events || []).length};
          // This could be a success or error depending on how strict you want to be.
          // If AI says "no events found", it's not an error count item.
          if (!parsedOutput.error.toLowerCase().includes("no vevent") && !parsedOutput.error.toLowerCase().includes("no events")) {
            errorCount++;
          } else {
            successCount++; // Count as success if AI just reported no events
          }
        } else {
          await db.collection("properties").doc(propertyId).update({
            syncedBookingEvents: parsedOutput.events,
            lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            lastSyncError: null,
          });
          logger.info(`Successfully synced ${parsedOutput.events.length} events for property ${propertyId}.`, {propertyId, eventsCount: parsedOutput.events.length, structuredData: true});
          currentPropertyStatus = {propertyId, status: "success", eventsFetched: parsedOutput.events.length};
          successCount++;
        }
      } catch (e: any) {
        logger.error(`Error processing property ${propertyId}:`, e.message, {propertyId, error: e, structuredData: true});
        await db.collection("properties").doc(propertyId).update({
          lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          lastSyncError: e.message || "Unknown error during individual property sync.",
        }).catch(updateErr => logger.error(`Failed to update error status for ${propertyId}`, updateErr));
        currentPropertyStatus = {propertyId, status: "error_processing", message: e.message};
        errorCount++;
      }
      results.push(currentPropertyStatus);
    }

    response.status(200).json({
      message: "iCal sync process completed.",
      summary: {successCount, errorCount, totalPropertiesQueried: propertiesSnapshot.size},
      details: results,
    });
  } catch (error: any) {
    logger.error("Unhandled error in syncAllIcalFeeds HTTP function:", error, {structuredData: true});
    response.status(500).send(`Internal Server Error: ${error.message}`);
  }
});
