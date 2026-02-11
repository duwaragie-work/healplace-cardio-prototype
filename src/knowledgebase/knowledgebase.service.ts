import { Injectable } from '@nestjs/common';
import { extractTextFromBuffer } from './utils/document-reader.util';
import { document_cleaner } from './utils/text-cleaner';
import { text_splitter } from './utils/text-splitter';

@Injectable()
export class KnowledgebaseService {
  async processDocument(buffer: Buffer, originalName: string): Promise<string[]> {
    try {
      const text = await extractTextFromBuffer(buffer, originalName);
      const cleand_text = document_cleaner(text);
      const split_text = text_splitter(cleand_text);
      return split_text;
    } catch (error) {
      throw new Error(`Error processing document: ${error.message}`);
    }
  }
}
