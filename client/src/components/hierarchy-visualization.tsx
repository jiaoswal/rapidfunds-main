import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreVertical, 
  User, 
  Users, 
  Building2,
  Phone,
  Mail,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Expand,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User as UserType, OrgChartNode } from '@/lib/database';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface HierarchyNode {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department: string;
  level: number;
  parentId?: string;
  isExpanded: boolean;
  children: HierarchyNode[];
  user?: UserType;
}

interface HierarchyVisualizationProps {
  className?: string;
}

const LEVEL_COLORS = {
  0: 'bg-blue-100 border-blue-300 text-blue-900', // L0 - Top Executive
  1: 'bg-blue-100 border-blue-300 text-blue-900', // L1 - Blue
  2: 'bg-green-100 border-green-300 text-green-900', // L2 - Green  
  3: 'bg-gray-100 border-gray-300 text-gray-900', // L3 - Grey
  4: 'bg-orange-100 border-orange-300 text-orange-900', // L4 - Orange
  5: 'bg-purple-100 border-purple-300 text-purple-900', // L5 - Purple
};

const LEVEL_NAMES = {
  0: 'CEO',
  1: 'L1',
  2: 'L2', 
  3: 'L3',
  4: 'L4',
  5: 'L5',
};

export default function HierarchyVisualization({ className }: HierarchyVisualizationProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showReportsChain, setShowReportsChain] = useState(false);
  const [reportsChain, setReportsChain] = useState<HierarchyNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch org chart data
  const { data: nodes, isLoading: isLoadingNodes } = useQuery<OrgChartNode[]>({
    queryKey: ["/api/org-chart"],
  });

  // Fetch users data
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Build hierarchy tree
  const hierarchyTree = useCallback((): HierarchyNode[] => {
    if (!nodes || !users) return [];

    // Create a map of nodes by ID
    const nodeMap = new Map<string, OrgChartNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // Create a map of users by ID
    const userMap = new Map<string, UserType>();
    users.forEach(user => userMap.set(user.id, user));

    // Build hierarchy nodes
    const hierarchyNodes: HierarchyNode[] = nodes.map(node => {
      const user = node.userId ? userMap.get(node.userId) : undefined;
      return {
        id: node.id,
        userId: node.userId,
        name: user?.fullName || node.name,
        email: user?.email,
        phone: user?.phoneNumber,
        role: user?.jobTitle || node.role,
        department: user?.department || node.department || 'General',
        level: node.level,
        parentId: node.parentId,
        isExpanded: expandedNodes.has(node.id),
        children: [],
        user,
      };
    });

    // Build parent-child relationships
    const rootNodes: HierarchyNode[] = [];
    const nodeMap2 = new Map<string, HierarchyNode>();
    
    hierarchyNodes.forEach(node => {
      nodeMap2.set(node.id, node);
    });

    hierarchyNodes.forEach(node => {
      if (node.parentId) {
        const parent = nodeMap2.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children by name
    const sortChildren = (node: HierarchyNode) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      node.children.forEach(sortChildren);
    };

    rootNodes.forEach(sortChildren);
    return rootNodes;
  }, [nodes, users, expandedNodes]);

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

  // Expand/Collapse all
  const expandAll = () => {
    if (!nodes) return;
    setExpandedNodes(new Set(nodes.map(node => node.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Handle node click
  const handleNodeClick = (node: HierarchyNode) => {
    setSelectedNode(node);
    setShowProfileDialog(true);
  };


  // Find node by ID
  const findNodeById = (nodeId: string): HierarchyNode | null => {
    const tree = hierarchyTree();
    const findInTree = (nodes: HierarchyNode[]): HierarchyNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        const found = findInTree(node.children);
        if (found) return found;
      }
      return null;
    };
    return findInTree(tree);
  };

  // Handle long press for reports chain
  const handleNodeLongPress = (node: HierarchyNode) => {
    const chain: HierarchyNode[] = [];
    let currentNode: HierarchyNode | null = node;
    
    // Build chain up to root
    while (currentNode) {
      chain.unshift(currentNode);
      if (currentNode.parentId) {
        currentNode = findNodeById(currentNode.parentId);
      } else {
        break;
      }
    }
    
    setReportsChain(chain);
    setShowReportsChain(true);
  };

  // Mouse event handlers for drag and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - scrollOffset.x, y: e.clientY - scrollOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setScrollOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.5, Math.min(2, prev * delta)));
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, node: HierarchyNode) => {
    const timer = setTimeout(() => {
      handleNodeLongPress(node);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Render node
  const renderNode = (node: HierarchyNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const levelColor = LEVEL_COLORS[node.level as keyof typeof LEVEL_COLORS] || 'bg-gray-100 border-gray-300 text-gray-900';
    const levelName = LEVEL_NAMES[node.level as keyof typeof LEVEL_NAMES] || `L${node.level}`;

    return (
      <div key={node.id} className="relative">
        {/* Node */}
        <div 
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
            levelColor,
            depth > 0 && "ml-8"
          )}
          style={{ 
            transform: `translate(${scrollOffset.x}px, ${scrollOffset.y}px) scale(${scale})`,
            transformOrigin: 'top left'
          }}
          onClick={() => handleNodeClick(node)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={(e) => handleTouchStart(e, node)}
          onTouchEnd={handleTouchEnd}
        >
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
            </div>
            <p className="text-xs text-muted-foreground truncate">{node.email}</p>
            <p className="text-xs text-muted-foreground truncate">{node.role}</p>
            {node.phone && (
              <p className="text-xs text-muted-foreground truncate">{node.phone}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Add Member Button (Admin only) */}
            {currentUser?.role === 'Admin' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                    <DialogDescription>
                      Add a new member under {node.name}
                    </DialogDescription>
                  </DialogHeader>
                  <AddMemberForm parentNode={node} />
                </DialogContent>
              </Dialog>
            )}

            {/* More Actions */}
            {currentUser?.role === 'Admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Member
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Move Up
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Move Down
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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

  const tree = hierarchyTree();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Organizational Hierarchy</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="flex items-center space-x-1"
            >
              <Expand className="h-4 w-4" />
              <span>Expand All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="flex items-center space-x-1"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Collapse All</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            <p>• Click on a node to view profile details</p>
            <p>• Long press (mobile) or right-click to see reporting chain</p>
            <p>• Use Ctrl + scroll to zoom, middle mouse to pan</p>
            <p>• {currentUser?.role === 'Admin' ? 'Admins can add/edit members' : 'Contact admin to modify hierarchy'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Tree */}
      <Card>
        <CardContent className="p-6">
          <div 
            ref={containerRef}
            className="relative min-h-[400px] overflow-auto"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
          >
            {tree.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Organization Data</h3>
                <p className="text-muted-foreground">
                  {currentUser?.role === 'Admin' 
                    ? 'Start by adding members to your organization'
                    : 'Contact your admin to set up the organizational structure'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tree.map(node => renderNode(node))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNode?.name}</DialogTitle>
            <DialogDescription>
              {selectedNode?.role} • {selectedNode?.department}
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xl font-semibold">
                    {selectedNode.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedNode.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedNode.role}</p>
                  <p className="text-sm text-muted-foreground">{selectedNode.department}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedNode.email}</span>
                </div>
                {selectedNode.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedNode.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1">
                  <User className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
                <Button variant="outline" className="flex-1">
                  <Building2 className="h-4 w-4 mr-2" />
                  Raise Funding Query
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reports Chain Dialog */}
      <Dialog open={showReportsChain} onOpenChange={setShowReportsChain}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reporting Chain</DialogTitle>
            <DialogDescription>
              Chain of command from {reportsChain[0]?.name} to {reportsChain[reportsChain.length - 1]?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {reportsChain.map((node, index) => (
              <div key={node.id} className="flex items-center space-x-3 p-2 rounded border">
                <Badge variant="outline">{LEVEL_NAMES[node.level as keyof typeof LEVEL_NAMES] || `L${node.level}`}</Badge>
                <div>
                  <p className="font-medium">{node.name}</p>
                  <p className="text-sm text-muted-foreground">{node.role}</p>
                </div>
                {index < reportsChain.length - 1 && (
                  <ArrowDown className="h-4 w-4 text-muted-foreground ml-auto" />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Member Form Component
function AddMemberForm({ parentNode }: { parentNode: HierarchyNode }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    phone: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create a User record
      const userData = {
        email: data.email,
        password: 'demo123', // Default password
        fullName: data.name,
        jobTitle: data.role,
        department: data.department,
        phoneNumber: data.phone,
        role: 'Member' as const,
        digestTime: '09:00',
        notificationPreferences: { push: true, email: true },
        isOnline: false,
        customFieldsData: {},
        emailVerified: true
      };
      
      const userRes = await apiRequest("POST", "/api/users", userData);
      const newUser = await userRes.json();
      
      // Then create the OrgChartNode
      const nodeData = {
        name: data.name,
        role: data.role,
        department: data.department,
        userId: newUser.id,
        parentId: parentNode.id,
        level: parentNode.level + 1,
        isApproved: true,
        isExpanded: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const res = await apiRequest("POST", "/api/org-chart", nodeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Role</label>
        <input
          type="text"
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Department</label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full p-2 border rounded"
        />
      </div>
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Adding...' : 'Add Member'}
      </Button>
    </form>
  );
}
