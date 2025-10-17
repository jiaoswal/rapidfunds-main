import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FundingRequest, User, Organization } from '@/lib/database';
import { aiSummaryService, AISummary } from '@/lib/aiSummaryService';

interface AISummaryProps {
  request: FundingRequest;
  requester: User;
  organization: Organization;
  approvers: User[];
  className?: string;
}

export const AISummaryComponent: React.FC<AISummaryProps> = ({
  request,
  requester,
  organization,
  approvers,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate or fetch summary
  const generateSummary = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const newSummary = await aiSummaryService.generateSummary({
        request,
        requester,
        organization,
        approvers
      });
      
      setSummary(newSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  // Load existing summary on mount
  useEffect(() => {
    const existingSummary = aiSummaryService.getSummary(request.id);
    if (existingSummary) {
      setSummary(existingSummary);
    }
  }, [request.id]);

  // Regenerate summary when request data changes
  useEffect(() => {
    if (isExpanded) {
      // Check if summary needs updating
      if (aiSummaryService.needsUpdate(request.id, request.updatedAt)) {
        console.log(`🔄 Auto-updating AI summary for request ${request.id}`);
        generateSummary();
      } else if (!summary) {
        generateSummary();
      }
    }
  }, [request.updatedAt, isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !summary) {
      generateSummary();
    }
  };

  const handleRefresh = () => {
    aiSummaryService.clearSummary(request.id);
    generateSummary();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChecklistStatusColor = (status: string) => {
    if (status.includes('All items completed')) {
      return 'bg-green-100 text-green-800';
    } else if (status.includes('Partially completed')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status.includes('Not started')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              AI Summary
            </CardTitle>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          
          <div className="flex items-center gap-2">
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isGenerating}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Summary
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View AI Summary
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Generating AI summary...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Failed to generate summary</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSummary}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              {/* Main Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-blue-900 leading-relaxed">{summary.summary}</p>
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-3">
                {summary.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-semibold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ 
                        __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Request Timeline
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Created: {request.createdAt.toLocaleDateString()}</p>
                    <p>Last Updated: {request.updatedAt.toLocaleDateString()}</p>
                    <p>Days Pending: {Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24))}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Quick Stats
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getUrgencyColor(
                      Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)) <= 1 ? 'high' :
                      Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)) <= 3 ? 'medium' : 'low'
                    )}>
                      {Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)) <= 1 ? 'High Priority' :
                       Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)) <= 3 ? 'Medium Priority' : 'Low Priority'}
                    </Badge>
                    <Badge variant="outline" className={getChecklistStatusColor(
                      request.checklist?.filter((item: any) => item.completed).length === request.checklist?.length ? 'All items completed' :
                      (request.checklist?.filter((item: any) => item.completed).length || 0) > 0 ? 'Partially completed' : 'Not started'
                    )}>
                      {request.checklist?.filter((item: any) => item.completed).length === request.checklist?.length ? 'Complete' :
                       (request.checklist?.filter((item: any) => item.completed).length || 0) > 0 ? 'Partial' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Generated Info */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  AI summary generated on {summary.generatedAt.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No summary available</p>
              <Button onClick={generateSummary} disabled={isGenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Summary
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AISummaryComponent;
