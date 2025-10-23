import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, OrgMember, OrgChart } from '@/lib/database';
import { useAuth } from '@/hooks/use-auth';

export default function OrgChartDebug() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch all data
  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user?.orgId,
  });

  const { data: orgMembers, isLoading: membersLoading } = useQuery<OrgMember[]>({
    queryKey: ["/api/org-members"],
    enabled: !!user?.orgId,
  });

  const { data: orgChart, isLoading: chartLoading } = useQuery<OrgChart | null>({
    queryKey: ["/api/org-chart"],
    enabled: !!user?.orgId,
  });

  if (!user || user.role !== 'Admin') {
    return null;
  }

  const totalUsers = allUsers?.length || 0;
  const totalMembers = orgMembers?.length || 0;
  const totalNodes = orgChart?.nodes?.length || 0;
  const availableUsers = allUsers?.filter(user => 
    !orgChart?.nodes?.some(node => node.userId === user.id)
  ) || [];

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5 text-yellow-600" />
          Debug Information
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalMembers}</div>
              <div className="text-sm text-gray-600">Org Members</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{totalNodes}</div>
              <div className="text-sm text-gray-600">Chart Nodes</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{availableUsers.length}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>

          {/* Loading States */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Loading States:</h4>
            <div className="flex gap-2">
              <Badge variant={usersLoading ? "destructive" : "default"}>
                Users: {usersLoading ? "Loading..." : "Loaded"}
              </Badge>
              <Badge variant={membersLoading ? "destructive" : "default"}>
                Members: {membersLoading ? "Loading..." : "Loaded"}
              </Badge>
              <Badge variant={chartLoading ? "destructive" : "default"}>
                Chart: {chartLoading ? "Loading..." : "Loaded"}
              </Badge>
            </div>
          </div>

          {/* Available Users */}
          {availableUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Available Users to Add:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium text-sm">{user.fullName}</span>
                      <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Org Chart Nodes */}
          {orgChart?.nodes && orgChart.nodes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Current Org Chart Nodes:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {orgChart.nodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium text-sm">{node.name}</span>
                      <span className="text-xs text-gray-500 ml-2">Level {node.level}</span>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {node.role}
                      </Badge>
                      {node.userId && (
                        <Badge variant="default" className="text-xs">
                          Has User
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues Detection */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Issues Detection:</h4>
            <div className="space-y-1">
              {totalUsers === 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">No users found in database</span>
                </div>
              )}
              {totalMembers === 0 && totalUsers > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Users exist but no org members found</span>
                </div>
              )}
              {totalNodes === 0 && totalMembers > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Org members exist but no chart nodes</span>
                </div>
              )}
              {availableUsers.length === 0 && totalUsers > 0 && totalNodes > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">All users are already in org chart</span>
                </div>
              )}
              {totalUsers > 0 && totalMembers > 0 && totalNodes > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Org chart is properly set up</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('All Users:', allUsers);
                console.log('Org Members:', orgMembers);
                console.log('Org Chart:', orgChart);
                console.log('Available Users:', availableUsers);
              }}
            >
              Log to Console
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
