'use server';
/**
 * @fileOverview An AI assistant for admins to enhance and refine event descriptions and news articles.
 *
 * - enhanceContent - A function that handles the content enhancement process.
 * - AdminContentEnhancerInput - The input type for the enhanceContent function.
 * - AdminContentEnhancerOutput - The return type for the enhanceContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminContentEnhancerInputSchema = z.object({
  content: z.string().describe('The original text content to be enhanced (e.g., event description, news article).'),
});
export type AdminContentEnhancerInput = z.infer<typeof AdminContentEnhancerInputSchema>;

const AdminContentEnhancerOutputSchema = z.object({
  enhancedContent: z.string().describe('The enhanced and refined text content.'),
});
export type AdminContentEnhancerOutput = z.infer<typeof AdminContentEnhancerOutputSchema>;

export async function enhanceContent(input: AdminContentEnhancerInput): Promise<AdminContentEnhancerOutput> {
  return adminContentEnhancerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminContentEnhancerPrompt',
  input: {schema: AdminContentEnhancerInputSchema},
  output: {schema: AdminContentEnhancerOutputSchema},
  prompt: `You are a professional content editor fluent in both English and Bengali. Your task is to enhance the clarity, tone, and grammar of the provided text. Ensure the content is engaging and professional. Maintain the original language (English or Bengali) of the input, and ensure the output is only the enhanced text, without any conversational filler. If the text is in Bengali, respond in Bengali; if in English, respond in English.

Original Text:
{{{content}}}`,
});

const adminContentEnhancerFlow = ai.defineFlow(
  {
    name: 'adminContentEnhancerFlow',
    inputSchema: AdminContentEnhancerInputSchema,
    outputSchema: AdminContentEnhancerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
