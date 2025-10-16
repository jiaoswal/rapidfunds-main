import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter,
  TreePine,
  Brain,
  Eye,
  EyeOff,
  User,
  Mail,
  Building,
  Users,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrgChartNode, User as UserType } from '@/lib/database';

interface InteractiveOrgChartProps {
  nodes: OrgChartNode[];
  users: UserType[];
  onUpdateNode: (nodeId: string, updates: Partial<OrgChartNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNode: (parentId: string | null, level: number) => void;
  onMoveNode: (nodeId: string, newParentId: string | null, newLevel: number) => void;
  isAdmin?: boolean;
}

type ViewMode = 'tree' | 'mindmap';
type FilterLevel = 'all' | 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

interface EmployeeCardProps {
  node: OrgChartNode;
  user: UserType | undefined;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  isAdmin?: boolean;
  viewMode: ViewMode;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  node,
  user,
  level,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  isAdmin = false,
  viewMode
}) => {
  const levelColors = {
    0: 'bg-gradient-to-br from-purple-500 to-purple-700',
    1: 'bg-gradient-to-br from-blue-500 to-blue-700',
    2: 'bg-gradient-to-br from-green-500 to-green-700',
    3: 'bg-gradient-to-br from-orange-500 to-orange-700',
    4: 'bg-gradient-to-br from-gray-500 to-gray-700'
  };

  const levelLabels = {
    0: 'L0 - Executive',
    1: 'L1 - Senior Management',
    2: 'L2 - Middle Management',
    3: 'L3 - Team Leads',
    4: 'L4 - Individual Contributors'
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn(
            "relative group transition-all duration-300 hover:shadow-lg hover:scale-105",
            "min-w-[280px] max-w-[320px]",
            viewMode === 'mindmap' && "mx-4 my-2"
          )}>
            <CardContent className="p-4">
              {/* Level Badge */}
              <div className="absolute -top-2 -right-2">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs font-medium",
                    level === 0 && "bg-purple-100 text-purple-800",
                    level === 1 && "bg-blue-100 text-blue-800",
                    level === 2 && "bg-green-100 text-green-800",
                    level === 3 && "bg-orange-100 text-orange-800",
                    level === 4 && "bg-gray-100 text-gray-800"
                  )}
                >
                  {levelLabels[level as keyof typeof levelLabels]}
                </Badge>
              </div>

              {/* Profile Section */}
              <div className="flex items-start gap-3 mb-3">
                {/* Profile Picture/Initials */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md",
                  levelColors[level as keyof typeof levelColors]
                )}>
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user?.name || node.name)
                  )}
                </div>

                {/* Name and Role */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user?.name || node.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {user?.role || node.role}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.department || node.department}
                  </p>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onEdit}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onDelete}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              {user?.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}

              {/* Expand/Collapse and Add Child */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 px-2 text-xs"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddChild}
                    className="h-8 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{user?.name || node.name}</p>
            <p className="text-sm text-gray-600">{user?.role || node.role}</p>
            <p className="text-sm text-gray-500">{user?.department || node.department}</p>
            {user?.email && <p className="text-sm text-gray-500">{user.email}</p>}
            <p className="text-xs text-gray-400">Level {level} - {levelLabels[level as keyof typeof levelLabels]}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const TreeNode: React.FC<{
  node: OrgChartNode;
  user: UserType | undefined;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onEdit?: (node: OrgChartNode) => void;
  onDelete?: (nodeId: string) => void;
  onAddChild?: (parentId: string, level: number) => void;
  isAdmin?: boolean;
  viewMode: ViewMode;
  filteredNodes: OrgChartNode[];
}> = ({
  node,
  user,
  level,
  expandedNodes,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  isAdmin = false,
  viewMode,
  filteredNodes
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const children = filteredNodes.filter(n => n.parentId === node.id);

  return (
    <div className="flex flex-col items-center">
      <EmployeeCard
        node={node}
        user={user}
        level={level}
        isExpanded={isExpanded}
        onToggle={() => onToggle(node.id)}
        onEdit={() => onEdit?.(node)}
        onDelete={() => onDelete?.(node.id)}
        onAddChild={() => onAddChild?.(node.id, level + 1)}
        isAdmin={isAdmin}
        viewMode={viewMode}
      />

      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div className={cn(
          "mt-4 flex",
          viewMode === 'tree' ? "flex-col items-center space-y-4" : "flex-wrap justify-center gap-4"
        )}>
          {children.map(child => {
            const childUser = users.find(u => u.id === child.userId);
            return (
              <TreeNode
                key={child.id}
                node={child}
                user={childUser}
                level={level + 1}
                expandedNodes={expandedNodes}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                isAdmin={isAdmin}
                viewMode={viewMode}
                filteredNodes={filteredNodes}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const InteractiveOrgChart: React.FC<InteractiveOrgChartProps> = ({
  nodes,
  users,
  onUpdateNode,
  onDeleteNode,
  onCreateNode,
  onMoveNode,
  isAdmin = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Filter nodes based on search and level
  const filteredNodes = useMemo(() => {
    let filtered = nodes;

    // Filter by level
    if (filterLevel !== 'all') {
      const levelNum = parseInt(filterLevel.replace('L', ''));
      filtered = filtered.filter(node => node.level === levelNum);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(node => {
        const user = users.find(u => u.id === node.userId);
        const searchText = `${user?.name || node.name} ${user?.role || node.role} ${user?.department || node.department}`.toLowerCase();
        return searchText.includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  }, [nodes, users, searchQuery, filterLevel]);

  // Get root nodes (L0 - Executive level)
  const rootNodes = useMemo(() => {
    return filteredNodes.filter(node => node.level === 0);
  }, [filteredNodes]);

  const handleToggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedNodes(new Set(filteredNodes.map(n => n.id)));
  }, [filteredNodes]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interactive Organizational Structure</h2>
            <p className="text-gray-600 mt-1">No members found</p>
          </div>
        </div>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organization members</h3>
          <p className="text-gray-600 mb-4">Start by adding members to your organization chart.</p>
          {isAdmin && (
            <Button onClick={() => onCreateNode(null, 0)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Executive (L0)
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interactive Organizational Structure</h2>
          <p className="text-gray-600 mt-1">
            {viewMode === 'tree' ? 'Hierarchical tree view' : 'Radial mind map view'} • 
            {filteredNodes.length} members • 
            {isReadOnly ? 'Read-only mode' : 'Edit mode'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="rounded-none"
            >
              <TreePine className="h-4 w-4 mr-2" />
              Tree View
            </Button>
            <Button
              variant={viewMode === 'mindmap' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mindmap')}
              className="rounded-none"
            >
              <Brain className="h-4 w-4 mr-2" />
              Mind Map
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as FilterLevel)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Levels</option>
            <option value="L0">L0 - Executive</option>
            <option value="L1">L1 - Senior Management</option>
            <option value="L2">L2 - Middle Management</option>
            <option value="L3">L3 - Team Leads</option>
            <option value="L4">L4 - Individual Contributors</option>
          </select>
        </div>

        {/* Expand/Collapse All */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Collapse All
          </Button>
        </div>

        {/* Read-only Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReadOnly(!isReadOnly)}
          >
            {isReadOnly ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Enable Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Read-only
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Organization Chart */}
      <div className={cn(
        "min-h-[600px] p-6 bg-white rounded-lg border border-gray-200",
        viewMode === 'mindmap' && "flex flex-wrap justify-center items-start gap-4"
      )}>
        {rootNodes.length === 0 ? (
          <div className="text-center py-12 w-full">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No executives found</h3>
            <p className="text-gray-600 mb-4">Add an executive (L0) to start building your organization.</p>
            {isAdmin && !isReadOnly && (
              <Button onClick={() => onCreateNode(null, 0)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Executive
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            "w-full",
            viewMode === 'tree' ? "flex flex-col items-center space-y-8" : "flex flex-wrap justify-center gap-6"
          )}>
            {rootNodes.map(rootNode => {
              const rootUser = users.find(u => u.id === rootNode.userId);
              return (
                <TreeNode
                  key={rootNode.id}
                  node={rootNode}
                  user={rootUser}
                  level={0}
                  expandedNodes={expandedNodes}
                  onToggle={handleToggleNode}
                  onEdit={isAdmin && !isReadOnly ? (node) => {
                    // Handle edit logic
                    console.log('Edit node:', node);
                  } : undefined}
                  onDelete={isAdmin && !isReadOnly ? onDeleteNode : undefined}
                  onAddChild={isAdmin && !isReadOnly ? onCreateNode : undefined}
                  isAdmin={isAdmin && !isReadOnly}
                  viewMode={viewMode}
                  filteredNodes={filteredNodes}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveOrgChart;
