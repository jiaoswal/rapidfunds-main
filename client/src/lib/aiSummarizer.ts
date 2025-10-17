import OpenAI from 'openai';
import { FundingRequest, User, Organization } from './database';
import { config, isOpenAIConfigured } from './config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

export interface AISummary {
  id: string;
  requestId: string;
  summary: string;
  bulletPoints: string[];
  keyInsights: string[];
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  impact: string;
  recommendation: string;
  generatedAt: Date;
  model: string;
}

export interface SummarizationContext {
  request: FundingRequest;
  requester: User;
  organization: Organization;
  approvers: User[];
}

class AISummarizerService {
  private summaries: Map<string, AISummary> = new Map();

  /**
   * Generate AI summary for a funding request
   */
  async generateSummary(context: SummarizationContext): Promise<AISummary> {
    const { request, requester, organization, approvers } = context;
    
    // Check if we already have a recent summary
    const existingSummary = this.summaries.get(request.id);
    if (existingSummary && this.isSummaryRecent(existingSummary, request.updatedAt)) {
      return existingSummary;
    }

    // Check if OpenAI is configured, otherwise use fallback
    if (!isOpenAIConfigured()) {
      console.warn('OpenAI not configured, using fallback summary');
      return this.generateFallbackSummary(context);
    }

    try {
      // Prepare the prompt for OpenAI
      const prompt = this.createSummarizationPrompt(context);
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that creates concise, action-ready summaries for funding request approvals. Focus on key business insights, urgency, and actionable recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      // Parse the AI response
      const summary = this.parseAIResponse(aiResponse, request);
      
      // Cache the summary
      this.summaries.set(request.id, summary);
      
      return summary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      
      // Fallback to basic summary if AI fails
      return this.generateFallbackSummary(context);
    }
  }

  /**
   * Create the prompt for OpenAI
   */
  private createSummarizationPrompt(context: SummarizationContext): string {
    const { request, requester, organization, approvers } = context;
    
    const daysSinceCreated = Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const checklistProgress = this.calculateChecklistProgress(request);
    
    return `
Analyze this funding request and create a concise, action-ready summary for executives:

**REQUEST DETAILS:**
- Title: ${request.title}
- Amount: ${this.formatCurrency(request.amount)}
- Category: ${request.category}
- Requested by: ${requester.fullName} (${requester.jobTitle || 'Employee'})
- Department: ${requester.department || 'General'}
- Days pending: ${daysSinceCreated}
- Checklist progress: ${checklistProgress}%

**JUSTIFICATION:**
${request.description || 'No justification provided'}

**ORGANIZATION CONTEXT:**
- Company: ${organization.name}
- Approvers: ${approvers.map(a => a.fullName).join(', ')}

**REQUIRED OUTPUT FORMAT:**
Provide a JSON response with these exact fields:
{
  "summary": "One concise sentence summarizing the request",
  "bulletPoints": ["3 bullet points highlighting key aspects"],
  "keyInsights": ["2-3 business insights or concerns"],
  "urgency": "Low/Medium/High/Critical",
  "impact": "Brief description of business impact",
  "recommendation": "Clear recommendation: Approve/Reject/Review"
}

Focus on:
1. Business value and ROI
2. Urgency based on timing and business need
3. Risk assessment
4. Clear actionable recommendation
5. Key concerns or red flags

Keep responses concise and executive-ready.
    `.trim();
  }

