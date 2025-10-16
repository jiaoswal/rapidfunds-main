import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Organization, InviteToken, ApprovalChain, User } from "../lib/database";
import { Settings, Palette, Plus, X, CheckCircle, Upload, Image, Link2, Copy, Trash2, GitBranch, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Redirect } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  const { data: inviteTokens = [] } = useQuery<InviteToken[]>({
    queryKey: ["/api/invite-tokens"],
  });

  const { data: approvalChains = [] } = useQuery<ApprovalChain[]>({
    queryKey: ["/api/approval-chains"],
  });

  const { data: approvers = [] } = useQuery<User[]>({
    queryKey: ["/api/approvers"],
  });

  const [orgName, setOrgName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0EA5E9");
  const [secondaryColor, setSecondaryColor] = useState("#10B981");
  const [newFieldName, setNewFieldName] = useState("");
  const [customFields, setCustomFields] = useState<{ name: string; type: string; required: boolean }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Requester");
  const [expiresInDays, setExpiresInDays] = useState<string>("7");
  const [baseUrl, setBaseUrl] = useState<string>("");
  
  // Approval chains state
  const [chainName, setChainName] = useState("");
  const [chainDepartment, setChainDepartment] = useState("");
  const [chainCategory, setChainCategory] = useState("");
  const [chainLevels, setChainLevels] = useState<{ level: number; approverId: string; approverName: string }[]>([
    { level: 1, approverId: "", approverName: "" }
  ]);

  useEffect(() => {
    // Set base URL only on client side
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setLogoUrl(organization.logoUrl || null);
      setPrimaryColor(organization.primaryColor || "#0EA5E9");
      setSecondaryColor(organization.secondaryColor || "#10B981");
      setCustomFields(organization.customFields || []);
    }
  }, [organization]);

  const updateOrgMutation = useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      const res = await apiRequest("PATCH", "/api/organization", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
      toast({
        title: "Settings saved",
        description: "Organization settings updated successfully",
      });
    },
  });

  const createInviteTokenMutation = useMutation({
    mutationFn: async (data: { role: string; expiresInDays: number }) => {
      const res = await apiRequest("POST", "/api/invite-tokens", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invite-tokens"] });
      toast({
        title: "Invite link created",
        description: "Secure invite link generated successfully",
      });
    },
  });

  const deleteInviteTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      await apiRequest("DELETE", `/api/invite-tokens/${tokenId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invite-tokens"] });
      toast({
        title: "Invite link deleted",
        description: "Invite link has been revoked",
      });
    },
  });

  const createApprovalChainMutation = useMutation({
    mutationFn: async (data: { name: string; department: string | null; category: string | null; levels: any[] }) => {
      const res = await apiRequest("POST", "/api/approval-chains", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-chains"] });
      toast({
        title: "Approval chain created",
        description: "Multi-level approval workflow configured successfully",
      });
      // Reset form
      setChainName("");
      setChainDepartment("");
      setChainCategory("");
      setChainLevels([{ level: 1, approverId: "", approverName: "" }]);
    },
  });

  const deleteApprovalChainMutation = useMutation({
    mutationFn: async (chainId: string) => {
      await apiRequest("DELETE", `/api/approval-chains/${chainId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-chains"] });
      toast({
        title: "Approval chain deleted",
        description: "Approval workflow has been removed",
      });
    },
  });

  if (user?.role !== "Admin") {
    return <Redirect to="/dashboard" />;
  }

  const handleAddCustomField = () => {
    if (newFieldName.trim()) {
      const updatedFields = [
        ...customFields,
        { name: newFieldName.trim(), type: "text", required: false },
      ];
      setCustomFields(updatedFields);
      updateOrgMutation.mutate({ customFields: updatedFields });
      setNewFieldName("");
    }
  };

  const handleRemoveCustomField = (index: number) => {
    const updatedFields = customFields.filter((_, i) => i !== index);
    setCustomFields(updatedFields);
    updateOrgMutation.mutate({ customFields: updatedFields });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setLogoUrl(data.logoUrl);
      updateOrgMutation.mutate({ logoUrl: data.logoUrl });
      toast({
        title: "Logo uploaded",
        description: "Organization logo updated successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBranding = () => {
    updateOrgMutation.mutate({
      name: orgName,
      logoUrl: logoUrl || undefined,
      primaryColor,
      secondaryColor,
    });
  };

  const handleCreateInviteToken = () => {
    createInviteTokenMutation.mutate({
      role: selectedRole,
      expiresInDays: parseInt(expiresInDays) || 7,
    });
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${baseUrl}/join?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const handleDeleteToken = (tokenId: string) => {
    if (confirm("Are you sure you want to revoke this invite link?")) {
      deleteInviteTokenMutation.mutate(tokenId);
    }
  };

  const handleAddLevel = () => {
    const nextLevel = chainLevels.length + 1;
    setChainLevels([...chainLevels, { level: nextLevel, approverId: "", approverName: "" }]);
  };

  const handleRemoveLevel = (level: number) => {
    if (chainLevels.length > 1) {
      setChainLevels(chainLevels.filter(l => l.level !== level).map((l, i) => ({ ...l, level: i + 1 })));
    }
  };

  const handleUpdateLevelApprover = (level: number, approverId: string) => {
    const approver = approvers.find(a => a.id === approverId);
    setChainLevels(chainLevels.map(l => 
      l.level === level 
        ? { ...l, approverId, approverName: approver?.fullName || "" } 
        : l
    ));
  };

  const handleCreateChain = () => {
    if (!chainName.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a name for the approval chain",
        variant: "destructive",
      });
      return;
    }

    const invalidLevel = chainLevels.find(l => !l.approverId);
    if (invalidLevel) {
      toast({
        title: "Validation error",
        description: `Please select an approver for Level ${invalidLevel.level}`,
        variant: "destructive",
      });
      return;
    }

    createApprovalChainMutation.mutate({
      name: chainName,
      department: chainDepartment || null,
      category: chainCategory || null,
      levels: chainLevels,
    });
  };

  const handleDeleteChain = (chainId: string) => {
    if (confirm("Are you sure you want to delete this approval chain?")) {
      deleteApprovalChainMutation.mutate(chainId);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Admin Settings</h1>
            <p className="text-muted-foreground mt-1">Manage organization settings and customization</p>
          </div>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList>
            <TabsTrigger value="branding" data-testid="tab-branding">Branding</TabsTrigger>
            <TabsTrigger value="fields" data-testid="tab-fields">Custom Fields</TabsTrigger>
            <TabsTrigger value="chains" data-testid="tab-chains">Approval Chains</TabsTrigger>
            <TabsTrigger value="invite" data-testid="tab-invite">Invite Links</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Organization Branding
                </CardTitle>
                <CardDescription>Customize your organization's appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    data-testid="input-org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="My Organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Organization Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 rounded-md">
                      {logoUrl ? (
                        <AvatarImage src={logoUrl} alt="Organization logo" />
                      ) : (
                        <AvatarFallback className="rounded-md bg-muted">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        data-testid="input-logo-file"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        data-testid="button-upload-logo"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or WEBP. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        data-testid="input-primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input value={primaryColor} readOnly className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        data-testid="input-secondary-color"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input value={secondaryColor} readOnly className="flex-1" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Preview</h4>
                  <div className="flex gap-3">
                    <div
                      className="h-12 w-12 rounded-lg"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div
                      className="h-12 w-12 rounded-lg"
                      style={{ backgroundColor: secondaryColor }}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveBranding}
                  disabled={updateOrgMutation.isPending}
                  data-testid="button-save-branding"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {updateOrgMutation.isPending ? "Saving..." : "Save Branding"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fields" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Onboarding Fields</CardTitle>
                <CardDescription>Add custom fields to the user registration form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    data-testid="input-custom-field"
                    placeholder="Field name (e.g., Department, Employee ID)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomField())}
                  />
                  <Button
                    onClick={handleAddCustomField}
                    disabled={!newFieldName.trim() || updateOrgMutation.isPending}
                    data-testid="button-add-field"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {customFields.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-medium">Current Fields:</h4>
                    {customFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-md"
                        data-testid={`custom-field-${index}`}
                      >
                        <div>
                          <span className="font-medium">{field.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({field.type})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCustomField(index)}
                          disabled={updateOrgMutation.isPending}
                          data-testid={`button-remove-field-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    No custom fields added yet. Add fields to customize your onboarding process.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chains" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Multi-Level Approval Chains
                </CardTitle>
                <CardDescription>Configure approval workflows with multiple approval levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Create New Approval Chain</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="chain-name">Chain Name *</Label>
                      <Input
                        id="chain-name"
                        data-testid="input-chain-name"
                        placeholder="e.g., IT Department Approval"
                        value={chainName}
                        onChange={(e) => setChainName(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="chain-department">Department (Optional)</Label>
                        <Input
                          id="chain-department"
                          data-testid="input-chain-department"
                          placeholder="e.g., IT, Finance, HR"
                          value={chainDepartment}
                          onChange={(e) => setChainDepartment(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="chain-category">Category (Optional)</Label>
                        <Input
                          id="chain-category"
                          data-testid="input-chain-category"
                          placeholder="e.g., Equipment, Travel, Software"
                          value={chainCategory}
                          onChange={(e) => setChainCategory(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Approval Levels *</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAddLevel}
                          data-testid="button-add-level"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Level
                        </Button>
                      </div>

                      {chainLevels.map((level) => (
                        <div
                          key={level.level}
                          className="flex items-center gap-3 p-3 border border-border rounded-md"
                          data-testid={`approval-level-${level.level}`}
                        >
                          <div className="flex items-center gap-2 min-w-24">
                            <span className="font-medium text-sm">Level {level.level}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <Select
                              value={level.approverId}
                              onValueChange={(value) => handleUpdateLevelApprover(level.level, value)}
                            >
                              <SelectTrigger data-testid={`select-approver-level-${level.level}`}>
                                <SelectValue placeholder="Select approver" />
                              </SelectTrigger>
                              <SelectContent>
                                {approvers.map((approver) => (
                                  <SelectItem
                                    key={approver.id}
                                    value={approver.id}
                                    data-testid={`option-approver-${approver.id}`}
                                  >
                                    {approver.fullName} ({approver.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {chainLevels.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLevel(level.level)}
                              data-testid={`button-remove-level-${level.level}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleCreateChain}
                      disabled={createApprovalChainMutation.isPending}
                      data-testid="button-create-chain"
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Approval Chain
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="font-medium mb-4">Existing Approval Chains</h4>
                  {approvalChains.length > 0 ? (
                    <div className="space-y-3">
                      {approvalChains.map((chain) => (
                        <div
                          key={chain.id}
                          className="p-4 border border-border rounded-md space-y-2"
                          data-testid={`chain-${chain.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{chain.name}</h5>
                              <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                                {chain.department && (
                                  <span className="px-2 py-0.5 bg-muted rounded">
                                    Dept: {chain.department}
                                  </span>
                                )}
                                {chain.category && (
                                  <span className="px-2 py-0.5 bg-muted rounded">
                                    Cat: {chain.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteChain(chain.id)}
                              data-testid={`button-delete-chain-${chain.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {chain.levels.map((lvl, idx) => (
                              <div key={lvl.level} className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                                  L{lvl.level}: {lvl.approverName}
                                </span>
                                {idx < chain.levels.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No approval chains configured yet. Create one to enable multi-level approval workflows.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invite" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Secure Invite Links
                </CardTitle>
                <CardDescription>Generate secure, role-specific invite links for new team members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Create New Invite Link</h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="invite-role" className="text-sm mb-2">Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger id="invite-role" data-testid="select-invite-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Requester">Requester</SelectItem>
                          <SelectItem value="Approver">Approver</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label htmlFor="expires-days" className="text-sm mb-2">Expires in</Label>
                      <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                        <SelectTrigger id="expires-days" data-testid="select-expires-days">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleCreateInviteToken}
                        disabled={createInviteTokenMutation.isPending}
                        data-testid="button-create-invite"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Link
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Active Invite Links</h4>
                  {inviteTokens.length > 0 ? (
                    <div className="space-y-3">
                      {inviteTokens.map((token) => {
                        const isExpired = new Date(token.expiresAt) < new Date();
                        const isUsed = !!token.usedAt;
                        
                        return (
                          <div
                            key={token.id}
                            className="p-4 border border-border rounded-lg space-y-2"
                            data-testid={`invite-token-${token.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm">{token.role}</span>
                                  {isUsed && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                                      Used
                                    </span>
                                  )}
                                  {isExpired && !isUsed && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
                                      Expired
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {baseUrl}/join?token={token.token}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyInviteLink(token.token)}
                                    data-testid={`button-copy-invite-${token.id}`}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Expires: {format(new Date(token.expiresAt), "MMM d, yyyy")}
                                  {isUsed && ` • Used on ${format(new Date(token.usedAt!), "MMM d, yyyy")}`}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteToken(token.id)}
                                disabled={deleteInviteTokenMutation.isPending}
                                data-testid={`button-delete-invite-${token.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No invite links created yet. Generate a link above to invite new users.
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Alternative: Organization Code</h4>
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono bg-background px-3 py-2 rounded border flex-1" data-testid="text-org-code">
                        {organization?.orgCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(organization?.orgCode || "");
                          toast({ title: "Copied!", description: "Organization code copied to clipboard" });
                        }}
                        data-testid="button-copy-code"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Users can also join by entering this code manually during registration
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
