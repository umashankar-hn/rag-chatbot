import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { generateEmbedding } from './embeddings';
import { documents } from './schema';
import { db } from '@/db';
export async function searchDocuments(
  query: string,
  limit: number = 5,
  threshold: number = 0.5,
) {
  let embedding = await generateEmbedding(query);

  const similarity = sql<number>`(1.0 - (${cosineDistance(documents.embedding, embedding)}))`;

  const similarDocs = await db
    .select({ id: documents.id, content: documents.content, similarity })
    .from(documents)
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit);

  if (similarDocs.length > 0) {
    return similarDocs;
  }

  // Fallback: perform a case-insensitive substring match for query terms
  try {
    console.log(
      '[SEARCH] no semantic matches, trying text fallback for query:',
      query,
    );
    const terms = query
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);

    if (terms.length > 0) {
      const clauses = terms.map((t) => sql`content ILIKE ${`%${t}%`}`);
      // Build an OR combined where clause iteratively to avoid type assertion issues
      let whereClause = clauses[0];
      for (let i = 1; i < clauses.length; i++) {
        whereClause = sql`${whereClause} OR ${clauses[i]}`;
      }

      const textMatches = await db
        .select({
          id: documents.id,
          content: documents.content,
          similarity: sql`1.0`,
        })
        .from(documents)
        .where(whereClause)
        .limit(limit);

      console.log('[SEARCH] text fallback results count:', textMatches.length);
      if (textMatches.length > 0) {
        return textMatches;
      }
    }
  } catch (err) {
    console.log('[SEARCH] text fallback error', err);
  }

  return similarDocs;
}
