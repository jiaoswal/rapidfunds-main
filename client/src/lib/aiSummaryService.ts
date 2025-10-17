import { FundingRequest, User, Organization } from './database';

export interface AISummary {
  id: string;
  requestId: string;
  summary: string;
  bulletPoints: string[];
  generatedAt: Date;
  lastUpdated: Date;
}

export interface SummaryRequest {
  request: FundingRequest;
  requester: User;
  organization: Organization;
  approvers: User[];
}

class AISummaryService {
  private summaries: Map<string, AISummary> = new Map();

  /**
   * Generate an AI summary for a funding request
   */
  async generateSummary(summaryRequest: SummaryRequest): Promise<AISummary> {
    const { request, requester, organization, approvers } = summaryRequest;
    
    // Check if we already have a recent summary for this request
    const existingSummary = this.summaries.get(request.id);
    if (existingSummary && existingSummary.lastUpdated >= request.updatedAt) {
      return existingSummary;
    }

    // If request was updated after the last summary, we need to regenerate
    if (existingSummary && request.updatedAt > existingSummary.lastUpdated) {
      console.log(`🔄 Regenerating AI summary for request ${request.id} due to data changes`);
    }

    // Generate the summary
    const summary = this.createSummaryText(request, requester, organization);
    const bulletPoints = this.createBulletPoints(request, requester, organization);

    const aiSummary: AISummary = {
      id: crypto.randomUUID(),
      requestId: request.id,
      summary,
      bulletPoints,
      generatedAt: new Date(),
      lastUpdated: new Date()
    };

    // Cache the summary
    this.summaries.set(request.id, aiSummary);
    
    return aiSummary;
  }

  /**
   * Create the main summary text
   */
  private createSummaryText(request: FundingRequest, requester: User, organization: Organization): string {
    const amount = this.formatCurrency(request.amount);
    const department = requester.department || 'General';
    const urgency = this.getUrgencyLevel(request);
    
    return `${requester.fullName} from ${department} is requesting ${amount} for ${request.title}. This ${urgency} priority request involves ${request.category} and requires approval from level ${request.currentApprovalLevel} approvers.`;
  }

  /**
   * Create bullet points for the summary
   */
  private createBulletPoints(request: FundingRequest, requester: User, organization: Organization): string[] {
    const amount = this.formatCurrency(request.amount);
    const department = requester.department || 'General';
    const checklistStatus = this.getChecklistStatus(request);
    const justification = this.getJustificationSummary(request);

    return [
      `💰 **Amount & Purpose**: ${amount} for ${request.title} in ${department}`,
      `📋 **Status**: ${checklistStatus} - ${this.getProgressPercentage(request)}% complete`,
      `📝 **Justification**: ${justification}`
    ];
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
   * Get urgency level based on request data
   */
  private getUrgencyLevel(request: FundingRequest): string {
    const daysSinceCreated = Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreated <= 1) {
      return 'high';
    } else if (daysSinceCreated <= 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get checklist completion status
   */
  private getChecklistStatus(request: FundingRequest): string {
    const totalItems = request.checklist?.length || 0;
    const completedItems = request.checklist?.filter((item: any) => item.completed).length || 0;
    
    if (totalItems === 0) {
      return 'No checklist items';
    }
    
    if (completedItems === totalItems) {
      return 'All items completed';
    } else if (completedItems > 0) {
      return 'Partially completed';
    } else {
      return 'Not started';
    }
  }

  /**
   * Get progress percentage
   */
  private getProgressPercentage(request: FundingRequest): number {
    const totalItems = request.checklist?.length || 0;
    if (totalItems === 0) return 100;
    
    const completedItems = request.checklist?.filter((item: any) => item.completed).length || 0;
    return Math.round((completedItems / totalItems) * 100);
  }

  /**
   * Get justification summary
   */
  private getJustificationSummary(request: FundingRequest): string {
    const justification = request.description || '';
    
    if (!justification) {
      return 'No justification provided';
    }
    
    // Truncate to 100 characters and add ellipsis if needed
    if (justification.length <= 100) {
      return justification;
    }
    
    return justification.substring(0, 97) + '...';
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
   * Clear all summaries
   */
  clearAllSummaries(): void {
    this.summaries.clear();
  }

  /**
   * Get all cached summaries
   */
  getAllSummaries(): AISummary[] {
    return Array.from(this.summaries.values());
  }

  /**
   * Check if a summary needs to be updated for a request
   */
  needsUpdate(requestId: string, requestUpdatedAt: Date): boolean {
    const existingSummary = this.summaries.get(requestId);
    if (!existingSummary) return true;
    
    return requestUpdatedAt > existingSummary.lastUpdated;
  }

  /**
   * Force update a summary for a request
   */
  async forceUpdateSummary(summaryRequest: SummaryRequest): Promise<AISummary> {
    const { request } = summaryRequest;
    
    // Clear existing summary
    this.clearSummary(request.id);
    
    // Generate new summary
    return await this.generateSummary(summaryRequest);
  }
}

// Export singleton instance
export const aiSummaryService = new AISummaryService();
