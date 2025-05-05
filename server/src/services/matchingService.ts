import OpenAI from 'openai';
import { IProfessional } from '../models/Professional';
import { ICoffeeChat } from '../models/CoffeeChat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface MatchingPreferences {
  industry: string;
  seniority: string;
  budget: number;
  topics: string[];
}

export class MatchingService {
  static async findBestMatches(
    preferences: MatchingPreferences,
    professionals: IProfessional[]
  ): Promise<IProfessional[]> {
    // Create embeddings for preferences
    const preferenceEmbedding = await this.createEmbedding(
      `Industry: ${preferences.industry}, Seniority: ${preferences.seniority}, Topics: ${preferences.topics.join(', ')}`
    );

    // Create embeddings for each professional
    const professionalEmbeddings = await Promise.all(
      professionals.map(async (professional) => {
        const professionalText = `
          Industry: ${professional.industry},
          Seniority: ${professional.seniority},
          Expertise: ${professional.expertise.join(', ')},
          Bio: ${professional.bio}
        `;
        const embedding = await this.createEmbedding(professionalText);
        return { professional, embedding };
      })
    );

    // Calculate similarity scores
    const matches = professionalEmbeddings.map(({ professional, embedding }) => {
      const similarity = this.calculateCosineSimilarity(preferenceEmbedding, embedding);
      return { professional, similarity };
    });

    // Filter by budget and sort by similarity
    return matches
      .filter(({ professional }) => professional.hourlyRate <= preferences.budget)
      .sort((a, b) => b.similarity - a.similarity)
      .map(({ professional }) => professional);
  }

  private static async createEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    return response.data[0].embedding;
  }

  private static calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  static async generateMatchExplanation(
    seeker: MatchingPreferences,
    professional: IProfessional
  ): Promise<string> {
    const prompt = `
      Explain why this professional would be a good match for the seeker:
      
      Seeker Preferences:
      - Industry: ${seeker.industry}
      - Seniority: ${seeker.seniority}
      - Topics: ${seeker.topics.join(', ')}
      
      Professional Profile:
      - Industry: ${professional.industry}
      - Seniority: ${professional.seniority}
      - Expertise: ${professional.expertise.join(', ')}
      - Bio: ${professional.bio}
      
      Provide a concise explanation focusing on the key matching factors.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150
    });

    return response.choices[0].message.content || 'No explanation available';
  }
} 