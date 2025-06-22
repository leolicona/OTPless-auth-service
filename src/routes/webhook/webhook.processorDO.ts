import { cleanPhoneNumber } from '../../utils/utils';
import { DurableObject } from 'cloudflare:workers';
import {
  WebhookPayload as WhatsAppWebhookPayload,
  Message as WhatsAppMessage,
  Contact as WhatsAppContact,
  MessageValue,
  isWhatsAppWebhookPayload,
  isTextMessage,
  MessageProcessingResult
} from './webhook.schema';
import { CtaUrlInteractiveObject, CtaUrlMessagePayload } from '../../core/whatsapp/whatsApp.schema';
import { WhatsAppClient } from '../../core/whatsapp/whatsapp';
import { Env } from '../../bindings';
import { findUserByPhone, createVerificationToken } from '../../core/auth/auth';



export class WebhookProcessor extends DurableObject {
  private readonly apiUrl: string;
  public readonly env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
      super(ctx, env);
      this.env = env;
      console.log('🟣 [DoWaProcessMessages] Inicializando Durable Object');
      this.apiUrl = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  }

  async processWebhook(payload: WhatsAppWebhookPayload): Promise<MessageProcessingResult> {
    console.log('🚀 [WebhookProcessorDO] Received webhook event.', JSON.stringify(payload, null, 2));
    return this.processMessage(payload);
  }

  async getStatus() {
    return this.ctx.storage.get("processingStatus");
  }

  private async processMessage(payload: WhatsAppWebhookPayload): Promise<MessageProcessingResult> {
    console.log('➡️ [WebhookProcessorDO] Starting processMessage.', JSON.stringify(payload, null, 2));
    try {
        if (!isWhatsAppWebhookPayload(payload)) {
            console.error('❌ [WebhookProcessorDO] Invalid WhatsApp webhook payload structure');
            throw new Error('Invalid WhatsApp webhook payload structure');
        }
        console.log('✅ [WebhookProcessorDO] Payload structure validated.');

        const whatsAppClient = WhatsAppClient({
          apiUrl: this.apiUrl,
          token: this.env.WHATSAPP_API_TOKEN,
        })
          
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        
        if (change?.field !== 'messages') {
          console.warn('⚠️ [WebhookProcessorDO] Non-message event received, skipping processing.');
          return { status: 'success', message: 'Non-message event processed' };
        }
        console.log('ℹ️ [WebhookProcessorDO] Message event detected.');
        
        const value = change.value as MessageValue;
        const message = value?.messages?.[0];
        const contact = value?.contacts?.[0];
        

        if (!message || !contact) {
            console.error('❌ [WebhookProcessorDO] Incomplete message data. Missing message or contact.');
            throw new Error('Incomplete message data');
        }

        console.log(`🔄 [WebhookProcessorDO] Processing message ID: ${message.id} from ${contact.wa_id}`);
        
        await this.ctx.storage.put("processingStatus", {
            status: "processing",
            timestamp: new Date().toISOString(),
            messageId: message.id,
            from: contact.wa_id,
            messageType: message.type
        });

        if (isTextMessage(message)) {
            console.log(`💬 [WebhookProcessorDO] Processing text message. Body: "${message.text.body}"`);
          
            await whatsAppClient.markMessageAsRead(message.id);
            await whatsAppClient.sendTypingIndicator(message.id);

            const phoneNumber = cleanPhoneNumber(contact.wa_id);
            console.log(`🔍 [WebhookProcessorDO] Searching for user with phone number: ${phoneNumber}`);
            

            const singUpOrLogin = /create account|join/i.test(message.text.body);
            console.log(`ℹ️ [WebhookProcessorDO] Create account intent detected: ${singUpOrLogin}`);
            if (singUpOrLogin) {
              console.log(`🆕 [WebhookProcessorDO] No user found. Creating verification token for: ${phoneNumber}`);
              const user = await findUserByPhone({ env: this.env } as any, phoneNumber);
              console.log("user", user);
                const text = user?.id ?
                    "Welcome back! 👋"
                    :
                    "Thank you for signing up!"
             
              const token = await createVerificationToken({ env: this.env } as any, phoneNumber);
              console.log("token", token)
              const verificationUrl = `https://webapp-unalana.leolicona-dev.workers.dev/verify?token=${token}`;
              console.log(`🔗 [WebhookProcessorDO] Sending verification URL: ${verificationUrl}`);
             
              await whatsAppClient.sendCtaUrlMessage(phoneNumber, {
                type: 'cta_url',
               header: { type: 'image', image: { link: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/WhatsApp_test_message.jpg/2560px-WhatsApp_test_message.jpg' } },
                
                body: { text },
                action: {
                  name: 'cta_url',
                  parameters: {
                    display_text: 'Create Account',
                    url: verificationUrl,
                  },
                },
                footer: {
                  text: 'Powered by OTPless'
                }
              }); 
            } else {
              console.log(`🤔 [WebhookProcessorDO] Intent not recognized. Sending fallback message to: ${phoneNumber}`);
              await whatsAppClient.sendMessage(
                  phoneNumber,
                  {
                      type: "text",
                      text: {
                          body: "I'm sorry, I didn't understand that. Please type 'create account' to begin."
                      }
                  }
              );
            }
            
            console.log(`💾 [WebhookProcessorDO] Storing successful processing result for message: ${message.id}`);
            await this.ctx.storage.put(`message:${message.id}`, {
                messageId: message.id,
                from: contact.wa_id,
                messageType: message.type,
                processedAt: new Date().toISOString(),
                status: 'completed'
            });
        } else {
            console.warn(`🤷 [WebhookProcessorDO] Received non-text message type: ${message.type}. Skipping.`);
        }
    
        console.log(`✅ [WebhookProcessorDO] Webhook processing completed successfully for message ID: ${message.id}`);
        return { status: 'success', message: 'Webhook processed', messageId: message.id };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('💥 [WebhookProcessorDO] Error processing message:', {
            error: errorMessage,
            payload: JSON.stringify(payload)
        });
        
        await this.ctx.storage.put("processingStatus", {
            status: "error",
            timestamp: new Date().toISOString(),
            error: errorMessage
        });

        return { status: 'error', message: errorMessage };
    }
  }
}




