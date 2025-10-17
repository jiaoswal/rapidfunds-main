import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  User, 
  Users, 
  Building2,
  Trash2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User as UserType, OrgChartNode } from '@/lib/database';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface AdminOrgChartManagerProps {
  className?: string;
}

const LEVEL_COLORS = {
  0: 'bg-blue-100 border-blue-300 text-blue-900',
  1: 'bg-blue-100 border-blue-300 text-blue-900',
  2: 'bg-green-100 border-green-300 text-green-900',
  3: 'bg-gray-100 border-gray-300 text-gray-900',
  4: 'bg-orange-100 border-orange-300 text-orange-900',
  5: 'bg-purple-100 border-purple-300 text-purple-900',
};

const LEVEL_NAMES = {
  0: 'CEO',
  1: 'L1',
  2: 'L2', 
  3: 'L3',
  4: 'L4',
  5: 'L5',
};

interface HierarchyNode extends OrgChartNode {
  children: HierarchyNode[];
}

export default function AdminOrgChartManager({ className }: AdminOrgChartManagerProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedParentNode, setSelectedParentNode] = useState<OrgChartNode | null>(null);
  const [availableMembers, setAvailableMembers] = useState<UserType[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch org chart nodes
  const { data: nodes, isLoading: isLoadingNodes } = useQuery<OrgChartNode[]>({
    queryKey: ["/api/org-chart"],
  });

  // Fetch all users in organization
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Filter available members (users not already in org chart)
  useEffect(() => {
    if (allUsers && nodes) {
      const nodeUserIds = nodes.map(node => node.userId).filter(Boolean);
      const available = allUsers.filter(user => !nodeUserIds.includes(user.id));
      setAvailableMembers(available);
    }
  }, [allUsers, nodes]);

  // Filter members based on search query
  const filteredMembers = availableMembers.filter(member =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build hierarchy tree
  const buildHierarchy = (): HierarchyNode[] => {
    if (!nodes) return [];

    // Create a map for quick lookup
    const nodeMap = new Map<string, HierarchyNode>();
    
    // Initialize all nodes with children array
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build parent-child relationships
    const rootNodes: HierarchyNode[] = [];
    
    nodes.forEach(node => {
      const nodeWithChildren = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(nodeWithChildren);
      } else {
        rootNodes.push(nodeWithChildren);
      }
    });

    return rootNodes;
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Add member to org chart mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { userId: string; parentId?: string; level: number }) => {
      const user = allUsers?.find(u => u.id === data.userId);
      if (!user) throw new Error('User not found');

      const nodeData = {
        orgId: currentUser?.orgId,
        userId: data.userId,
        name: user.fullName,
        role: user.jobTitle || user.role,
        department: user.department || 'General',
        parentId: data.parentId,
        level: data.level,
        position: { x: 0, y: 0 },
        color: '#0EA5E9',
        shape: 'rectangle' as const,
        isExpanded: true,
        isApproved: true,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const res = await apiRequest("POST", "/api/org-chart", nodeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Member added to organization chart successfully",
      });
      setSelectedMember(null);
      setSelectedParentNode(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member from org chart mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      await apiRequest("DELETE", `/api/org-chart/${nodeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Member removed from organization chart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle add member
  const handleAddMember = () => {
    if (!selectedMember || !selectedParentNode) {
      toast({
        title: "Error",
        description: "Please select both a member and a parent node",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate({
      userId: selectedMember.id,
      parentId: selectedParentNode.id,
      level: selectedParentNode.level + 1
    });
  };

  // Render node
  const renderNode = (node: HierarchyNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const levelColor = LEVEL_COLORS[node.level as keyof typeof LEVEL_COLORS] || 'bg-gray-100 border-gray-300 text-gray-900';
    const levelName = LEVEL_NAMES[node.level as keyof typeof LEVEL_NAMES] || `L${node.level}`;

    // Find user data
    const user = allUsers?.find(u => u.id === node.userId);

    return (
      <div key={node.id} className="relative">
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
          levelColor,
          depth > 0 && "ml-8"
        )}>
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-current flex items-center justify-center">
              <span className="text-lg font-semibold">
                {node.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm truncate">{node.name}</h3>
              <Badge variant="outline" className="text-xs">
                {levelName}
              </Badge>
              {user && (
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 truncate">{node.email || user?.email}</p>
            <p className="text-xs text-gray-600 truncate">{node.role}</p>
            <p className="text-xs text-gray-600 truncate">{node.department}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleNode(node.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Add Member Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedParentNode(node)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Member Under {node.name}</DialogTitle>
                  <DialogDescription>
                    Select an existing member to add under {node.name} in the organization chart
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Command>
                      <CommandInput
                        placeholder="Search members..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup>
                          {filteredMembers.map((member) => (
                            <CommandItem
                              key={member.id}
                              onSelect={() => setSelectedMember(member)}
                              className="flex items-center justify-between p-3"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-semibold">
                                    {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{member.fullName}</p>
                                  <p className="text-xs text-gray-500">{member.email}</p>
                                  <p className="text-xs text-gray-500">{member.department} • {member.role}</p>
                                </div>
                              </div>
                              {selectedMember?.id === member.id && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                  
                  {selectedMember && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">Selected Member:</p>
                      <p className="text-sm">{selectedMember.fullName} ({selectedMember.role})</p>
                      <p className="text-xs text-gray-600">{selectedMember.department}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMember(null);
                        setSelectedParentNode(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddMember}
                      disabled={!selectedMember || addMemberMutation.isPending}
                    >
                      {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Remove Member Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
              onClick={() => removeMemberMutation.mutate(node.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingNodes || isLoadingUsers) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded ml-8"></div>
              <div className="h-16 bg-muted rounded ml-8"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hierarchy = buildHierarchy();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Organization Chart Management</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Manage your organization's hierarchy by adding existing members and creating reporting relationships
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{nodes?.length || 0} in chart</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{availableMembers.length} available</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Click the <Plus className="inline h-3 w-3" /> button to add existing members under any node</p>
            <p>• Members will be assigned to the next level (L{Math.max(...(nodes?.map(n => n.level) || [0])) + 1})</p>
            <p>• Use the <Trash2 className="inline h-3 w-3" /> button to remove members from the chart</p>
            <p>• Only members who haven't been added to the chart yet are available for selection</p>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Tree */}
      <Card>
        <CardContent className="p-6">
          {hierarchy.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Organization Chart</h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first member to create the organization chart
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {hierarchy.map(node => renderNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Members List */}
      {availableMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Members</CardTitle>
            <p className="text-sm text-gray-600">
              These members are registered but not yet added to the organization chart
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMembers.slice(0, 6).map(member => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    <p className="text-xs text-gray-500 truncate">{member.department} • {member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            {availableMembers.length > 6 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                And {availableMembers.length - 6} more members available...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}