import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  User, 
  Mail, 
  Building, 
  ChevronDown, 
  ChevronRight, 
  Plus,
  Trash2,
  Users,
  DollarSign,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrgChartNode, User as UserType } from '@/lib/database';

interface SimpleOrgChartProps {
  nodes: OrgChartNode[];
  users: UserType[];
  onUpdateNode: (nodeId: string, updates: Partial<OrgChartNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNode: (parentId: string | null, level: number) => void;
  onMoveNode: (nodeId: string, newParentId: string | null, newLevel: number) => void;
  isAdmin?: boolean;
}

interface HierarchyNodeProps {
  node: OrgChartNode;
  users: UserType[];
  level: number;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  onUpdateNode: (nodeId: string, updates: Partial<OrgChartNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNode: (parentId: string | null, level: number) => void;
  isAdmin?: boolean;
}

const HierarchyNode: React.FC<HierarchyNodeProps> = ({ 
  node, 
  users, 
  level, 
  isExpanded, 
  onToggleExpand, 
  onUpdateNode, 
  onDeleteNode, 
  onCreateNode, 
  isAdmin 
}) => {
  const user = users.find(u => u.id === node.userId);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-blue-50 border-blue-200 text-blue-900';
      case 2: return 'bg-green-50 border-green-200 text-green-900';
      case 3: return 'bg-purple-50 border-purple-200 text-purple-900';
      case 4: return 'bg-orange-50 border-orange-200 text-orange-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-purple-100 text-purple-800';
      case 4: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={cn(
      "w-80 transition-all duration-200 hover:shadow-md",
      getLevelColor(level)
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user?.fullName?.charAt(0) || node.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {user?.fullName || node.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={cn("text-xs", getLevelBadgeColor(level))}>
                  L{level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {node.role}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(node.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {isAdmin && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateNode(node.id, level + 1)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteNode(node.id)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <TooltipProvider>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate">{user?.email || node.email || 'No email'}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user?.email || node.email || 'No email'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              <span>{user?.department || node.department || 'No department'}</span>
            </div>
            
            {node.budgetResponsibility && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>{node.budgetResponsibility}</span>
              </div>
            )}
            
            {node.reportingManager && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Reports to: {node.reportingManager}</span>
              </div>
            )}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

const HierarchyLevel: React.FC<{
  level: number;
  nodes: OrgChartNode[];
  users: UserType[];
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onUpdateNode: (nodeId: string, updates: Partial<OrgChartNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNode: (parentId: string | null, level: number) => void;
  isAdmin?: boolean;
}> = ({ 
  level, 
  nodes, 
  users, 
  expandedNodes, 
  onToggleExpand, 
  onUpdateNode, 
  onDeleteNode, 
  onCreateNode, 
  isAdmin 
}) => {
  const levelNodes = nodes.filter(node => node.level === level);
  
  if (levelNodes.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Level {level} ({levelNodes.length} {levelNodes.length === 1 ? 'member' : 'members'})
          </h3>
          <Badge variant="outline" className="text-xs">
            {level === 1 ? 'Executive' : level === 2 ? 'Management' : level === 3 ? 'Senior' : 'Staff'}
          </Badge>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNode(null, level)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {levelNodes.map(node => (
          <HierarchyNode
            key={node.id}
            node={node}
            users={users}
            level={level}
            isExpanded={expandedNodes.has(node.id)}
            onToggleExpand={onToggleExpand}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
            onCreateNode={onCreateNode}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
};

export const SimpleOrgChart: React.FC<SimpleOrgChartProps> = ({
  nodes,
  users,
  onUpdateNode,
  onDeleteNode,
  onCreateNode,
  onMoveNode,
  isAdmin = false
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Debug logging
  console.log('SimpleOrgChart rendered with:', { 
    nodesCount: nodes.length, 
    usersCount: users.length, 
    isAdmin 
  });

  const handleToggleExpand = useCallback((nodeId: string) => {
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
    setExpandedNodes(new Set(nodes.map(n => n.id)));
  }, [nodes]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Group nodes by level
  const nodesByLevel = useMemo(() => {
    const grouped: { [key: number]: OrgChartNode[] } = {};
    nodes.forEach(node => {
      if (!grouped[node.level]) {
        grouped[node.level] = [];
      }
      grouped[node.level].push(node);
    });
    return grouped;
  }, [nodes]);

  const maxLevel = nodes.length > 0 ? Math.max(...nodes.map(n => n.level), 0) : 0;

  if (nodes.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organizational Hierarchy</h2>
            <p className="text-gray-600 mt-1">No members found</p>
          </div>
        </div>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organization members</h3>
          <p className="text-gray-600 mb-4">Start by adding members to your organization chart.</p>
          {isAdmin && (
            <Button onClick={() => onCreateNode(null, 1)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Member
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organizational Hierarchy</h2>
          <p className="text-gray-600 mt-1">
            {nodes.length} members across {maxLevel} levels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            className="flex items-center space-x-2"
          >
            <Maximize2 className="h-4 w-4" />
            <span>Expand All</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
            className="flex items-center space-x-2"
          >
            <Minimize2 className="h-4 w-4" />
            <span>Collapse All</span>
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => (
          <HierarchyLevel
            key={level}
            level={level}
            nodes={nodesByLevel[level] || []}
            users={users}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
            onCreateNode={onCreateNode}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleOrgChart;
