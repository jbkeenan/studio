'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing smart thermostat schedule suggestions.
 *
 * - smartScheduleSuggestions - A function that takes property characteristics, historical energy usage, and weather patterns to suggest optimal thermostat schedules.
 * - SmartScheduleSuggestionsInput - The input type for the smartScheduleSuggestions function.
 * - SmartScheduleSuggestionsOutput - The return type for the smartScheduleSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartScheduleSuggestionsInputSchema = z.object({
  propertyType: z
    .string()
    .describe('The type of property (e.g., house, apartment, condo).'),
  location: z.string().describe('The location of the property.'),
  averageOccupancy: z
    .number()
    .describe('The average occupancy rate of the property (number of guests).'),
  historicalEnergyUsage: z
    .string()
    .describe('Historical energy usage data in kWh.'),
  desiredTemperature: z
    .string()
    .describe("The desired temperature in °F when the property is occupied."),
  energySavingPreference: z
    .string()
    .describe("The desired percentage of energy saving, such as '10%', '20%', or '30%'."),
});
export type SmartScheduleSuggestionsInput = z.infer<
  typeof SmartScheduleSuggestionsInputSchema
>;

const SmartScheduleSuggestionsOutputSchema = z.object({
  suggestedSchedule: z
    .string()
    .describe(
      'A suggested thermostat schedule in JSON format, that minimizes energy consumption while maintaining guest comfort. Include temperature settings for different times of the day.'
    ),
  projectedEnergySavings: z
    .string()
    .describe(
      'The projected energy savings (in percentage) with the suggested schedule.'
    ),
  comfortScore: z
    .string()
    .describe(
      'A score from 1-10 indicating how comfortable the schedule will be for guests.'
    ),
});
export type SmartScheduleSuggestionsOutput = z.infer<
  typeof SmartScheduleSuggestionsOutputSchema
>;

export async function smartScheduleSuggestions(
  input: SmartScheduleSuggestionsInput
): Promise<SmartScheduleSuggestionsOutput> {
  return smartScheduleSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartScheduleSuggestionsPrompt',
  input: {schema: SmartScheduleSuggestionsInputSchema},
  output: {schema: SmartScheduleSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide optimal thermostat schedules for property managers, considering energy efficiency and guest comfort.

  Analyze the following property characteristics, historical energy usage, and local weather patterns to suggest a thermostat schedule that minimizes energy consumption while maintaining guest comfort.

  Property Type: {{{propertyType}}}
  Location: {{{location}}}
  Average Occupancy: {{{averageOccupancy}}}
  Historical Energy Usage: {{{historicalEnergyUsage}}}
  Desired Temperature: {{{desiredTemperature}}}
  Energy Saving Preference: {{{energySavingPreference}}}

  Provide the suggested schedule in JSON format, the projected energy savings in percentage, and a comfort score from 1-10.
  Ensure the thermostat schedules contain temperature settings for different times of the day, and that it follows the following format:
  {
    "0:00": "68°F",
    "6:00": "72°F",
    "8:00": "68°F",
    "18:00": "72°F",
    "22:00": "68°F"
  }
  `,
});

const smartScheduleSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartScheduleSuggestionsFlow',
    inputSchema: SmartScheduleSuggestionsInputSchema,
    outputSchema: SmartScheduleSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