  /**
   * Parse AI response into structured summary
   */
  private parseAIResponse(aiResponse: string, request: FundingRequest): AISummary {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      return {
        id: crypto.randomUUID(),
        requestId: request.id,
        summary: parsed.summary || this.extractSummary(aiResponse),
        bulletPoints: parsed.bulletPoints || this.extractBulletPoints(aiResponse),
        keyInsights: parsed.keyInsights || this.extractKeyInsights(aiResponse),
        urgency: this.parseUrgency(parsed.urgency || aiResponse),
        impact: parsed.impact || this.extractImpact(aiResponse),
        recommendation: parsed.recommendation || this.extractRecommendation(aiResponse),
        generatedAt: new Date(),
        model: 'gpt-3.5-turbo'
      };
    } catch (error) {
      // If JSON parsing fails, extract information using regex
      return {
        id: crypto.randomUUID(),
        requestId: request.id,
        summary: this.extractSummary(aiResponse),
        bulletPoints: this.extractBulletPoints(aiResponse),
        keyInsights: this.extractKeyInsights(aiResponse),
        urgency: this.parseUrgency(aiResponse),
        impact: this.extractImpact(aiResponse),
        recommendation: this.extractRecommendation(aiResponse),
        generatedAt: new Date(),
        model: 'gpt-3.5-turbo'
      };
    }
  }

  /**
   * Generate fallback summary when AI fails
   */
  private generateFallbackSummary(context: SummarizationContext): AISummary {
    const { request, requester } = context;
    const daysSinceCreated = Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: crypto.randomUUID(),
      requestId: request.id,
      summary: `${requester.fullName} requests ${this.formatCurrency(request.amount)} for ${request.title}`,
      bulletPoints: [
        `Amount: ${this.formatCurrency(request.amount)} for ${request.category}`,
        `Department: ${requester.department || 'General'}`,
        `Pending for ${daysSinceCreated} days`
      ],
      keyInsights: [
        'Manual review required due to AI processing error',
        'Standard approval workflow applies'
      ],
      urgency: daysSinceCreated > 7 ? 'High' : daysSinceCreated > 3 ? 'Medium' : 'Low',
      impact: 'Standard business process impact',
      recommendation: 'Review',
      generatedAt: new Date(),
      model: 'fallback'
    };
  }

  /**
   * Helper methods for text extraction
   */
  private extractSummary(text: string): string {
    const summaryMatch = text.match(/summary[:\s]+"([^"]+)"/i) || 
                        text.match(/summary[:\s]+([^\n]+)/i);
    return summaryMatch?.[1]?.trim() || 'Summary extraction failed';
  }

  private extractBulletPoints(text: string): string[] {
    const bulletMatches = text.match(/bulletPoints[:\s]*\[([^\]]+)\]/i);
    if (bulletMatches) {
      try {
        const bullets = JSON.parse(`[${bulletMatches[1]}]`);
        return Array.isArray(bullets) ? bullets : [];
      } catch (e) {
        // Fallback to regex extraction
        return text.match(/- ([^\n]+)/g)?.map(b => b.replace(/^- /, '').trim()) || [];
      }
    }
    return text.match(/- ([^\n]+)/g)?.map(b => b.replace(/^- /, '').trim()) || [];
  }

  private extractKeyInsights(text: string): string[] {
    const insightsMatch = text.match(/keyInsights[:\s]*\[([^\]]+)\]/i);
    if (insightsMatch) {
      try {
        const insights = JSON.parse(`[${insightsMatch[1]}]`);
        return Array.isArray(insights) ? insights : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  private extractImpact(text: string): string {
    const impactMatch = text.match(/impact[:\s]+"([^"]+)"/i) || 
                       text.match(/impact[:\s]+([^\n]+)/i);
    return impactMatch?.[1]?.trim() || 'Impact assessment unavailable';
  }

  private extractRecommendation(text: string): string {
    const recMatch = text.match(/recommendation[:\s]+"([^"]+)"/i) || 
                    text.match(/recommendation[:\s]+([^\n]+)/i);
    return recMatch?.[1]?.trim() || 'Review';
  }

  private parseUrgency(urgencyText: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const urgency = urgencyText.toLowerCase();
    if (urgency.includes('critical')) return 'Critical';
    if (urgency.includes('high')) return 'High';
    if (urgency.includes('medium')) return 'Medium';
    return 'Low';
  }

  private calculateChecklistProgress(request: FundingRequest): number {
    const totalItems = request.checklist?.length || 0;
    if (totalItems === 0) return 100;
    
    const completedItems = request.checklist?.filter((item: any) => item.completed).length || 0;
    return Math.round((completedItems / totalItems) * 100);
  }

  private isSummaryRecent(summary: AISummary, requestUpdatedAt: Date): boolean {
    // Consider summary recent if it was generated after the last request update
    return summary.generatedAt >= requestUpdatedAt;
  }

  /**
   * Get cached summary for a request
   */
  getSummary(requestId: string): AISummary | null {
    return this.summaries.get(requestId) || null;
  }

  /**
   * Clear summary cache for a request
   */
  clearSummary(requestId: string): void {
    this.summaries.delete(requestId);
  }

  /**
   * Get all cached summaries
   */
  getAllSummaries(): AISummary[] {
    return Array.from(this.summaries.values());
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Generate daily digest for an approver
   */
  async generateDailyDigest(approverId: string, requests: FundingRequest[]): Promise<{
    approverId: string;
    date: Date;
    requests: Array<{
      request: FundingRequest;
      summary: AISummary;
      checklistProgress: number;
    }>;
    totalAmount: number;
    urgentCount: number;
  }> {
    const today = new Date();
    const pendingRequests = requests.filter(r => r.status === 'Open' || r.status === 'Needs Info');
    
    const digestRequests = [];
    let totalAmount = 0;
    let urgentCount = 0;

    for (const request of pendingRequests) {
      const summary = this.getSummary(request.id);
      if (summary) {
        digestRequests.push({
          request,
          summary,
          checklistProgress: this.calculateChecklistProgress(request)
        });
        
        totalAmount += request.amount;
        if (summary.urgency === 'High' || summary.urgency === 'Critical') {
          urgentCount++;
        }
      }
    }

    return {
      approverId,
      date: today,
      requests: digestRequests,
      totalAmount,
      urgentCount
    };
  }
}

// Export singleton instance
export const aiSummarizer = new AISummarizerService();
