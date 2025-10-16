import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OrgChartNode, User, clearDatabase } from "../lib/database";
import { 
  Plus, 
  Users, 
  Trash2, 
  UserPlus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Edit, 
  Search,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Mail,
  Filter,
  MoreHorizontal,
  Pencil,
  GripVertical,
  Brain,
  Save,
  Undo,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  User as UserIcon,
  Building,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tree, TreeNode } from "react-organizational-chart";
import { 
  DndContext, 
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// Enhanced Employee Card Component with AI features
function EmployeeCard({ 
  node, 
  onDelete, 
  onAddChild, 
  onEdit,
  isAdmin,
  isTopLevel = false,
  isDragging,
  level = 1,
  allNodes = [],
  isExpanded = true
}: { 
  node: OrgChartNode; 
  onDelete: (id: string) => void; 
  onAddChild: (parentId: string) => void;
  onEdit: (node: OrgChartNode) => void;
  isAdmin: boolean;
  isTopLevel?: boolean;
  isDragging?: boolean;
  level?: number;
  allNodes?: OrgChartNode[];
  isExpanded?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingActive } = useDraggable({
    id: node.id,
    data: node,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: node,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  // Generate email from name for demo purposes
  const generateEmail = (name: string) => {
    const firstName = name.split(' ')[0].toLowerCase();
    const lastName = name.split(' ')[1]?.toLowerCase() || '';
    return `${firstName}${lastName}@rapidfunds.com`;
  };

  const email = node.email || generateEmail(node.name);
  
  // Find reporting manager
  const reportingManager = allNodes.find(n => n.id === node.parentId);
  
  // Calculate budget responsibility (demo data)
  const nodeLevel = node.level || level || 1;
  const budgetResponsibility = node.budgetResponsibility || (nodeLevel === 1 ? '$2.5M' : nodeLevel === 2 ? '$1.2M' : '$500K');
  
  // Get department color
  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      'Executive': '#8B5CF6',
      'Human Resources & Admin': '#10B981',
      'Operations Department': '#F59E0B',
      'Marketing': '#EF4444',
      'Finance': '#3B82F6',
      'Engineering': '#8B5CF6'
    };
    return colors[dept] || '#6B7280';
  };

  if (isTopLevel) {
    // Top-level node with purple gradient background
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              ref={setDropRef}
              style={style}
              className={`relative ${isOver ? 'ring-2 ring-white/50' : ''}`}
            >
              <div 
                ref={isAdmin ? setNodeRef : undefined}
                className={`
                  w-80 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white shadow-lg
                  ${isDraggingActive ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
                  ${isOver ? 'scale-105 shadow-xl' : 'hover:shadow-xl'}
                  transition-all duration-200
                `}
                data-testid={`node-${node.id}`}
                {...(isAdmin ? listeners : {})}
                {...(isAdmin ? attributes : {})}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-16 w-16 rounded-full bg-purple-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {node.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-1" data-testid={`text-node-name-${node.id}`}>
                      {node.name}
                    </h3>
                    <p className="text-white/90 text-sm mb-2">{node.role}</p>
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <Mail className="h-3 w-3" />
                      <span>{email}</span>
                    </div>
                  </div>

                  {/* Menu button */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(node);
                      }}
                      className="text-white/70 hover:text-white transition-colors"
                      data-testid={`button-edit-node-${node.id}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Expand/Collapse indicator */}
                <div className="flex justify-center mt-4">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-white/70" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  )}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-gray-900 text-white p-3 max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Budget: {budgetResponsibility}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="text-sm">Level: L{nodeLevel}</span>
              </div>
              {reportingManager && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="text-sm">Reports to: {reportingManager.name}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Regular employee cards with white background
  return (
    <div 
      ref={setDropRef}
      style={style}
      className={`relative ${isOver ? 'ring-2 ring-purple-200' : ''}`}
    >
      <div 
        ref={isAdmin ? setNodeRef : undefined}
        className={`
          w-72 bg-white rounded-lg p-4 shadow-md border border-gray-100
          ${isDraggingActive ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
          ${isOver ? 'scale-105 shadow-lg' : 'hover:shadow-lg'}
          transition-all duration-200
        `}
        data-testid={`node-${node.id}`}
        {...(isAdmin ? listeners : {})}
        {...(isAdmin ? attributes : {})}
      >
        <div className="flex items-start gap-3">
          {/* Menu button */}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
              data-testid={`button-edit-node-${node.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}

          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {node.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm mb-1" data-testid={`text-node-name-${node.id}`}>
              {node.name}
            </h4>
            <p className="text-gray-600 text-xs mb-2 truncate">{node.role}</p>
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <Mail className="h-3 w-3" />
              <span className="truncate">{email}</span>
            </div>
            {node.department && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="truncate">{node.department}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse indicator */}
        <div className="flex justify-center mt-3">
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

// Recursive Tree Builder
function OrgTreeNode({ 
  node, 
  allNodes, 
  onDelete, 
  onAddChild,
  onEdit, 
  isAdmin,
  isTopLevel = false,
  isExpanded = true,
  onToggleExpansion
}: { 
  node: OrgChartNode; 
  allNodes: OrgChartNode[];
  onDelete: (id: string) => void; 
  onAddChild: (parentId: string) => void;
  onEdit: (node: OrgChartNode) => void;
  isAdmin: boolean;
  isTopLevel?: boolean;
  isExpanded?: boolean;
  onToggleExpansion?: (nodeId: string) => void;
}) {
  const children = allNodes.filter(n => n.parentId === node.id);

  return (
    <TreeNode
      label={
        <div onClick={() => onToggleExpansion?.(node.id)}>
          <EmployeeCard
            node={node}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onEdit={onEdit}
            isAdmin={isAdmin}
            isTopLevel={isTopLevel}
            isExpanded={isExpanded}
            level={node.level || 1}
            allNodes={allNodes}
          />
        </div>
      }
    >
      {isExpanded && children.map(child => (
        <OrgTreeNode
          key={child.id}
          node={child}
          allNodes={allNodes}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onEdit={onEdit}
          isAdmin={isAdmin}
          isTopLevel={false}
          isExpanded={isExpanded && (child.isExpanded !== false)}
          onToggleExpansion={onToggleExpansion}
        />
      ))}
    </TreeNode>
  );
}

export default function OrgChartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "Admin";

  // Smart suggestions function
  const getSmartSuggestions = async (query: string) => {
    if (query.length < 2) {
      setMemberSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const users = await apiRequest('GET', '/api/users');
      const userData = await users.json();
      
      // Filter users who are not already in org chart
      const existingNodeUserIds = (nodes || []).map((node: OrgChartNode) => node.userId).filter(Boolean);
      const availableUsers = userData.filter((u: User) => 
        !existingNodeUserIds.includes(u.id) && 
        u.fullName.toLowerCase().includes(query.toLowerCase())
      );
      
      setMemberSuggestions(availableUsers.slice(0, 5)); // Top 5 suggestions
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  // Expand/collapse functions
  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAllNodes = () => {
    const allNodeIds = new Set((nodes || []).map((node: OrgChartNode) => node.id));
    setExpandedNodes(allNodeIds);
  };

  const collapseAllNodes = () => {
    setExpandedNodes(new Set());
  };
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<OrgChartNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [color, setColor] = useState("#0EA5E9");
  const [memberSuggestions, setMemberSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: nodes, isLoading } = useQuery<OrgChartNode[]>({
    queryKey: ["/api/org-chart"],
  });

  const createNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      // Calculate hierarchy level automatically
      let level = 1;
      if (data.parentId) {
        const parentNode = (nodes || []).find((n: OrgChartNode) => n.id === data.parentId);
        level = (parentNode?.level || 1) + 1;
      }
      
      const nodeData = {
        ...data,
        level,
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
      toast({
        title: "Success",
        description: editingNode ? "Person updated successfully" : "Person added to org chart",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/org-chart/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
      toast({
        title: "Success",
        description: "Person updated successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/org-chart/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
      toast({
        title: "Node deleted",
        description: "The person has been removed from the org chart",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setRole("");
    setDepartment("");
    setColor("#0EA5E9");
    setSelectedParentId(null);
    setEditingNode(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name,
      role,
      department: department || null,
      parentId: selectedParentId,
      color,
      shape: "rectangle",
      position: { x: 0, y: 0 },
    };

    if (editingNode) {
      updateNodeMutation.mutate({ id: editingNode.id, data });
    } else {
      createNodeMutation.mutate(data);
    }
  };

  const handleAddChild = (parentId: string) => {
    setSelectedParentId(parentId);
    setEditingNode(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (node: OrgChartNode) => {
    setName(node.name);
    setRole(node.role);
    setDepartment(node.department || "");
    setColor(node.color || "#0EA5E9");
    setSelectedParentId(node.parentId || null);
    setEditingNode(node);
    setIsAddDialogOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    // Don't allow dropping on own children
    const draggedNode = nodes?.find(n => n.id === active.id);
    const targetNode = nodes?.find(n => n.id === over.id);

    if (!draggedNode || !targetNode) return;

    // Check if target is a child of dragged node
    const isChild = (parentId: string, childId: string): boolean => {
      const node = nodes?.find(n => n.id === childId);
      if (!node) return false;
      if (node.parentId === parentId) return true;
      if (node.parentId) return isChild(parentId, node.parentId);
      return false;
    };

    if (isChild(draggedNode.id, targetNode.id)) {
      toast({
        title: "Invalid move",
        description: "Cannot move a person under their own subordinate",
        variant: "destructive",
      });
      return;
    }

    // Update the parent
    updateNodeMutation.mutate({
      id: draggedNode.id,
      data: { ...draggedNode, parentId: targetNode.id },
    });
  };

  const rootNodes = nodes?.filter(n => !n.parentId) || [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Top Header - matches reference exactly */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - instruction text */}
            <div className="flex-1">
              <p className="text-gray-600 text-sm">
                Drag and drop to reorganize reporting structure
              </p>
            </div>

            {/* Right side - controls */}
            <div className="flex items-center gap-3">
              {/* Connected status */}
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Connected</span>
              </div>

              {/* Expand/Collapse buttons */}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-600"
                onClick={expandAllNodes}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-600"
                onClick={collapseAllNodes}
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse All
              </Button>

              {/* Reset DB button (Admin only) */}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={async () => {
                    if (confirm('Are you sure you want to reset the database? This will delete all data and reload demo data.')) {
                      try {
                        await clearDatabase();
                        await queryClient.invalidateQueries({ queryKey: ['orgChart'] });
                        toast({
                          title: "Database Reset",
                          description: "Database has been reset with demo data.",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to reset database.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Reset DB
                </Button>
              )}

              {/* Add Members button */}
              {isAdmin && (
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                  if (!open) resetForm();
                  setIsAddDialogOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        resetForm();
                        setIsAddDialogOpen(true);
                      }}
                      data-testid="button-add-node"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingNode ? 'Edit Person' : 'Add Person to Organization'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingNode 
                          ? 'Update the person details' 
                          : selectedParentId 
                          ? 'Add a direct report' 
                          : 'Add a root person (CEO/President)'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <div className="relative">
                          <Input
                            id="name"
                            data-testid="input-name"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              getSmartSuggestions(e.target.value);
                            }}
                            onFocus={() => {
                              if (name.length >= 2) {
                                getSmartSuggestions(name);
                              }
                            }}
                            onBlur={() => {
                              // Delay hiding suggestions to allow clicking
                              setTimeout(() => setShowSuggestions(false), 200);
                            }}
                            required
                          />
                          {showSuggestions && memberSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {memberSuggestions.map((user) => (
                                <div
                                  key={user.id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                    setName(user.fullName);
                                    setRole(user.jobTitle || '');
                                    setDepartment(user.department || '');
                                    setShowSuggestions(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <div className="font-medium">{user.fullName}</div>
                                      <div className="text-sm text-gray-500">{user.jobTitle} • {user.department}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="role">Job Title *</Label>
                        <Input
                          id="role"
                          data-testid="input-role"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          data-testid="input-department"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Card Color</Label>
                        <div className="flex gap-2 mt-2">
                          {['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`h-10 w-10 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-border'}`}
                              style={{ backgroundColor: c }}
                              onClick={() => setColor(c)}
                              data-testid={`button-color-${c}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddDialogOpen(false);
                            resetForm();
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createNodeMutation.isPending || updateNodeMutation.isPending}
                          className="flex-1"
                          data-testid="button-submit"
                        >
                          {editingNode ? 'Update' : 'Add'} Person
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              {/* Edit Mode button */}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`${isEditMode ? 'bg-green-50 border-green-200 text-green-700' : 'text-gray-600'}`}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Mode
                </Button>
              )}

              {/* Drag & Drop toggle */}
              {isAdmin && isEditMode && (
                <Button 
                  size="sm" 
                  className={`${isDragMode ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setIsDragMode(!isDragMode)}
                >
                  <GripVertical className="h-4 w-4 mr-1" />
                  Drag & Drop
                </Button>
              )}

              {/* Filter button */}
              <Button variant="outline" size="sm" className="text-gray-600">
                <Filter className="h-4 w-4" />
              </Button>

              {/* All Levels dropdown */}
              <Button variant="outline" size="sm" className="text-gray-600">
                All Levels
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, role, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : rootNodes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organization Chart Yet</h3>
              <p className="text-gray-600 mb-4">
                {isAdmin 
                  ? 'Start by adding a root person (CEO, President, or Director)' 
                  : 'Contact an admin to set up the organization chart'}
              </p>
              {isAdmin && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Root Person
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div 
                style={{ 
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-in-out'
                }}
              >
                <Tree
                  lineWidth="2px"
                  lineColor="#E5E7EB"
                  lineBorderRadius="8px"
                  label={<div />}
                >
                  {rootNodes.map((node) => (
                    <OrgTreeNode
                      key={node.id}
                      node={node}
                      allNodes={nodes || []}
                      onDelete={(id) => deleteNodeMutation.mutate(id)}
                      onAddChild={handleAddChild}
                      onEdit={handleEdit}
                      isAdmin={isAdmin && isEditMode}
                      isTopLevel={true}
                      isExpanded={expandedNodes.has(node.id) || node.isExpanded !== false}
                      onToggleExpansion={toggleNodeExpansion}
                    />
                  ))}
                </Tree>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
