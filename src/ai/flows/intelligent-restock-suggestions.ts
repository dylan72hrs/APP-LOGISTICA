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
      'A JSON string containing the current inventory levels for each EPP item. It includes code, description, size, quantity, and cost for each item. Example: `[{"code": "EPP001", "description": "Helmet", "size": "M", "quantity": 10, "cost": 25}]`'
    ),
  consumptionData: z
    .string()
    .describe(
      'A JSON string containing the recent consumption data for each EPP item, including code, quantity consumed, project, and date. This data reflects historical demand. Example: `[{"code": "EPP001", "quantityConsumed": 2, "project": "Project A", "date": "2024-07-24"}]`'
    ),
  leadTimeDays: z
    .number()
    .describe(
      'The lead time in days it takes to receive a restock order from suppliers.'
    ),
  desiredStockLevelDays: z
    .number()
    .describe(
      'The number of days of stock you want to keep on hand as a safety buffer to avoid shortages.'
    ),
});
export type RestockSuggestionsInput = z.infer<typeof RestockSuggestionsInputSchema>;

const RestockSuggestionsOutputSchema = z.object({
  sugerencias_de_reposicion: z
    .string()
    .describe(
      'A JSON string containing the restock suggestions for each EPP item that needs reordering. It should include the item code, description, size, and the suggested quantity to order. Example: `[{"code": "EPP001", "description": "Helmet", "size": "M", "suggestedQuantity": 15}]`'
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
  prompt: `You are an expert logistics and inventory management AI assistant. Your task is to provide intelligent restock recommendations for a warehouse manager's EPP (Personal Protective Equipment) inventory.

You must analyze the provided data to calculate the optimal quantity to reorder for each item that is low on stock.

**Your analysis must follow these steps:**
1.  **Calculate Average Daily Consumption:** For each item, analyze the \`consumptionData\` to determine the average number of units consumed per day.
2.  **Calculate Standard Deviation of Demand:** For each item, calculate the standard deviation of its daily consumption to measure demand variability.
3.  **Calculate Safety Stock:** Use the lead time and demand variability to calculate the necessary safety stock. The formula is: Safety Stock = Z-score * Standard Deviation of Lead Time Demand. Assume a Z-score of 1.65 (for a 95% service level). The standard deviation of lead time demand is \`Std Dev of Daily Demand * sqrt(Lead Time in Days)\`.
4.  **Calculate Reorder Point:** Determine the reorder point for each item. The formula is: Reorder Point = (Average Daily Consumption * Lead Time in Days) + Safety Stock.
5.  **Identify Items to Restock:** Compare the current \`quantity\` from \`inventoryData\` with the calculated Reorder Point. If the current quantity is at or below the reorder point, the item needs to be restocked.
6.  **Calculate Economic Order Quantity (EOQ):** To determine the \`suggestedQuantity\` to order, you should aim to reach a desired maximum stock level. The formula is: Order Quantity = (Average Daily Consumption * Desired Stock Level in Days) + Safety Stock - Current Quantity. This dynamically adjusts the order to replenish stock up to a healthy level. If the calculation results in a quantity less than or equal to zero, do not include the item in the suggestions.

**Input Data:**
*   **Current Inventory:** {{{inventoryData}}}
*   **Historical Consumption:** {{{consumptionData}}}
*   **Supplier Lead Time (Days):** {{{leadTimeDays}}}
*   **Desired Stock Level (Days of Coverage):** {{{desiredStockLevelDays}}}

**Output Format:**
Return **only** a JSON array string in the \`sugerencias_de_reposicion\` field, containing objects for **only the items that need to be reordered**. Each object must have \`code\`, \`description\`, \`size\`, and \`suggestedQuantity\`. Do not include items that do not need restocking.
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
