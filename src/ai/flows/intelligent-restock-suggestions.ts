'use server';

/**
 * @fileOverview An AI agent that provides intelligent restock suggestions based on consumption patterns and stock levels.
 *
 * - generateRestockSuggestions - A function that generates restock suggestions.
 * - RestockSuggestionsInput - The input type for the generateRestockSuggestions function.
 * - RestockSuggestionsOutput - The return type for the generateRestockSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RestockSuggestionsInputSchema = z.object({
  inventoryData: z
    .string()
    .describe(
      'A string containing the current inventory levels for each EPP item.  Include code, description, size, quantity, and cost for each item.  Example: [{\"code\": \"EPP001\", \"description\": \"Helmet\", \"size\": \"M\", \"quantity\": 10, \"cost\": 25}, {\"code\": \"EPP002\", \"description\": \"Gloves\", \"size\": \"L\", \"quantity\": 5, \"cost\": 15}]'
    ),
  consumptionData: z
    .string()
    .describe(
      'A string containing the recent consumption data for each EPP item, including code, quantity consumed, project, and date.  Example: [{\"code\": \"EPP001\", \"quantityConsumed\": 2, \"project\": \"Project A\", \"date\": \"2024-07-24\"}, {\"code\": \"EPP002\", \"quantityConsumed\": 3, \"project\": \"Project B\", \"date\": \"2024-07-24\"}]'
    ),
  leadTimeDays: z
    .number()
    .describe(
      'The lead time in days it takes to receive a restock order from suppliers.'
    ),
  desiredStockLevelDays: z
    .number()
    .describe(
      'The number of days of stock you want to keep on hand to avoid shortages.'
    ),
});
export type RestockSuggestionsInput = z.infer<typeof RestockSuggestionsInputSchema>;

const RestockSuggestionsOutputSchema = z.object({
  restockSuggestions: z
    .string()
    .describe(
      'A string containing the restock suggestions for each EPP item, including the item code, description, size, and the suggested quantity to order.  Example: [{\"code\": \"EPP001\", \"description\": \"Helmet\", \"size\": \"M\", \"suggestedQuantity\": 15}, {\"code\": \"EPP002\", \"description\": \"Gloves\", \"size\": \"L\", \"suggestedQuantity\": 20}]'
    ),
});
export type RestockSuggestionsOutput = z.infer<typeof RestockSuggestionsOutputSchema>;

export async function generateRestockSuggestions(
  input: RestockSuggestionsInput
): Promise<RestockSuggestionsOutput> {
  return restockSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'restockSuggestionsPrompt',
  input: {schema: RestockSuggestionsInputSchema},
  output: {schema: RestockSuggestionsOutputSchema},
  prompt: `You are an AI assistant helping a warehouse manager determine restock quantities for their EPP (Personal Protective Equipment) inventory.

  Analyze the provided inventory data, consumption data, lead time, and desired stock levels to generate intelligent restock suggestions.

  Inventory Data: {{{inventoryData}}}
  Consumption Data: {{{consumptionData}}}
  Lead Time (Days): {{{leadTimeDays}}}
  Desired Stock Level (Days): {{{desiredStockLevelDays}}}

  Consider the consumption patterns, lead time, and desired stock levels to calculate the suggested restock quantities for each EPP item.

  Return the restock suggestions in JSON format.
  `,
});

const restockSuggestionsFlow = ai.defineFlow(
  {
    name: 'restockSuggestionsFlow',
    inputSchema: RestockSuggestionsInputSchema,
    outputSchema: RestockSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
