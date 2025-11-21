import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface QdrantSearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, any>;
  vector?: number[];
}

interface QdrantSearchResponse {
  result: QdrantSearchResult[];
}

@Injectable()
export class RagService {
  private qdrantUrl: string;
  private qdrantApiKey: string;
  private collectionName: string;
  private openaiApiKey: string;

  constructor(private configService: ConfigService) {
    this.qdrantUrl = this.configService.get<string>('QDRANT_URL') || '';
    this.qdrantApiKey = this.configService.get<string>('QDRANT_API_KEY') || '';
    this.collectionName =
      this.configService.get<string>('QDRANT_COLLECTION_NAME') ||
      'policy_documents';
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small',
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  private async searchQdrant(
    queryVector: number[],
    limit: number = 5,
  ): Promise<QdrantSearchResult[]> {
    try {
      const response = await fetch(
        `${this.qdrantUrl}/collections/${this.collectionName}/points/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.qdrantApiKey,
          },
          body: JSON.stringify({
            vector: queryVector,
            limit,
            with_payload: true,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.statusText}`);
      }

      const data: QdrantSearchResponse = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error searching Qdrant:', error);
      throw new Error('Failed to search vector database');
    }
  }
  async queryLeavePolicies(
    question: string,
    topK: number = 5,
  ): Promise<string> {
    try {
      const queryVector = await this.generateEmbedding(question);

      const searchResults = await this.searchQdrant(queryVector, topK);

      if (searchResults.length === 0) {
        return 'No relevant information found in the leave policies database.';
      }

      const contextParts = searchResults.map((result, index) => {
        const content = result.payload?.text || result.payload?.content || '';
        const score = result.score.toFixed(3);
        return `[Document ${index + 1}] (Relevance: ${score})\n${content}`;
      });

      const context = contextParts.join('\n\n---\n\n');

      return `Based on the leave policies database, here is the relevant information:\n\n${context}`;
    } catch (error) {
      console.error('Error in RAG query:', error);
      throw error;
    }
  }
}
