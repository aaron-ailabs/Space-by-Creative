import { z } from 'zod';

/**
 * Validation schema for the /api/apply-ai-code endpoint
 */
export const ApplyAICodeSchema = z.object({
  response: z.string().min(1, "AI response content is required"),
  isEdit: z.boolean().optional().default(false),
  packages: z.array(z.string()).optional().default([]),
});

/**
 * Validation schema for the /api/create-ai-sandbox endpoint
 */
export const CreateSandboxSchema = z.object({
  template: z.string().optional().default('nextjs'),
  projectName: z.string().optional().default('my-space-app'),
});

/**
 * Validation schema for the /api/install-packages endpoint
 */
export const InstallPackagesSchema = z.object({
  packages: z.array(z.string()).min(1, "At least one package must be specified"),
});

/**
 * Validation schema for the /api/search endpoint
 */
export const SearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

/**
 * Validation schema for the /api/scrape-website endpoint
 */
export const ScrapeWebsiteSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

/**
 * Validation schema for the /api/conversation-state endpoint
 */
export const ConversationStateSchema = z.object({
  action: z.enum(['reset', 'clear-old', 'update']),
  data: z.object({
    currentTopic: z.string().optional(),
    userPreferences: z.record(z.any()).optional(),
  }).optional(),
});

export type ApplyAICodeInput = z.infer<typeof ApplyAICodeSchema>;
export type CreateSandboxInput = z.infer<typeof CreateSandboxSchema>;
export type InstallPackagesInput = z.infer<typeof InstallPackagesSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type ScrapeWebsiteInput = z.infer<typeof ScrapeWebsiteSchema>;
export type ConversationStateInput = z.infer<typeof ConversationStateSchema>;
