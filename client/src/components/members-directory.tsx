import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Activity,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { User as UserType } from '@/lib/database';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface MembersDirectoryProps {
  className?: string;
}

type SortField = 'fullName' | 'department' | 'role' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function MembersDirectory({ className }: MembersDirectoryProps) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  // Fetch all users in the organization
  const { data: allUsers, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Get unique departments for filter
  const departments = React.useMemo(() => {
    if (!allUsers) return [];
    const deptSet = new Set(allUsers.map(user => user.department).filter(Boolean));
    return Array.from(deptSet).sort();
  }, [allUsers]);

  // Filter and sort users
  const filteredAndSortedUsers = React.useMemo(() => {
    if (!allUsers) return [];

    let filtered = allUsers.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;

      return matchesSearch && matchesDepartment;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortField) {
        case 'fullName':
          aValue = a.fullName;
          bValue = b.fullName;
          break;
        case 'department':
          aValue = a.department || '';
          bValue = b.department || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.fullName;
          bValue = b.fullName;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allUsers, searchTerm, sortField, sortOrder, filterDepartment]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Approver':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members Directory
          <Badge variant="secondary" className="ml-2">
            {filteredAndSortedUsers.length} members
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Sort by:
          </span>
          {(['fullName', 'department', 'role', 'createdAt'] as SortField[]).map(field => (
            <Button
              key={field}
              variant={sortField === field ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort(field)}
              className="flex items-center gap-1"
            >
              {field === 'fullName' && 'Name'}
              {field === 'department' && 'Department'}
              {field === 'role' && 'Role'}
              {field === 'createdAt' && 'Join Date'}
              {sortField === field && (
                sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
              )}
            </Button>
          ))}
        </div>

        {/* Members List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No members found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredAndSortedUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                  user.id === currentUser?.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={user.fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {user.fullName}
                      {user.id === currentUser?.id && (
                        <span className="text-blue-600 text-sm ml-1">(You)</span>
                      )}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    {user.jobTitle && (
                      <span className="truncate">{user.jobTitle}</span>
                    )}
                    {user.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {user.department}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    {user.phoneNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phoneNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-col items-end gap-1">
                  <div className={`flex items-center gap-1 text-xs ${
                    user.isOnline ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <Activity className="h-3 w-3" />
                    {user.isOnline ? 'Online' : 'Offline'}
                  </div>
                  {user.emailVerified && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {allUsers && allUsers.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {allUsers.filter(u => u.role === 'Admin').length}
                </div>
                <div className="text-xs text-gray-600">Admins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {allUsers.filter(u => u.role === 'Member').length}
                </div>
                <div className="text-xs text-gray-600">Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {allUsers.filter(u => u.role === 'Approver').length}
                </div>
                <div className="text-xs text-gray-600">Approvers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {allUsers.filter(u => u.isOnline).length}
                </div>
                <div className="text-xs text-gray-600">Online</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
