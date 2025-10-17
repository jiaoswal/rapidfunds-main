import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Shield, 
  Bell, 
  Key, 
  Edit3,
  Save,
  X,
  Camera,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User as UserType, Organization, FundingRequest } from '@/lib/database';

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
    department: currentUser?.department || '',
    jobTitle: currentUser?.jobTitle || '',
    digestTime: currentUser?.digestTime || '09:00',
    notificationPreferences: currentUser?.notificationPreferences || { push: true, email: true }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch organization data
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  // Fetch user's funding requests
  const { data: userRequests } = useQuery<FundingRequest[]>({
    queryKey: ["/api/requests"],
    enabled: !!currentUser,
  });

  // Filter user's requests
  const myRequests = userRequests?.filter(req => req.requesterId === currentUser?.id) || [];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user/password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      fullName: currentUser?.fullName || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      department: currentUser?.department || '',
      jobTitle: currentUser?.jobTitle || '',
      digestTime: currentUser?.digestTime || '09:00',
      notificationPreferences: currentUser?.notificationPreferences || { push: true, email: true }
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>;
      case "Approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "Needs Info":
        return <Badge className="bg-blue-100 text-blue-800">Needs Info</Badge>;
      case "Closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Please log in</h3>
            <p className="text-gray-600">You need to be logged in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl">{currentUser.fullName}</CardTitle>
                <p className="text-muted-foreground">{currentUser.jobTitle || currentUser.role}</p>
                <Badge variant="outline" className="mt-2">
                  {currentUser.role}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{currentUser.email}</span>
                </div>
                {currentUser.phoneNumber && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{currentUser.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span>{currentUser.department || 'No department'}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Joined {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className={currentUser.isOnline ? 'text-green-600' : 'text-gray-500'}>
                    {currentUser.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="digestTime">Daily Digest Time</Label>
                        <Input
                          id="digestTime"
                          type="time"
                          value={formData.digestTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, digestTime: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications for important updates
                        </p>
                      </div>
                      <Switch
                        checked={formData.notificationPreferences.push}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences,
                              push: checked
                            }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for funding requests and approvals
                        </p>
                      </div>
                      <Switch
                        checked={formData.notificationPreferences.email}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences,
                              email: checked
                            }
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Verified</Label>
                        <p className="text-sm text-muted-foreground">
                          Your email address verification status
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {currentUser.emailVerified ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm text-yellow-600">Unverified</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Key className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and choose a new one
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleChangePassword}
                              disabled={changePasswordMutation.isPending}
                            >
                              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>My Funding Requests</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      View your submitted funding requests and their status
                    </p>
                  </CardHeader>
                  <CardContent>
                    {myRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                        <p className="text-gray-600">You haven't submitted any funding requests yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{request.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="font-medium text-gray-900">₹{request.amount.toLocaleString()}</span>
                                <span>{request.category}</span>
                                <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(request.status)}
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Organization Info */}
                {organization && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{organization.name}</p>
                          <p className="text-sm text-gray-500">Organization Code: {organization.orgCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
