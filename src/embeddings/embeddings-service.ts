/**
 * Embeddings service for semantic similarity calculations
 */

import { OpenAI } from 'openai';

export interface EmbeddingVector {
  vector: number[];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingsProvider {
  generateEmbedding(text: string): Promise<EmbeddingVector>;
  generateEmbeddings(texts: string[]): Promise<EmbeddingVector[]>;
  getModel(): string;
}

/**
 * OpenAI embeddings provider
 */
export class OpenAIEmbeddingsProvider implements EmbeddingsProvider {
  private client: OpenAI;
  private model: string;

  constructor(model: string = 'text-embedding-3-small', apiKey?: string) {
    this.model = model;
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(text: string): Promise<EmbeddingVector> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
      });

      return {
        vector: response.data[0].embedding,
        model: this.model,
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          total_tokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      throw new Error(`OpenAI embedding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingVector[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map((item, index) => ({
        vector: item.embedding,
        model: this.model,
        usage: response.usage ? {
          prompt_tokens: Math.floor(response.usage.prompt_tokens / texts.length),
          total_tokens: Math.floor(response.usage.total_tokens / texts.length),
        } : undefined,
      }));
    } catch (error) {
      throw new Error(`OpenAI batch embedding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getModel(): string {
    return this.model;
  }
}

/**
 * Local embeddings provider (mock implementation)
 * In a real implementation, this would use libraries like sentence-transformers
 */
export class LocalEmbeddingsProvider implements EmbeddingsProvider {
  private model: string;

  constructor(model: string = 'all-MiniLM-L6-v2') {
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<EmbeddingVector> {
    // Mock implementation - in real scenario, would use local embedding model
    const mockVector = this.generateMockEmbedding(text);
    
    return {
      vector: mockVector,
      model: this.model,
      usage: {
        prompt_tokens: Math.ceil(text.length / 4),
        total_tokens: Math.ceil(text.length / 4),
      },
    };
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingVector[]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  getModel(): string {
    return this.model;
  }

  private generateMockEmbedding(text: string): number[] {
    // Simple hash-based mock embedding - NOT suitable for production
    // In real implementation, use proper embedding models
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(384).fill(0); // Common embedding dimension
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        vector[charCode % 384] += Math.sin(charCode * (i + 1)) * 0.1;
      }
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => magnitude > 0 ? val / magnitude : 0);
  }
}

/**
 * Factory function for creating embeddings providers
 */
export function createEmbeddingsProvider(provider: string = 'openai', model?: string): EmbeddingsProvider {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIEmbeddingsProvider(model);
    case 'local':
      return new LocalEmbeddingsProvider(model);
    default:
      console.warn(`Unknown embeddings provider ${provider}, defaulting to OpenAI`);
      return new OpenAIEmbeddingsProvider(model);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Semantic similarity service
 */
export class SemanticSimilarityService {
  private provider: EmbeddingsProvider;
  private cache: Map<string, EmbeddingVector> = new Map();

  constructor(provider?: EmbeddingsProvider) {
    this.provider = provider || createEmbeddingsProvider('openai');
  }

  async calculateSimilarity(textA: string, textB: string): Promise<{
    similarity: number;
    embeddingA: EmbeddingVector;
    embeddingB: EmbeddingVector;
  }> {
    // Check cache first
    const cacheKeyA = `${this.provider.getModel()}:${textA}`;
    const cacheKeyB = `${this.provider.getModel()}:${textB}`;

    let embeddingA = this.cache.get(cacheKeyA);
    let embeddingB = this.cache.get(cacheKeyB);

    // Generate embeddings for missing texts
    const textsToEmbed: string[] = [];
    const indices: number[] = [];

    if (!embeddingA) {
      textsToEmbed.push(textA);
      indices.push(0);
    }
    if (!embeddingB) {
      textsToEmbed.push(textB);
      indices.push(1);
    }

    if (textsToEmbed.length > 0) {
      const newEmbeddings = await this.provider.generateEmbeddings(textsToEmbed);
      
      for (let i = 0; i < newEmbeddings.length; i++) {
        const embedding = newEmbeddings[i];
        if (indices[i] === 0) {
          embeddingA = embedding;
          this.cache.set(cacheKeyA, embedding);
        } else {
          embeddingB = embedding;
          this.cache.set(cacheKeyB, embedding);
        }
      }
    }

    if (!embeddingA || !embeddingB) {
      throw new Error('Failed to generate embeddings');
    }

    const similarity = cosineSimilarity(embeddingA.vector, embeddingB.vector);

    return {
      similarity,
      embeddingA,
      embeddingB,
    };
  }

  async calculateBestMatch(text: string, candidates: string[]): Promise<{
    bestMatch: string;
    bestSimilarity: number;
    allSimilarities: Array<{ text: string; similarity: number; }>;
  }> {
    const similarities = await Promise.all(
      candidates.map(async (candidate) => {
        const result = await this.calculateSimilarity(text, candidate);
        return {
          text: candidate,
          similarity: result.similarity,
        };
      })
    );

    const best = similarities.reduce((prev, current) => 
      current.similarity > prev.similarity ? current : prev
    );

    return {
      bestMatch: best.text,
      bestSimilarity: best.similarity,
      allSimilarities: similarities,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
