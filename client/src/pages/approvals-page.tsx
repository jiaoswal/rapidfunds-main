import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FundingRequest, User, QueryMessage, ApprovalHistory, Organization } from "../lib/database";
import { CheckCircle, XCircle, MessageSquare, FileText, History, Clock, Brain } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AISummaryComponent from "@/components/ai-summary";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<FundingRequest | null>(null);
  const [comment, setComment] = useState("");

  const { data: requests, isLoading } = useQuery<FundingRequest[]>({
    queryKey: ["/api/requests"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  const { data: messages } = useQuery<QueryMessage[]>({
    queryKey: selectedRequest ? ["/api/requests", selectedRequest.id, "messages"] : [],
    enabled: !!selectedRequest,
  });

  const { data: approvalHistory = [] } = useQuery<ApprovalHistory[]>({
    queryKey: selectedRequest ? ["/api/requests", selectedRequest.id, "approval-history"] : [],
    enabled: !!selectedRequest,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, comments, isFastTrack }: { id: string; status: string; comments?: string; isFastTrack?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/requests/${id}/status`, { status, comments, isFastTrack });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      if (data.message) {
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        toast({
          title: "Success",
          description: "Request status updated",
        });
      }
      setSelectedRequest(null);
      setComment("");
    },
  });

  const addMessageMutation = useMutation({
    mutationFn: async (data: { requestId: string; content: string }) => {
      const res = await apiRequest("POST", `/api/requests/${data.requestId}/messages`, {
        content: data.content,
        messageType: "text",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", selectedRequest?.id, "messages"] });
      setComment("");
      toast({
        title: "Message sent",
        description: "Your message has been posted",
      });
    },
  });

  const openRequests = requests?.filter((r) => r.status === "Open") || [];
  const approvedRequests = requests?.filter((r) => r.status === "Approved") || [];
  const rejectedRequests = requests?.filter((r) => r.status === "Rejected") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
      case "Pending":
        return <Badge className="bg-pending text-pending-foreground">Open</Badge>;
      case "Approved":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "Needs Info":
        return <Badge variant="secondary">Needs Info</Badge>;
      case "Closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const foundUser = users?.find((u) => u.id === userId);
    return foundUser?.fullName || "Unknown";
  };

  const RequestCard = ({ request }: { request: FundingRequest }) => (
    <Card className="hover-elevate" data-testid={`card-request-${request.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg" data-testid={`text-request-title-${request.id}`}>{request.title}</CardTitle>
            <CardDescription className="mt-1">
              Requested by: {getUserName(request.requesterId)}
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{request.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-foreground">₹{request.amount.toLocaleString()}</span>
          <span className="text-muted-foreground">{request.category}</span>
          <span className="text-muted-foreground">
            {new Date(request.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        {/* AI Summary Quick Indicator */}
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          <Brain className="h-3 w-3" />
          <span>AI Summary Available</span>
        </div>
        {request.checklist && request.checklist.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Checklist:</p>
            <ul className="space-y-1">
              {request.checklist.map((item) => (
                <li key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  {item.item}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => setSelectedRequest(request)}
            data-testid={`button-view-details-${request.id}`}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {request.status === "Open" && (user?.role === "Approver" || user?.role === "Admin") && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-success text-success hover:bg-success/10"
                onClick={() => updateStatusMutation.mutate({ id: request.id, status: "Approved" })}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-approve-${request.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => updateStatusMutation.mutate({ id: request.id, status: "Rejected" })}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-reject-${request.id}`}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Approvals</h1>
          <p className="text-muted-foreground mt-1">Review and manage funding requests</p>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList>
            <TabsTrigger value="open" data-testid="tab-open">
              Open ({openRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : openRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No open requests</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {openRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No approved requests</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {approvedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedRequests.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No rejected requests</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {rejectedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              Request details and comments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedRequest?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Amount</h4>
                <p className="text-2xl font-bold text-primary">
                  ₹{selectedRequest?.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Category</h4>
                <Badge variant="secondary">{selectedRequest?.category}</Badge>
              </div>
            </div>

            {/* AI Summary Component */}
            {selectedRequest && users && organization && (
              <AISummaryComponent
                request={selectedRequest}
                requester={users.find(u => u.id === selectedRequest.requesterId) || users[0]}
                organization={organization}
                approvers={users.filter(u => u.role === 'Admin' || u.role === 'Approver')}
                className="mt-6"
              />
            )}
            
            {/* Approval History Timeline */}
            {approvalHistory.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Approval History
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {approvalHistory.map((entry, idx) => (
                    <div 
                      key={entry.id} 
                      className="p-3 border-l-4 border-primary bg-muted/50 rounded-md"
                      data-testid={`approval-history-${entry.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Level {entry.level} - {entry.action}
                            {entry.isFastTrack && (
                              <Badge variant="secondary" className="ml-2 text-xs">Fast Track</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            By: {getUserName(entry.approverId)}
                          </p>
                          {entry.comments && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              "{entry.comments}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Messages</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {messages && messages.length > 0 ? (
                  messages.map((m) => (
                    <div key={m.id} className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">{getUserName(m.userId || '')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{m.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Add Message</Label>
              <Textarea
                id="comment"
                data-testid="input-comment"
                placeholder="Write your message..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <Button
                onClick={() =>
                  selectedRequest &&
                  addMessageMutation.mutate({
                    requestId: selectedRequest.id,
                    content: comment,
                  })
                }
                disabled={!comment.trim() || addMessageMutation.isPending}
                data-testid="button-add-comment"
              >
                Send Message
              </Button>
            </div>

            {/* Admin Fast-Track Approval */}
            {user?.role === "Admin" && selectedRequest?.status === "Open" && (
              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-3 text-sm">Admin Actions (Fast Track)</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  As an admin, you can fast-track approval to bypass multi-level workflows
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => 
                      selectedRequest &&
                      updateStatusMutation.mutate({ 
                        id: selectedRequest.id, 
                        status: "Approved",
                        comments: comment || undefined,
                        isFastTrack: true
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-fast-track-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Fast-Track Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => 
                      selectedRequest &&
                      updateStatusMutation.mutate({ 
                        id: selectedRequest.id, 
                        status: "Rejected",
                        comments: comment || undefined,
                        isFastTrack: true
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-fast-track-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Fast-Track Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
