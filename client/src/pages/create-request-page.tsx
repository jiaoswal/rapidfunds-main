import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "../lib/database";
import { useLocation } from "wouter";
import { Plus, X, Upload } from "lucide-react";
import { nanoid } from "nanoid";
import { aiService } from "@/lib/aiService";
import { aiSummarizer } from "@/lib/aiSummarizer";
import DynamicApproverSelector from "@/components/dynamic-approver-selector";

const CATEGORIES = ["Equipment", "Software", "Marketing", "Travel", "Training", "Other"];

export default function CreateRequestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [approverId, setApproverId] = useState<string | string[]>("");
  const [checklistItems, setChecklistItems] = useState<{ id: string; item: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);


  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the request
      const res = await apiRequest("POST", "/api/requests", data);
      const createdRequest = await res.json();
      
      // Then generate AI summary if justification is provided
      if (data.description && data.description.trim()) {
        try {
          const orgRes = await apiRequest("GET", "/api/organization");
          const usersRes = await apiRequest("GET", "/api/users");
          const organization = await orgRes.json();
          const users = await usersRes.json();
          
          const context = {
            request: { ...createdRequest, ...data },
            requester: user!,
            organization: organization,
            approvers: users?.filter((u: User) => u.role === 'Admin' || u.role === 'Approver') || []
          };
          
          await aiSummarizer.generateSummary(context);
        } catch (error) {
          console.error('Error generating AI summary:', error);
          // Don't fail the request creation if AI summary fails
        }
      }
      
      return createdRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Success",
        description: "Funding request created successfully with AI summary",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([
        ...checklistItems,
        { id: nanoid(), item: newChecklistItem.trim(), completed: false },
      ]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) throw new Error("Upload failed");
        return await response.json();
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments([...attachments, ...uploadedFiles]);
      
      toast({
        title: "Success",
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setAttachments(attachments.filter((att) => att.url !== url));
  };

  const generateAISummary = async () => {
    if (!title || !description || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, description, and amount before generating AI summary.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSummary(true);
    try {
      // Create a mock request object for AI analysis
      const mockRequest = {
        id: 'temp',
        orgId: user?.orgId || '',
        requesterId: user?.id || '',
        title,
        description,
        amount: parseFloat(amount) || 0,
        category: category as any,
        customCategory: customCategory || undefined,
        status: 'Open' as const,
        currentApprovalLevel: 1,
        participants: [],
        attachments,
        checklist: checklistItems,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const summary = await aiService.generateRequestSummary(mockRequest);
      setAiSummary(summary.summary);
      
      toast({
        title: "AI Summary Generated",
        description: "Summary has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "AI Summary Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI summary.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description,
      amount: parseInt(amount),
      category,
      customCategory: category === "Other" ? customCategory : null,
      approverId: Array.isArray(approverId) ? approverId[0] || null : approverId || null,
      checklist: checklistItems,
      attachments,
      aiSummary: aiSummary || undefined,
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Create Funding Request</h1>
          <p className="text-muted-foreground mt-1">Submit a new request for approval</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Provide information about your funding request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  data-testid="input-title"
                  placeholder="e.g., New MacBook Pro for Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  data-testid="input-description"
                  placeholder="Explain why this funding is needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    data-testid="input-amount"
                    type="number"
                    placeholder="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} data-testid={`option-category-${cat.toLowerCase()}`}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {category === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Specify Category *</Label>
                  <Input
                    id="customCategory"
                    data-testid="input-custom-category"
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Please specify the category for this request
                  </p>
                </div>
              )}

              <DynamicApproverSelector
                value={approverId}
                onChange={setApproverId}
                required
                placeholder="Select Level 1 approver"
                error={!approverId && createMutation.isPending ? "Please select an approver" : undefined}
              />

              <div className="space-y-3">
                <Label>Checklist Items</Label>
                <div className="flex gap-2">
                  <Input
                    data-testid="input-checklist-item"
                    placeholder="Add a checklist item"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddChecklistItem}
                    data-testid="button-add-checklist"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {checklistItems.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-border rounded-md"
                        data-testid={`checklist-item-${item.id}`}
                      >
                        <span className="text-sm">{item.item}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          data-testid={`button-remove-checklist-${item.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Attachments</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      data-testid="input-file-upload"
                      className="flex-1"
                    />
                    {isUploading && (
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    )}
                  </div>
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file) => (
                        <div
                          key={file.url}
                          className="flex items-center justify-between p-3 border border-border rounded-md"
                          data-testid={`attachment-${file.name}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttachment(file.url)}
                            data-testid={`button-remove-attachment-${file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>AI Summary</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAISummary}
                    disabled={isGeneratingSummary || !title || !description || !amount}
                  >
                    {isGeneratingSummary ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                        Generating...
                      </>
                    ) : (
                      "Generate Summary"
                    )}
                  </Button>
                </div>
                
                {aiSummary ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-md">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                          AI-Generated Summary
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {aiSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-primary rounded-md">
                    <p className="text-sm italic text-muted-foreground">
                      Fill in the request details above and click "Generate Summary" to get an AI-powered analysis of your funding request.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-submit-request"
            >
              {createMutation.isPending ? "Creating..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
