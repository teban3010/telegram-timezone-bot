// https://github.com/yagop/node-telegram-bot-api/issues/319#issuecomment-324963294
// Fixes an error with Promise cancellation
// process.env.NTBA_FIX_319 = 'test';

import type { NextApiRequest, NextApiResponse } from 'next';

import { handleMessage } from 'server/bot';

// curl -X POST https://api.telegram.org/bot<YOUR-BOT-TOKEN>/setWebhook -H "Content-type: application/json" -d '{"url": "https://your-ngrok-subdomain.ngrok.io/api/webhook"}'

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  if (!request.body?.message) {
    return response.send('OK');
  }

  try {
    await handleMessage(request.body.message);
  } catch (error) {
    console.error('Error sending message');
    console.log(error.toString());
  }

  response.send('OK');
}
