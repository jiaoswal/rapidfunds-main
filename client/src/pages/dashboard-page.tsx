import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { FileText, TrendingUp, Clock, CheckCircle, DollarSign } from "lucide-react";
import { FundingRequest, Organization } from "../lib/database";
import { aiService } from "@/lib/aiService";
import { useState } from "react";
import { DashboardLoading, LoadingSkeleton } from "@/components/loading";
import DailyDigest from "@/components/daily-digest";

export default function DashboardPage() {
  const { user } = useAuth();
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const { data: requests, isLoading: requestsLoading } = useQuery<FundingRequest[]>({
    queryKey: ["/api/requests"],
  });

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  const pendingCount = requests?.filter((r) => r.status === "Open").length || 0;
  const approvedCount = requests?.filter((r) => r.status === "Approved").length || 0;
  const rejectedCount = requests?.filter((r) => r.status === "Rejected").length || 0;

  const totalAmount = requests?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const approvedAmount = requests?.filter((r) => r.status === "Approved").reduce((sum, r) => sum + r.amount, 0) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-pending text-pending-foreground" data-testid={`badge-status-pending`}>Pending</Badge>;
      case "Approved":
        return <Badge className="bg-success text-success-foreground" data-testid={`badge-status-approved`}>Approved</Badge>;
      case "Rejected":
        return <Badge variant="destructive" data-testid={`badge-status-rejected`}>Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const recentRequests = requests?.slice(0, 5) || [];

  const generateAIInsights = async () => {
    if (!requests || requests.length === 0) return;
    
    setIsGeneratingInsights(true);
    try {
      const insights = await aiService.generateInsights(requests);
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (requestsLoading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Dashboard</h1>
            <p className="text-muted-foreground mt-1" data-testid="text-org-name">
              {organization?.name || "Loading..."}
            </p>
          </div>
          <Button asChild data-testid="button-new-request">
            <Link href="/create-request">
              <FileText className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <LoadingSkeleton lines={2} />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-requests">{requests?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pending" data-testid="text-pending-count">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success" data-testid="text-approved-count">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">₹{approvedAmount.toLocaleString()} funded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-amount">₹{totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Requested</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your latest funding requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No requests yet</p>
                <Button asChild className="mt-4" variant="outline" data-testid="button-create-first-request">
                  <Link href="/create-request">Create your first request</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover-elevate"
                    data-testid={`card-request-${request.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-foreground" data-testid={`text-request-title-${request.id}`}>{request.title}</h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{request.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">₹{request.amount.toLocaleString()}</span>
                        </span>
                        <span className="text-sm text-muted-foreground">{request.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Digest for Approvers */}
        {(user?.role === 'Admin' || user?.role === 'Approver') && (
          <DailyDigest 
            approverId={user.id} 
            className="mb-6"
          />
        )}

        {/* AI Insights Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Get AI-powered insights about your funding requests
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIInsights}
                disabled={isGeneratingInsights || !requests || requests.length === 0}
              >
                {isGeneratingInsights ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    Analyzing...
                  </>
                ) : (
                  "Generate Insights"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiInsights.length > 0 ? (
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {requests && requests.length > 0 
                    ? "Click 'Generate Insights' to get AI-powered analysis of your funding requests."
                    : "Create some funding requests to generate AI insights."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
