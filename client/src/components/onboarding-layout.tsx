import { Link } from "wouter";
import { Building2 } from "lucide-react";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function OnboardingLayout({ children, title, description }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-green-500 p-12 text-white flex-col justify-between">
        <div>
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <span className="text-2xl font-bold">RapidFunds</span>
            </div>
          </Link>

          <h1 className="text-5xl font-bold mb-6">
            Streamline Your Funding Approvals
          </h1>
          <p className="text-xl text-blue-50 mb-12">
            RapidFunds makes it easy to manage internal funding requests with a professional dashboard,
            approval workflows, and visual organizational charts.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Smart Request Management</h3>
                <p className="text-blue-100">Track and manage funding requests with AI-powered summaries</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Visual Org Charts</h3>
                <p className="text-blue-100">Drag-and-drop organizational structure visualization</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Role-Based Access</h3>
                <p className="text-blue-100">Secure permissions for Admins, Approvers, and Requesters</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-blue-100">
          © 2025 RapidFunds. All rights reserved.
        </div>
      </div>

      {/* Right side - Form area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md my-8">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" data-testid="link-home-mobile">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">RapidFunds</span>
              </div>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
