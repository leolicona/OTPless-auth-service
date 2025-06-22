import { makeApiRequester } from '../makeApiRequester';
import { 
  CtaUrlInteractiveObject, 
  CtaUrlMessagePayload, 
  CtaUrlMessagePayloadSchema,
  TextMessagePayloadSchema,
  TypingIndicatorPayloadSchema,
  MarkAsReadPayloadSchema,
  WhatsAppConfig
} from './whatsApp.schema';
const WhatsAppClient = (config: WhatsAppConfig) => {
 
   const apiRequest  = makeApiRequester(config);

  return {
    sendMessage: async (to: string, message: object): Promise<void> => {
      const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        ...message,
      };
      await apiRequest(body);
    },

    sendCtaUrlMessage: async (to: string, interactive: CtaUrlInteractiveObject): Promise<void> => {
      const body: CtaUrlMessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive,
      };

      CtaUrlMessagePayloadSchema.parse(body);
      await apiRequest(body);
    },

    sendTypingIndicator: async (messageId: string): Promise<void> => {
      const body = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
        typing_indicator: {
          type: 'text'
        }
      };
      await apiRequest(body);
    },

    markMessageAsRead: async (messageId: string): Promise<void> => {
      const body = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };
      await apiRequest(body);
    },
  };
};

export { WhatsAppClient, type WhatsAppConfig };