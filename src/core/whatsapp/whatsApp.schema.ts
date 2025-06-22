import { z } from 'zod';

// ============================================================================
// INTERACTIVE MESSAGE SCHEMAS (CTA URL)
// ============================================================================

// Schema for text header
const CtaUrlTextHeaderSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

// Schema for image header
const CtaUrlImageHeaderSchema = z.object({
  type: z.literal('image'),
  image: z.object({
    link: z.string().url(),
  }),
});

// Schema for document header
const CtaUrlDocumentHeaderSchema = z.object({
  type: z.literal('document'),
  document: z.object({
    link: z.string().url(),
  }),
});

// Schema for video header
const CtaUrlVideoHeaderSchema = z.object({
  type: z.literal('video'),
  video: z.object({
    link: z.string().url(),
  }),
});

// Discriminated union for all header types
const CtaUrlHeaderSchema = z.discriminatedUnion('type', [
  CtaUrlTextHeaderSchema,
  CtaUrlImageHeaderSchema,
  CtaUrlDocumentHeaderSchema,
  CtaUrlVideoHeaderSchema,
]);

// Schema for the body
const CtaUrlBodySchema = z.object({
  text: z.string(),
});

// Schema for the action parameters
const CtaUrlActionParamsSchema = z.object({
  display_text: z.string(),
  url: z.string().url(),
});

// Schema for the action
const CtaUrlActionSchema = z.object({
  name: z.literal('cta_url'),
  parameters: CtaUrlActionParamsSchema,
});

// Schema for the footer
const CtaUrlFooterSchema = z.object({
  text: z.string(),
});

// Schema for the interactive object with optional header
export const CtaUrlInteractiveObjectSchema = z.object({
  type: z.literal('cta_url'),
  header: CtaUrlHeaderSchema.optional(),
  body: CtaUrlBodySchema,
  action: CtaUrlActionSchema,
  footer: CtaUrlFooterSchema.optional(),
});

// Schema for the complete message payload
export const CtaUrlMessagePayloadSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string(),
  type: z.literal('interactive'),
  interactive: CtaUrlInteractiveObjectSchema,
});

// ============================================================================
// BASIC MESSAGE SCHEMAS
// ============================================================================

// Schema for basic text message payload
export const TextMessagePayloadSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string(),
  type: z.literal('text'),
  text: z.object({
    body: z.string(),
  }),
});

// Schema for typing indicator payload
export const TypingIndicatorPayloadSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string(),
  type: z.literal('typing'),
});

// Schema for mark as read payload
export const MarkAsReadPayloadSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  status: z.literal('read'),
  message_id: z.string(),
});

// ============================================================================
// WHATSAPP API RESPONSE SCHEMAS
// ============================================================================

// Schema for API response contacts
const ApiResponseContactSchema = z.object({
  input: z.string(),
  wa_id: z.string(),
});

// Schema for API response messages
const ApiResponseMessageSchema = z.object({
  id: z.string(),
});

// Schema for WhatsApp API response
export const WhatsAppApiResponseSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  contacts: z.array(ApiResponseContactSchema),
  messages: z.array(ApiResponseMessageSchema),
});

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type CtaUrlInteractiveObject = z.infer<typeof CtaUrlInteractiveObjectSchema>;
export type CtaUrlMessagePayload = z.infer<typeof CtaUrlMessagePayloadSchema>;
export type TextMessagePayload = z.infer<typeof TextMessagePayloadSchema>;
export type TypingIndicatorPayload = z.infer<typeof TypingIndicatorPayloadSchema>;
export type MarkAsReadPayload = z.infer<typeof MarkAsReadPayloadSchema>;
export type WhatsAppApiResponse = z.infer<typeof WhatsAppApiResponseSchema>;

// ============================================================================
// WHATSAPP CLIENT CONFIGURATION
// ============================================================================

export interface WhatsAppConfig {
  apiUrl: string;
  token: string;
}

// ============================================================================
// MESSAGE VALIDATION SCHEMAS COLLECTION
// ============================================================================

export const messageSchemas = {
  ctaUrl: CtaUrlMessagePayloadSchema,
  text: TextMessagePayloadSchema,
  typing: TypingIndicatorPayloadSchema,
  markAsRead: MarkAsReadPayloadSchema,
  apiResponse: WhatsAppApiResponseSchema,
} as const;