// AI Service for generating summaries and insights
import type { FundingRequest } from './database';

export interface AISummary {
  id: string;
  requestId: string;
  summary: string;
  keyPoints: string[];
  riskAssessment: 'Low' | 'Medium' | 'High';
  recommendations: string[];
  generatedAt: Date;
  model: string;
}

export interface AIService {
  generateRequestSummary(request: FundingRequest): Promise<AISummary>;
  generateInsights(requests: FundingRequest[]): Promise<string[]>;
  isAvailable(): boolean;
}

// Mock AI Service for demo purposes
// In production, you would integrate with services like:
// - OpenAI GPT API
// - Anthropic Claude API
// - Google Gemini API
// - Azure OpenAI Service
class MockAIService implements AIService {
  private cache = new Map<string, AISummary>();
  private isEnabled = true;

  async generateRequestSummary(request: FundingRequest): Promise<AISummary> {
    // Check cache first
    const cacheKey = `summary_${request.id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!this.isEnabled) {
      throw new Error('AI service is currently unavailable');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate mock summary based on request data
    const summary = this.generateMockSummary(request);
    
    const aiSummary: AISummary = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      summary: summary.text,
      keyPoints: summary.keyPoints,
      riskAssessment: summary.riskAssessment,
      recommendations: summary.recommendations,
      generatedAt: new Date(),
      model: 'mock-ai-v1.0'
    };

    // Cache the result
    this.cache.set(cacheKey, aiSummary);
    
    return aiSummary;
  }

  async generateInsights(requests: FundingRequest[]): Promise<string[]> {
    if (!this.isEnabled) {
      throw new Error('AI service is currently unavailable');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const insights = [
      `Total funding requests: ${requests.length}`,
      `Average request amount: ₹${this.calculateAverageAmount(requests).toLocaleString()}`,
      `Most common category: ${this.getMostCommonCategory(requests)}`,
      `Approval rate: ${this.calculateApprovalRate(requests)}%`,
      `Pending requests: ${requests.filter(r => r.status === 'Open').length}`
    ];

    return insights;
  }

  isAvailable(): boolean {
    return this.isEnabled;
  }

  private generateMockSummary(request: FundingRequest): {
    text: string;
    keyPoints: string[];
    riskAssessment: 'Low' | 'Medium' | 'High';
    recommendations: string[];
  } {
    const amount = request.amount;
    const category = request.category;
    const description = request.description;

    // Determine risk level based on amount and category
    let riskAssessment: 'Low' | 'Medium' | 'High' = 'Low';
    if (amount > 10000) riskAssessment = 'High';
    else if (amount > 5000) riskAssessment = 'Medium';

    // Generate contextual summary
    const summaryText = `This ${category.toLowerCase()} request for ₹${amount.toLocaleString()} appears to be for ${this.extractPurpose(description)}. The request includes ${request.checklist?.length || 0} checklist items and ${request.attachments?.length || 0} attachments.`;

    const keyPoints = [
      `Amount: ₹${amount.toLocaleString()}`,
      `Category: ${category}`,
      `Status: ${request.status}`,
      `Requested by: ${request.requesterId}`,
      `Created: ${new Date(request.createdAt).toLocaleDateString()}`
    ];

    const recommendations = this.generateRecommendations(request, riskAssessment);

    return {
      text: summaryText,
      keyPoints,
      riskAssessment,
      recommendations
    };
  }

  private extractPurpose(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('equipment')) return 'equipment purchase';
    if (lowerDesc.includes('software')) return 'software licensing';
    if (lowerDesc.includes('training')) return 'training and development';
    if (lowerDesc.includes('travel')) return 'business travel';
    if (lowerDesc.includes('marketing')) return 'marketing activities';
    return 'general business purposes';
  }

  private generateRecommendations(request: FundingRequest, risk: 'Low' | 'Medium' | 'High'): string[] {
    const recommendations = [];

    if (risk === 'High') {
      recommendations.push('Consider additional documentation for high-value request');
      recommendations.push('Review budget allocation and impact');
    }

    if (request.attachments?.length === 0) {
      recommendations.push('Request supporting documentation');
    }

    if (request.checklist?.length === 0) {
      recommendations.push('Add checklist items for better tracking');
    }

    if (request.amount > 5000) {
      recommendations.push('Consider multi-level approval process');
    }

    if (recommendations.length === 0) {
      recommendations.push('Request appears well-documented and ready for review');
    }

    return recommendations;
  }

  private calculateAverageAmount(requests: FundingRequest[]): number {
    if (requests.length === 0) return 0;
    const total = requests.reduce((sum, r) => sum + r.amount, 0);
    return total / requests.length;
  }

  private getMostCommonCategory(requests: FundingRequest[]): string {
    if (requests.length === 0) return 'None';
    const categories = requests.map(r => r.category);
    const counts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  }

  private calculateApprovalRate(requests: FundingRequest[]): number {
    if (requests.length === 0) return 0;
    const approved = requests.filter(r => r.status === 'Approved').length;
    return Math.round((approved / requests.length) * 100);
  }

  // Utility methods for cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Toggle AI service availability (for testing)
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Create and export AI service instance
export const aiService: AIService = new MockAIService();

// Production AI service implementation example
// You would replace the MockAIService with a real implementation like this:

/*
import OpenAI from 'openai';

class OpenAIService implements AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY!,
    });
  }

  async generateRequestSummary(request: FundingRequest): Promise<AISummary> {
    const prompt = `
      Analyze this funding request and provide a comprehensive summary:
      
      Title: ${request.title}
      Description: ${request.description}
      Amount: $${request.amount}
      Category: ${request.category}
      Status: ${request.status}
      
      Please provide:
      1. A concise summary
      2. Key points
      3. Risk assessment (Low/Medium/High)
      4. Recommendations
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // Parse response and return structured data
    // Implementation details would go here...
  }

  async generateInsights(requests: FundingRequest[]): Promise<string[]> {
    // Similar implementation for generating insights
  }

  isAvailable(): boolean {
    return !!process.env.REACT_APP_OPENAI_API_KEY;
  }
}
*/
