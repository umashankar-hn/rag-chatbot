import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
export async function POST(req: Request) {
  try {
    let { messages }: { messages: UIMessage[] } = await req.json();

    // Debugging logs: confirm the API is being hit and inspect incoming payload
    console.log('/api/chat POST received, messages length:', messages?.length);
    if (!messages || messages.length === 0) {
      console.log('/api/chat - no messages in request');
      return new Response('No messages provided', { status: 400 });
    }

    const result = streamText({
      model: openai('gpt-4.1-mini'),
      messages: await convertToModelMessages(messages),
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.log('Error streaming chat completion', error);
    return new Response('Falied to stream Chat Completion', { status: 500 });
  }
}
