'use server';

import pdf from 'pdf-parse';
import { generateEmbeddings } from '@/lib/embeddings';
import { chuckContent } from '@/lib/chunking';
import { documents } from '@/lib/schema';
import { db } from '@/db';

export async function processPdfFile(formdata: FormData) {
  try {
    const file = formdata.get('pdf') as File;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const data = await pdf(buffer);
    if (!data.text || data.text.length == 0) {
      return {
        success: false,
        message: 'No text found in document',
      };
    }
    let chunks = await chuckContent(data.text);
    let embeddings = await generateEmbeddings(chunks);

    let records = chunks.map((chunk, i) => {
      return {
        content: chunk,
        embedding: embeddings[i],
      };
    });
    await db.insert(documents).values(records);
    return {
      success: true,
      message: `Created Searchable ${records.length} Chunks`,
    };
  } catch (err) {
    console.log('error processing file', err);
    return {
      success: false,
      message: 'Failed to process PDF',
    };
  }
}
