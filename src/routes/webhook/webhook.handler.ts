// Houses business logic for handling WhatsApp webhook requests
import type { Context } from 'hono'
import type { Env } from '../../bindings';
import { WebhookProcessor } from './webhook.processorDO';
import { HTTPException } from 'hono/http-exception'
import type { WebhookPayload as WhatsAppWebhookPayload, MessageValue } from './webhook.schema'

export const webhookHandlers = {
  /**
   * Handles WhatsApp webhook verification (GET request)
   * This is required by WhatsApp to verify the webhook endpoint
   */
  verifyWebhook: async (c: Context<{ Bindings: Env }>) => {
    try {
      const mode = c.req.query('hub.mode')
      const token = c.req.query('hub.verify_token')
      const challenge = c.req.query('hub.challenge')
  
      // check the mode and token sent are correct
      if (mode === 'subscribe' && token === c.env.WHATSAPP_VERIFY_TOKEN) {
        // respond with 200 OK and challenge token from the request
        console.log('Webhook verified successfully!')
        return c.text(challenge || '', 200)
      }
  
      // respond with '403 Forbidden' if verify tokens do not match
      throw new HTTPException(403, { message: 'Invalid verify token' })
    } catch (error) {
      console.error('Webhook verification error:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(400, { message: 'Invalid webhook verification request' })
    }
  },

  /**
   * Handles incoming WhatsApp webhook events (POST request)
   * Returns immediate 200 response while processing continues asynchronously in Durable Object
   */
  handleWebhookEvent: async (c: Context<{ Bindings: Env }>) => {
    try {
      const body = await c.req.json() as WhatsAppWebhookPayload
      const change = body?.entry?.[0].changes?.[0]
      
      // Check if this is a message change (not template status)
      if (change?.field !== 'messages') {
        return c.json({ success: true, message: 'Non-message event processed' })
      }
      console.log('✅ Received WhatsApp webhook event:', body)
      const messageValue = change.value as MessageValue
      const messageID = messageValue?.messages?.[0].id 
      if (!messageID) return c.json({ 
        success: false, 
        message: 'Missing message ID'
      }, 400)

      const id = c.env.WEBHOOK_PROCESSOR.idFromName(messageID)
      const stub = c.env.WEBHOOK_PROCESSOR.get(id) as DurableObjectStub & WebhookProcessor
      
      // Asynchronously process the webhook without blocking the response
      c.executionCtx.waitUntil(stub.processWebhook(body));

      // Return immediate 200 response to WhatsApp
      // This prevents timeouts and duplicate webhook deliveries
      console.log('✅ Webhook accepted, processing asynchronously')
      return c.json({ 
        success: true, 
        message: 'Webhook received and queued for processing',
        webhook_id: messageID
      }, 200)
      
    } catch (error) {
      console.error('❌ Error handling WhatsApp webhook:', error)
      
      // Still return 200 to prevent WhatsApp from retrying
      // The error is logged for investigation
      return c.json({ 
        success: false, 
        error: 'Webhook received but failed to queue for processing'
      }, 200)
    }
  }
}
