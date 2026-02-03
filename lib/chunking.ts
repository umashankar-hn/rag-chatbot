import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 150,
  chunkOverlap: 20,
  separators: [' '],
});

export async function chuckContent(text: string) {
  return await textSplitter.splitText(text.trim());
}
