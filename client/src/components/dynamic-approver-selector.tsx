import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Check, ChevronsUpDown, Users, Sparkles, AlertCircle, Clock, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/database';
import { apiRequest } from '@/lib/queryClient';

interface ApproverSelectorProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface ApproverWithMetadata extends User {
  pendingApprovals: number;
  isBusy: boolean;
  lastActiveAt: Date;
  department: string;
  aiScore?: number;
}

export default function DynamicApproverSelector({
  value,
  onChange,
  multiple = false,
  required = false,
  error,
  className,
  placeholder = "Select approver(s)...",
  disabled = false
}: ApproverSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ApproverWithMetadata[]>([]);

  // Fetch all users in the organization
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch pending approvals count for each user
  const { data: pendingApprovals } = useQuery<Record<string, number>>({
    queryKey: ["/api/pending-approvals"],
    enabled: !!allUsers,
  });

  // Process users to include metadata
  const approversWithMetadata: ApproverWithMetadata[] = useMemo(() => {
    if (!allUsers) return [];

    return allUsers
      .filter(user => user.role === 'Admin' || user.role === 'Approver')
      .map(user => ({
        ...user,
        pendingApprovals: pendingApprovals?.[user.id] || 0,
        isBusy: (pendingApprovals?.[user.id] || 0) > 5, // Consider busy if more than 5 pending
        lastActiveAt: new Date(user.createdAt), // Using createdAt as proxy for last active
        department: user.department || 'General',
        aiScore: Math.random() * 100 // Mock AI score for suggestions
      }))
      .sort((a, b) => {
        // Sort by: not busy first, then by pending approvals (ascending), then by name
        if (a.isBusy !== b.isBusy) return a.isBusy ? 1 : -1;
        if (a.pendingApprovals !== b.pendingApprovals) return a.pendingApprovals - b.pendingApprovals;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [allUsers, pendingApprovals]);

  // Filter approvers based on search query
  const filteredApprovers = useMemo(() => {
    if (!searchQuery.trim()) return approversWithMetadata;
    
    const query = searchQuery.toLowerCase();
    return approversWithMetadata.filter(approver => 
      approver.fullName.toLowerCase().includes(query) ||
      approver.jobTitle?.toLowerCase().includes(query) ||
      approver.department.toLowerCase().includes(query) ||
      approver.email.toLowerCase().includes(query)
    );
  }, [approversWithMetadata, searchQuery]);

  // AI-powered suggestions
  const generateAISuggestions = async () => {
    if (!allUsers) return;
    
    setShowAISuggestions(true);
    // Mock AI suggestions based on department, role, and workload
    const suggestions = approversWithMetadata
      .filter(approver => !approver.isBusy && approver.pendingApprovals < 3)
      .slice(0, 3);
    
    setAiSuggestions(suggestions);
  };

  // Handle selection
  const handleSelect = (approverId: string) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(approverId)
        ? currentValue.filter(id => id !== approverId)
        : [...currentValue, approverId];
      onChange(newValue);
    } else {
      onChange(approverId);
      setOpen(false);
    }
  };

  // Get selected approvers
  const selectedApprovers = useMemo(() => {
    const ids = Array.isArray(value) ? value : [value].filter(Boolean);
    return approversWithMetadata.filter(approver => ids.includes(approver.id));
  }, [value, approversWithMetadata]);

  // Render approver item
  const renderApproverItem = (approver: ApproverWithMetadata, isSelected: boolean) => (
    <CommandItem
      key={approver.id}
      value={approver.id}
      onSelect={() => handleSelect(approver.id)}
      className="flex items-center justify-between p-3 cursor-pointer"
    >
      <div className="flex items-center space-x-3 flex-1">
        <div className="flex-shrink-0">
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm truncate">
              {approver.fullName}
            </span>
            <Badge variant="secondary" className="text-xs">
              {approver.role}
            </Badge>
            {approver.isBusy && (
              <Badge variant="destructive" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Busy
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{approver.jobTitle}</span>
            <span>•</span>
            <span>{approver.department}</span>
            <span>•</span>
            <span>{approver.pendingApprovals} pending</span>
          </div>
        </div>
      </div>
    </CommandItem>
  );

  if (isLoadingUsers) {
    return (
      <div className="space-y-2">
        <Label>Approver Selection</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="approver-selector">
          {multiple ? 'Approvers' : 'Approver'} {required && '*'}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generateAISuggestions}
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI Suggestions
        </Button>
      </div>

      {/* AI Suggestions */}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">AI Recommended Approvers</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAISuggestions(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="space-y-1">
              {aiSuggestions.map(approver => (
                <div
                  key={approver.id}
                  className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelect(approver.id)}
                >
                  <div>
                    <span className="text-sm font-medium">{approver.fullName}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {approver.department} • {approver.pendingApprovals} pending
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-destructive"
            )}
            disabled={disabled}
          >
            {selectedApprovers.length > 0 ? (
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {selectedApprovers.length === 1 ? (
                  <span className="truncate">
                    {selectedApprovers[0].fullName} ({selectedApprovers[0].role})
                  </span>
                ) : (
                  <span className="truncate">
                    {selectedApprovers.length} approver(s) selected
                  </span>
                )}
              </div>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search approvers..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="text-center py-6">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No approvers found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search or contact an admin
                  </p>
                </div>
              </CommandEmpty>
              
              <CommandGroup>
                {filteredApprovers.map(approver => {
                  const isSelected = Array.isArray(value) 
                    ? value.includes(approver.id)
                    : value === approver.id;
                  
                  return (
                    <TooltipProvider key={approver.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {renderApproverItem(approver, isSelected)}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <div className="font-medium">{approver.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              Email: {approver.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Department: {approver.department}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Pending Approvals: {approver.pendingApprovals}
                            </div>
                            {approver.isBusy && (
                              <div className="text-xs text-orange-600">
                                ⚠️ High workload - may take longer to respond
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Approvers Display (for multiple selection) */}
      {multiple && selectedApprovers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Selected Approvers:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedApprovers.map(approver => (
              <Badge
                key={approver.id}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{approver.fullName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleSelect(approver.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        {multiple 
          ? "Select one or more approvers for this request. Use AI suggestions for optimal selection."
          : "Select the primary approver for this request. Use AI suggestions for optimal selection."
        }
      </p>
    </div>
  );
}
