import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  InferUITools,
  UIDataTypes,
  stepCountIs,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { searchDocuments } from '@/lib/search';
import { db } from '@/db';
import { documents } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { intents, Intent } from '@/lib/intents';
import { generateEmbeddings, generateEmbedding } from '@/lib/embeddings';

const tools = {
  searchKnowledgeBase: tool({
    description: 'Search the knowledge base for relevant information',
    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant documents'),
    }),
    execute: async ({ query }) => {
      try {
        console.log('[KB SEARCH] called with query:', query);
        // Try semantic search first with higher recall
        const results = await searchDocuments(query, 10, 0.2);
        console.log('[KB SEARCH] semantic results count:', results.length);

        if (results.length > 0) {
          const response = {
            found: true,
            count: results.length,
            items: results.map((r) => ({
              id: r.id,
              content: r.content,
              similarity: r.similarity,
            })),
          };
          console.log('[KB SEARCH] response:', {
            query,
            count: response.count,
          });
          return response;
        }

        // If semantic search returned nothing, run embedding-based intent detection to avoid hardcoded regex checks
        try {
          // cosine similarity helper
          const cosine = (a: number[], b: number[]) => {
            const dot = a.reduce((s, ai, i) => s + ai * b[i], 0);
            const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
            const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
            return dot / (na * nb + 1e-12);
          };

          // load or compute intent embeddings (cache on global)
          let intentEmbeddings: Record<string, number[]> | undefined = (
            global as any
          ).__intentEmbeddings;
          if (!intentEmbeddings) {
            intentEmbeddings = {};
            for (const it of intents) {
              try {
                const emb = await generateEmbeddings(it.examples);
                // mean of example embeddings for the intent
                const mean = emb[0].map(
                  (_, idx) => emb.reduce((s, e) => s + e[idx], 0) / emb.length,
                );
                intentEmbeddings[it.id] = mean;
              } catch (e) {
                console.log(
                  '[KB SEARCH] error computing embeddings for intent',
                  it.id,
                  e,
                );
              }
            }
            (global as any).__intentEmbeddings = intentEmbeddings;
          }

          // compute query embedding and find best matching intent
          const qEmb = await generateEmbedding(query);
          let bestIntent: Intent | null = null;
          let bestScore = -Infinity;
          for (const it of intents) {
            const ie = intentEmbeddings[it.id];
            if (!ie) continue;
            const score = cosine(qEmb, ie);
            if (score > bestScore) {
              bestScore = score;
              bestIntent = it;
            }
          }
          console.log(
            '[KB SEARCH] detected intent:',
            bestIntent?.id,
            'score:',
            bestScore,
          );

          // if confident, run a keyword-based search using intent.keywords (config-driven)
          if (bestIntent && bestScore > 0.6) {
            const kws = bestIntent.keywords.slice(0, 12);
            const clauses = kws.map((kw) => sql`content ILIKE ${`%${kw}%`}`);
            let whereClause = clauses[0];
            for (let i = 1; i < clauses.length; i++)
              whereClause = sql`${whereClause} OR ${clauses[i]}`;

            const dynMatches = await db
              .select({
                id: documents.id,
                content: documents.content,
                similarity: sql`1.0`,
              })
              .from(documents)
              .where(whereClause)
              .limit(50);

            console.log(
              '[KB SEARCH] dynamic intent matches count:',
              dynMatches.length,
            );
            if (dynMatches.length > 0)
              return {
                found: true,
                count: dynMatches.length,
                items: dynMatches,
              };
          }
        } catch (err) {
          console.log('[KB SEARCH] intent detection/fallback error', err);
        }

        // Final fallback: do a relaxed text search on query terms
        console.log('[KB SEARCH] final text fallback for query:', query);
        const relaxed = await searchDocuments(query, 10, 0.0);
        console.log('[KB SEARCH] final fallback count:', relaxed.length);
        if (relaxed.length > 0) {
          return { found: true, count: relaxed.length, items: relaxed };
        }

        return { found: false, count: 0, items: [] };
      } catch (error) {
        console.log('[KB SEARCH] error', error);
        return { found: false, count: 0, items: [], error: String(error) };
      }
    },
  }),
};
export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  try {
    let { messages }: { messages: ChatMessage[] } = await req.json();

    const result = streamText({
      model: openai('gpt-4.1-mini'),
      messages: await convertToModelMessages(messages),
      tools,
      system: `You are a helpful assistant with access to a knowledge base. 
          When users ask questions, search the knowledge base for relevant information.
          Always search before answering if the question might relate to uploaded documents.
          Base your answers on the search results when available. Give concise answers that correctly answer what the user is asking for. Do not flood them with all the information from the search results.`,
      stopWhen: stepCountIs(2),
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.log('Error streaming chat completion', error);
    return new Response('Falied to stream Chat Completion', { status: 500 });
  }
}
