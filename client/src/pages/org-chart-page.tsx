import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import HierarchyVisualization from "@/components/hierarchy-visualization";
import AdminOrgChartManager from "@/components/admin-org-chart-manager";
import { seedOrgChartData } from "@/lib/orgChartDB";
import { useEffect } from "react";
import { 
  Users, 
  Settings,
  RefreshCw,
  Database
} from "lucide-react";

export default function OrgChartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = user?.role === 'Admin';

  // Initialize org chart data on component mount
  useEffect(() => {
    const initializeOrgChart = async () => {
      try {
        await seedOrgChartData();
        console.log('Org chart data initialized');
      } catch (error) {
        console.error('Error initializing org chart data:', error);
      }
    };

    initializeOrgChart();
  }, []);

  const handleRefresh = async () => {
    try {
      await seedOrgChartData();
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
          >
            <RefreshCw className="h-4 w-4" />
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