import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import HierarchyVisualization from "@/components/hierarchy-visualization";
import AdminOrgChartManager from "@/components/admin-org-chart-manager";
import { useQuery } from "@tanstack/react-query";
import { User, OrgChartNode, OrgMember, OrgChart } from "@/lib/database";
import { useEffect, useState } from "react";
import { 
  Users, 
  Settings,
  RefreshCw,
  Database,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export default function OrgChartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const isAdmin = user?.role === 'Admin';

  // Fetch org members using new org-scoped API
  const { data: orgMembers, isLoading: membersLoading, refetch: refetchMembers } = useQuery<OrgMember[]>({
    queryKey: ["/api/org-members"],
    enabled: !!user?.orgId,
  });

  // Fetch org chart using new org-scoped API
  const { data: orgChart, isLoading: chartLoading, refetch: refetchChart } = useQuery<OrgChart | null>({
    queryKey: ["/api/org-chart"],
    enabled: !!user?.orgId,
  });

  // Initialize org chart data on component mount
  useEffect(() => {
    const initializeOrgChart = async () => {
      if (!user?.orgId || isInitialized) return;
      
      try {
        // Create org chart if it doesn't exist and we have members
        if (orgMembers && orgMembers.length > 0 && !orgChart) {
          const nodes: OrgChartNode[] = orgMembers.map((member, index) => ({
            id: crypto.randomUUID(),
            orgId: member.orgId,
            userId: member.memberId,
            name: member.fullName,
            role: member.profile.title || member.role,
            department: member.profile.department || 'General',
            level: member.role === 'admin' ? 1 : 2, // Admins at L1, others at L2
            parentId: member.role === 'admin' ? undefined : undefined, // Will be set by admin later
            position: { x: index * 200, y: member.role === 'admin' ? 0 : 100 },
            color: member.role === 'admin' ? 'purple' : 'blue',
            shape: 'rectangle' as const,
            isExpanded: true,
            isApproved: true,
            email: member.email,
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          const chartData = {
            nodes,
            updatedAt: new Date()
          };

          const response = await fetch('/api/org-chart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chartData)
          });

          if (response.ok) {
            console.log(`✅ Created org chart with ${nodes.length} nodes`);
          }
        }
        
        setIsInitialized(true);
        console.log('✅ Org chart data initialized');
      } catch (error) {
        console.error('❌ Error initializing org chart data:', error);
      }
    };

    if (orgMembers && !isInitialized) {
      initializeOrgChart();
    }
  }, [orgMembers, orgChart, user?.orgId, isInitialized]);

  const handleRefresh = async () => {
    try {
      setIsInitialized(false);
      await refetchMembers();
      await refetchChart();
      toast({
        title: "Success",
        description: "Organization chart refreshed",
      });
    } catch (error) {
      console.error('Error refreshing org chart:', error);
      toast({
        title: "Error",
        description: "Failed to refresh organization chart",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const totalMembers = orgMembers?.length || 0;
  const totalNodes = orgChart?.nodes?.length || 0;
  const admins = orgMembers?.filter(m => m.role === 'admin').length || 0;
  const members = orgMembers?.filter(m => m.role !== 'admin').length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Chart</h1>
          <p className="text-gray-600 mt-1">
            Visualize and manage your organization's structure
          </p>
        </div>
        
        <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   onClick={handleRefresh}
                   className="flex items-center gap-2"
                   disabled={membersLoading || chartLoading}
                 >
                   <RefreshCw className={`h-4 w-4 ${(membersLoading || chartLoading) ? 'animate-spin' : ''}`} />
                   Refresh
                 </Button>
          
          {isAdmin && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
                     <div>
                       <p className="text-sm font-medium text-gray-600">Total Members</p>
                       <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
                     </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Org Chart Nodes</p>
                <p className="text-2xl font-bold text-gray-900">{totalNodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Members</p>
                <p className="text-2xl font-bold text-gray-900">{members}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

             {/* Status Message */}
             {totalMembers > 0 && totalNodes === 0 && (
               <Card className="border-yellow-200 bg-yellow-50">
                 <CardContent className="p-4">
                   <div className="flex items-center space-x-3">
                     <AlertCircle className="h-5 w-5 text-yellow-600" />
                     <div>
                       <p className="text-sm font-medium text-yellow-800">
                         Initializing Organization Chart
                       </p>
                       <p className="text-sm text-yellow-700">
                         Creating org chart nodes for {totalMembers} members. This may take a moment...
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}

             {totalMembers > 0 && totalNodes > 0 && (
               <Card className="border-green-200 bg-green-50">
                 <CardContent className="p-4">
                   <div className="flex items-center space-x-3">
                     <CheckCircle className="h-5 w-5 text-green-600" />
                     <div>
                       <p className="text-sm font-medium text-green-800">
                         Organization Chart Ready
                       </p>
                       <p className="text-sm text-green-700">
                         All {totalMembers} members have been added to the organization chart.
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}

      {/* Admin Info Card */}
      {isAdmin && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Admin Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800">
              As an admin, you can add, edit, delete, and rearrange members in the organization chart. 
              Use drag-and-drop to reorganize the hierarchy, and click the "Add Member" button to add new team members.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Member Info Card */}
      {!isAdmin && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600" />
              View Only Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              You can view the organization chart and search for members. 
              Contact an administrator to make changes to the organization structure.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Org Chart Component */}
      {isAdmin ? (
        <AdminOrgChartManager />
      ) : (
        <HierarchyVisualization />
      )}

      {/* Features Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Hierarchical Structure</h3>
                <p className="text-sm text-gray-600">
                  Visualize your organization with clear L0-L5 hierarchy levels
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Drag & Drop</h3>
                <p className="text-sm text-gray-600">
                  {isAdmin 
                    ? "Rearrange members and update hierarchy with drag-and-drop"
                    : "View the interactive organization structure"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Database className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Suggestions</h3>
                <p className="text-sm text-gray-600">
                  Smart suggestions when adding new members based on existing data
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Search & Filter</h3>
                <p className="text-sm text-gray-600">
                  Find members quickly with search and level-based filtering
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Expandable Nodes</h3>
                <p className="text-sm text-gray-600">
                  Expand and collapse sections to focus on specific teams
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Database className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Offline Ready</h3>
                <p className="text-sm text-gray-600">
                  Data stored in browser IndexedDB for offline access
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}