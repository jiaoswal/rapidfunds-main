import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Plus, 
  User, 
  Users, 
  Building2,
  Mail,
  Phone,
  UserPlus,
  Sparkles,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User as UserType, OrgMember, OrgChart } from '@/lib/database';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface SmartMemberAdderProps {
  onMemberAdded?: () => void;
  className?: string;
}

export default function SmartMemberAdder({ onMemberAdded, className }: SmartMemberAdderProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<UserType | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(2);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Fetch all users in the organization
  const { data: allUsers, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: !!currentUser?.orgId,
  });

  // Fetch org members
  const { data: orgMembers, isLoading: membersLoading } = useQuery<OrgMember[]>({
    queryKey: ["/api/org-members"],
    enabled: !!currentUser?.orgId,
  });

  // Fetch org chart nodes
  const { data: orgChart, isLoading: chartLoading } = useQuery<OrgChart | null>({
    queryKey: ["/api/org-chart"],
    enabled: !!currentUser?.orgId,
  });

  // Filter users who are not already in org chart
  const availableUsers = React.useMemo(() => {
    if (!allUsers || !orgChart?.nodes) return [];
    
    const chartUserIds = orgChart.nodes.map((node: any) => node.userId).filter(Boolean);
    return allUsers.filter(user => !chartUserIds.includes(user.id));
  }, [allUsers, orgChart]);

  // Filter members based on search
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return availableUsers;
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(user =>
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  // Get available parent nodes (existing org chart nodes)
  const availableParents = React.useMemo(() => {
    if (!orgChart?.nodes) return [];
    return orgChart.nodes.filter((node: any) => node.userId); // Only nodes with users
  }, [orgChart]);

  // Add member to org chart mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { userId: string; parentId?: string; level: number }) => {
      const response = await apiRequest("POST", "/api/org-chart", {
        nodes: [{
          userId: data.userId,
          parentId: data.parentId,
          level: data.level,
          name: allUsers?.find(u => u.id === data.userId)?.fullName || 'Unknown',
          role: allUsers?.find(u => u.id === data.userId)?.jobTitle || 'Member',
          department: allUsers?.find(u => u.id === data.userId)?.department || 'General',
          position: { x: 0, y: 0 },
          color: data.level === 1 ? 'purple' : 'blue',
          shape: 'rectangle',
          isExpanded: true,
          isApproved: true,
          email: allUsers?.find(u => u.id === data.userId)?.email || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-members"] });
      toast({
        title: "Success",
        description: "Member added to organization chart successfully!",
      });
      setIsOpen(false);
      setSelectedMember(null);
      setSelectedParentId(null);
      setSearchQuery('');
      onMemberAdded?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member to org chart",
        variant: "destructive",
      });
    },
  });

  // Create new member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (data: { email: string; fullName: string; role: string; department?: string }) => {
      const response = await apiRequest("POST", "/api/users", {
        email: data.email,
        password: 'temp123', // Temporary password
        fullName: data.fullName,
        role: data.role as 'Admin' | 'Approver' | 'Finance' | 'Member' | 'Requester',
        department: data.department,
        digestTime: '09:00',
        notificationPreferences: { push: true, email: true },
        isOnline: false,
        customFieldsData: {},
        emailVerified: true
      });
      return response.json();
    },
    onSuccess: (newUser) => {
      // Add the new user to org chart
      addMemberMutation.mutate({
        userId: newUser.id,
        parentId: selectedParentId || undefined,
        level: selectedLevel
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create new member",
        variant: "destructive",
      });
    },
  });

  const handleAddMember = () => {
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Please select a member to add",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate({
      userId: selectedMember.id,
      parentId: selectedParentId || undefined,
      level: selectedLevel
    });
  };

  const handleCreateNewMember = (formData: any) => {
    createMemberMutation.mutate(formData);
  };

  const getLevelDescription = (level: number) => {
    const descriptions = {
      1: "Executive Level (CEO, CTO, etc.)",
      2: "Management Level (Managers, Directors)",
      3: "Senior Level (Senior Staff, Team Leads)",
      4: "Staff Level (Regular Employees)",
      5: "Entry Level (Junior Staff, Interns)"
    };
    return descriptions[level as keyof typeof descriptions] || "Unknown Level";
  };

  if (usersLoading || membersLoading || chartLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading member data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          Smart Member Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{allUsers?.length || 0}</div>
            <div className="text-sm text-blue-800">Total Users</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{orgChart?.nodes?.length || 0}</div>
            <div className="text-sm text-green-800">In Org Chart</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{availableUsers.length}</div>
            <div className="text-sm text-orange-800">Available to Add</div>
          </div>
        </div>

        {/* Add Member Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Members to Org Chart
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Smart Member Addition
              </DialogTitle>
              <DialogDescription>
                Add existing members to your organization chart or create new members
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Toggle between existing and new members */}
              <div className="flex space-x-2">
                <Button
                  variant={!isCreatingNew ? "default" : "outline"}
                  onClick={() => setIsCreatingNew(false)}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Existing Member
                </Button>
                <Button
                  variant={isCreatingNew ? "default" : "outline"}
                  onClick={() => setIsCreatingNew(true)}
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New Member
                </Button>
              </div>

              {!isCreatingNew ? (
                // Add existing member
                <div className="space-y-4">
                  <div>
                    <Label>Search Members</Label>
                    <Command>
                      <CommandInput
                        placeholder="Search by name, email, or department..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList className="max-h-48">
                        <CommandEmpty>
                          {availableUsers.length === 0 ? "No available members to add" : "No members found"}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => setSelectedMember(user)}
                              className="flex items-center justify-between p-3"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-white">
                                    {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{user.fullName}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                  <p className="text-xs text-gray-500">{user.department} • {user.role}</p>
                                </div>
                              </div>
                              {selectedMember?.id === user.id && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                </div>
              ) : (
                // Create new member form
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" placeholder="Enter full name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter email" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Member">Member</SelectItem>
                          <SelectItem value="Approver">Approver</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Requester">Requester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" placeholder="Enter department" />
                    </div>
                  </div>
                </div>
              )}

              {/* Hierarchy Settings */}
              <div className="space-y-4">
                <div>
                  <Label>Parent Node (Optional)</Label>
                  <Select value={selectedParentId || ""} onValueChange={setSelectedParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent node (leave empty for root level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Parent (Root Level)</SelectItem>
                      {availableParents.map((parent: any) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name} (Level {parent.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Hierarchy Level</Label>
                  <Select value={selectedLevel.toString()} onValueChange={(value) => setSelectedLevel(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          Level {level} - {getLevelDescription(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Member Preview */}
              {selectedMember && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {selectedMember.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedMember.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedMember.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{selectedMember.role}</Badge>
                        <Badge variant="outline">{selectedMember.department}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedMember(null);
                    setSelectedParentId(null);
                    setSearchQuery('');
                    setIsCreatingNew(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedMember || addMemberMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {addMemberMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Org Chart
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Add Multiple
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/test-db', '_blank')}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Debug Tools
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
