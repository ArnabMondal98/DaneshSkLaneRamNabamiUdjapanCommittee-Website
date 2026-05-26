'use server';
/**
 * @fileOverview An AI agent for translating content between English and Bengali.
 *
 * - adminContentTranslator - A function that handles the translation process.
 * - AdminContentTranslatorInput - The input type for the adminContentTranslator function.
 * - AdminContentTranslatorOutput - The return type for the adminContentTranslator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminContentTranslatorInputSchema = z.object({
  textToTranslate: z.string().describe('The text content to be translated.'),
  targetLanguage:
    z.enum(['en', 'bn']).describe(
      'The target language for translation. Use "en" for English or "bn" for Bengali.'
    ),
});
export type AdminContentTranslatorInput = z.infer<
  typeof AdminContentTranslatorInputSchema
>;

const AdminContentTranslatorOutputSchema = z.object({
  translatedText: z.string().describe('The translated text content.'),
});
export type AdminContentTranslatorOutput = z.infer<
  typeof AdminContentTranslatorOutputSchema
>;

export async function adminContentTranslator(
  input: AdminContentTranslatorInput
): Promise<AdminContentTranslatorOutput> {
  return adminContentTranslatorFlow(input);
}

const adminContentTranslatorPrompt = ai.definePrompt({
  name: 'adminContentTranslatorPrompt',
  input: {schema: AdminContentTranslatorInputSchema},
  output: {schema: AdminContentTranslatorOutputSchema},
  prompt: `You are an expert translator. Your task is to translate the provided text content to the specified target language.

Target Language: {{{targetLanguage}}}
Text to translate: {{{textToTranslate}}}

Ensure the translation is natural and accurate, maintaining the original meaning and context.`, 
});

const adminContentTranslatorFlow = ai.defineFlow(
  {
    name: 'adminContentTranslatorFlow',
    inputSchema: AdminContentTranslatorInputSchema,
    outputSchema: AdminContentTranslatorOutputSchema,
  },
  async input => {
    const {output} = await adminContentTranslatorPrompt(input);
    return output!;
  }
);
