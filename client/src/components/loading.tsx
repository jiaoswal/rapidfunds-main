import { Loader2, FileText, Users, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function LoadingCard({ 
  title = "Loading...", 
  description = "Please wait while we load your data.",
  icon,
  className 
}: LoadingCardProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4">
        {icon || <LoadingSpinner size="lg" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function LoadingPage({ 
  title = "Loading...", 
  description = "Please wait while we load your data.",
  icon
}: LoadingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingCard title={title} description={description} icon={icon} />
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

interface LoadingTableProps {
  rows?: number;
  columns?: number;
}

export function LoadingTable({ rows = 5, columns = 4 }: LoadingTableProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className={cn(
                'h-4 bg-muted rounded animate-pulse',
                colIndex === columns - 1 ? 'w-3/4' : 'w-full'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Specific loading components for different features
export function DashboardLoading() {
  return (
    <LoadingPage
      title="Loading Dashboard"
      description="Fetching your funding requests and organization data..."
      icon={<TrendingUp className="h-12 w-12 text-primary animate-pulse" />}
    />
  );
}

export function RequestsLoading() {
  return (
    <LoadingPage
      title="Loading Requests"
      description="Fetching your funding requests..."
      icon={<FileText className="h-12 w-12 text-primary animate-pulse" />}
    />
  );
}

export function UsersLoading() {
  return (
    <LoadingPage
      title="Loading Users"
      description="Fetching organization members..."
      icon={<Users className="h-12 w-12 text-primary animate-pulse" />}
    />
  );
}

export function SettingsLoading() {
  return (
    <LoadingPage
      title="Loading Settings"
      description="Fetching organization settings..."
      icon={<Settings className="h-12 w-12 text-primary animate-pulse" />}
    />
  );
}

// Inline loading component for buttons and small areas
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text = "Loading...", className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
}
