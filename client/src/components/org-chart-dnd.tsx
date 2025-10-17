import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  Users,
  Crown,
  User,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  OrgChartMember, 
  getOrgChartMembers, 
  addOrgChartMember, 
  updateOrgChartMember, 
  deleteOrgChartMember,
  buildOrgChartTree,
  searchOrgChartMembers,
  seedOrgChartData
} from '@/lib/orgChartDB';

interface TreeNodeProps {
  member: OrgChartMember & { children: OrgChartMember[] };
  level: number;
  isAdmin: boolean;
  onEdit: (member: OrgChartMember & { children: OrgChartMember[] }) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onMove: (draggedId: string, targetId: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  member,
  level,
  isAdmin,
  onEdit,
  onDelete,
  onAddChild,
  onMove,
  expandedNodes,
  onToggleExpand
}) => {
  const isExpanded = expandedNodes.has(member.id);
  const hasChildren = member.children.length > 0;

  const [{ isDragging }, drag] = useDrag({
    type: 'member',
    item: { id: member.id, level: member.level },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'member',
    drop: (item: { id: string; level: number }) => {
      if (item.id !== member.id) {
        onMove(item.id, member.id);
      }
    },
    canDrop: (item: { id: string; level: number }) => {
      // Can drop if the target is at a different level
      return item.level !== member.level;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getLevelColor = (level: number) => {
    const colors = [
      'bg-purple-100 text-purple-800 border-purple-200', // L0 - CEO
      'bg-blue-100 text-blue-800 border-blue-200',       // L1 - C-Level
      'bg-green-100 text-green-800 border-green-200',    // L2 - VP
      'bg-yellow-100 text-yellow-800 border-yellow-200', // L3 - Director
      'bg-orange-100 text-orange-800 border-orange-200', // L4 - Manager
      'bg-gray-100 text-gray-800 border-gray-200',       // L5+ - Individual
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('president')) {
      return <Crown className="h-4 w-4" />;
    } else if (role.toLowerCase().includes('vp') || role.toLowerCase().includes('director')) {
      return <Building className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        "relative",
        isDragging && "opacity-50",
        isOver && canDrop && "ring-2 ring-blue-500 ring-opacity-50"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200",
          "hover:shadow-md cursor-pointer",
          getLevelColor(member.level),
          isOver && canDrop && "border-blue-500"
        )}
        style={{ marginLeft: `${level * 20}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(member.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getRoleIcon(member.role)}
            <h3 className="font-semibold text-sm truncate">{member.name}</h3>
            <Badge variant="outline" className="text-xs">
              L{member.level}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 truncate">{member.role}</p>
          {member.department && (
            <p className="text-xs text-gray-500 truncate">{member.department}</p>
          )}
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(member.id);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(member);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(member.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {member.children.map((child) => (
            <TreeNode
              key={child.id}
              member={child as OrgChartMember & { children: OrgChartMember[] }}
              level={level + 1}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onMove={onMove}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (member: Omit<OrgChartMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
  parentId?: string;
  existingMembers: OrgChartMember[];
}

const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentId,
  existingMembers
}) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    level: 0,
  });

  const [aiSuggestions, setAiSuggestions] = useState<OrgChartMember[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // AI-powered suggestions based on existing members
  const generateAISuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setAiSuggestions([]);
      return;
    }

    const suggestions = existingMembers.filter(member =>
      member.name.toLowerCase().includes(query.toLowerCase()) ||
      member.role.toLowerCase().includes(query.toLowerCase()) ||
      (member.department && member.department.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);

    setAiSuggestions(suggestions);
  }, [existingMembers]);

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    generateAISuggestions(value);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: OrgChartMember) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      role: suggestion.role,
      department: suggestion.department || '',
      email: suggestion.email || '',
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parentId: parentId || null,
      isActive: true,
    });
    setFormData({ name: '', role: '', department: '', email: '', level: 0 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Add a new member to the organization chart
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter member name..."
              required
            />
            {showSuggestions && aiSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {aiSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="font-medium text-sm">{suggestion.name}</div>
                    <div className="text-xs text-gray-600">{suggestion.role} • {suggestion.department}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Senior Developer"
              required
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder="e.g., Engineering"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="member@company.com"
            />
          </div>

          <div>
            <Label htmlFor="level">Level</Label>
            <Select
              value={formData.level.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">L0 - Executive</SelectItem>
                <SelectItem value="1">L1 - C-Level</SelectItem>
                <SelectItem value="2">L2 - VP</SelectItem>
                <SelectItem value="3">L3 - Director</SelectItem>
                <SelectItem value="4">L4 - Manager</SelectItem>
                <SelectItem value="5">L5 - Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface OrgChartDnDProps {
  isAdmin: boolean;
}

const OrgChartDnD: React.FC<OrgChartDnDProps> = ({ isAdmin }) => {
  const [members, setMembers] = useState<(OrgChartMember & { children: OrgChartMember[] })[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<(OrgChartMember & { children: OrgChartMember[] }) | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>();
  const { toast } = useToast();

  const loadMembers = useCallback(async () => {
    try {
      const treeData = await buildOrgChartTree();
      setMembers(treeData as (OrgChartMember & { children: OrgChartMember[] })[]);
      
      // Auto-expand first level
      const firstLevelIds = treeData.map(member => member.id);
      setExpandedNodes(new Set(firstLevelIds));
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Error",
        description: "Failed to load organization chart",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (memberData: Omit<OrgChartMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addOrgChartMember(memberData);
      await loadMembers();
      toast({
        title: "Success",
        description: "Member added successfully",
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async (member: OrgChartMember & { children: OrgChartMember[] }) => {
    try {
      await updateOrgChartMember(member.id, member);
      await loadMembers();
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await deleteOrgChartMember(id);
      await loadMembers();
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      });
    }
  };

  const handleMoveMember = async (draggedId: string, targetId: string) => {
    try {
      const allMembers = await getOrgChartMembers();
      const draggedMember = allMembers.find(m => m.id === draggedId);
      const targetMember = allMembers.find(m => m.id === targetId);

      if (draggedMember && targetMember) {
        // Update the dragged member's parent and level
        await updateOrgChartMember(draggedId, {
          parentId: targetId,
          level: targetMember.level + 1,
        });
        
        await loadMembers();
        toast({
          title: "Success",
          description: "Member moved successfully",
        });
      }
    } catch (error) {
      console.error('Error moving member:', error);
      toast({
        title: "Error",
        description: "Failed to move member",
        variant: "destructive",
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredMembers = members.filter(member => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        (member.department && member.department.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }

    if (filterLevel !== 'all') {
      return member.level === parseInt(filterLevel);
    }

    return true;
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Organization Chart</CardTitle>
            </div>
            
            {isAdmin && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="0">L0 - Executive</SelectItem>
                <SelectItem value="1">L1 - C-Level</SelectItem>
                <SelectItem value="2">L2 - VP</SelectItem>
                <SelectItem value="3">L3 - Director</SelectItem>
                <SelectItem value="4">L4 - Manager</SelectItem>
                <SelectItem value="5">L5 - Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchQuery || filterLevel !== 'all' 
                  ? 'No members found matching your criteria'
                  : 'No members in the organization chart'
                }
              </p>
              {isAdmin && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <TreeNode
                  key={member.id}
                  member={member}
                  level={0}
                  isAdmin={isAdmin}
                  onEdit={setEditingMember}
                  onDelete={handleDeleteMember}
                  onAddChild={(parentId) => {
                    setSelectedParentId(parentId);
                    setIsAddDialogOpen(true);
                  }}
                  onMove={handleMoveMember}
                  expandedNodes={expandedNodes}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <AddMemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setSelectedParentId(undefined);
        }}
        onSubmit={handleAddMember}
        parentId={selectedParentId}
        existingMembers={members.flatMap(m => [m, ...m.children]) as OrgChartMember[]}
      />
    </DndProvider>
  );
};

export default OrgChartDnD;
