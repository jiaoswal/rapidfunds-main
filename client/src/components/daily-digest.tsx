import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { aiSummarizer, AISummary } from '@/lib/aiSummarizer';
import { FundingRequest, User } from '@/lib/database';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  Brain,
  ChevronRight,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyDigestProps {
  approverId: string;
  className?: string;
}

interface DigestRequest {
  request: FundingRequest;
  summary: AISummary;
  checklistProgress: number;
}

export const DailyDigest: React.FC<DailyDigestProps> = ({ approverId, className }) => {
  const { toast } = useToast();
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);

  // Fetch pending requests
  const { data: requests, isLoading } = useQuery<FundingRequest[]>({
    queryKey: ['/api/requests'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Generate digest data
  const [digestData, setDigestData] = useState<{
    requests: DigestRequest[];
    totalAmount: number;
    urgentCount: number;
  } | null>(null);

  const generateDigest = async () => {
    if (!requests) return;

    setIsGeneratingDigest(true);
    try {
      const digest = await aiSummarizer.generateDailyDigest(approverId, requests);
      setDigestData({
        requests: digest.requests,
        totalAmount: digest.totalAmount,
        urgentCount: digest.urgentCount
      });
    } catch (error) {
      console.error('Error generating digest:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate daily digest',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  useEffect(() => {
    if (requests) {
      generateDigest();
    }
  }, [requests, approverId]);

  // Quick approval mutations
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: string; comments?: string }) => {
      const res = await apiRequest('PATCH', `/api/requests/${requestId}/status`, {
        status: 'Approved',
        comments: comments || 'Quick approved via daily digest'
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      toast({
        title: 'Success',
        description: 'Request approved successfully',
      });
      generateDigest(); // Refresh digest
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: string; comments?: string }) => {
      const res = await apiRequest('PATCH', `/api/requests/${requestId}/status`, {
        status: 'Rejected',
        comments: comments || 'Quick rejected via daily digest'
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      toast({
        title: 'Success',
        description: 'Request rejected',
      });
      generateDigest(); // Refresh digest
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    },
  });

  const needsInfoMutation = useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: string; comments?: string }) => {
      const res = await apiRequest('PATCH', `/api/requests/${requestId}/status`, {
        status: 'Needs Info',
        comments: comments || 'Additional information requested via daily digest'
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      toast({
        title: 'Success',
        description: 'Request marked as needs info',
      });
      generateDigest(); // Refresh digest
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update request',
        variant: 'destructive',
      });
    },
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('approve')) return 'text-green-600';
    if (rec.includes('reject')) return 'text-red-600';
    if (rec.includes('review')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!digestData || digestData.requests.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Daily Digest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending requests requiring your attention.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Daily Digest
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateDigest}
            disabled={isGeneratingDigest}
          >
            {isGeneratingDigest ? 'Generating...' : 'Refresh'}
          </Button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{digestData.requests.length}</div>
            <div className="text-sm text-blue-800">Pending Requests</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(digestData.totalAmount)}</div>
            <div className="text-sm text-green-800">Total Amount</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{digestData.urgentCount}</div>
            <div className="text-sm text-orange-800">Urgent Items</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {digestData.requests.map((digestRequest) => {
          const { request, summary, checklistProgress } = digestRequest;
          const requester = users?.find(u => u.id === request.requesterId);
          const daysPending = Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{request.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(request.amount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {requester?.fullName || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {daysPending} days
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getUrgencyColor(summary.urgency)}>
                    {summary.urgency}
                  </Badge>
                  <Badge variant="outline">
                    {request.category}
                  </Badge>
                </div>
              </div>

              {/* AI Summary */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">AI Summary</span>
                </div>
                <p className="text-sm text-blue-900 mb-2">{summary.summary}</p>
                
                {summary.bulletPoints.length > 0 && (
                  <ul className="text-sm text-blue-800 space-y-1">
                    {summary.bulletPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Key Insights */}
              {summary.keyInsights.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Key Insights</span>
                  </div>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {summary.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Progress and Recommendation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{checklistProgress}%</span>
                  </div>
                  <Progress value={checklistProgress} className="h-2" />
                </div>
                
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">AI Recommendation</div>
                  <div className={cn("text-sm font-semibold", getRecommendationColor(summary.recommendation))}>
                    {summary.recommendation}
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => approveMutation.mutate({ requestId: request.id })}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Quick Approve
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={() => needsInfoMutation.mutate({ requestId: request.id })}
                  disabled={needsInfoMutation.isPending}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Needs Info
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => rejectMutation.mutate({ requestId: request.id })}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/approvals`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DailyDigest;
