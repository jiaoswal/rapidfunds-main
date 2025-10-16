import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { OnboardingLayout } from "@/components/onboarding-layout";
import { Building2, Sparkles, LogIn } from "lucide-react";
import { nanoid } from "nanoid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export default function CreateOrgPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { registerMutation } = useAuth();

  const [orgCode, setOrgCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Use the registerMutation from auth context which handles auto-login
  // Handle redirect to dashboard after successful organization creation
  useEffect(() => {
    if (registerMutation.isSuccess && registerMutation.data) {
      toast({
        title: "Success",
        description: "Organization created successfully! You are now logged in.",
      });
      setLocation("/dashboard");
    }
  }, [registerMutation.isSuccess, registerMutation.data, toast, setLocation]);

  const generateOrgCode = () => {
    const code = nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, '');
    setOrgCode(code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (adminPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (adminPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      orgCode,
      name: orgName,
      adminEmail,
      adminPassword,
      adminFullName,
    });
  };

  return (
    <OnboardingLayout
      title="Create Your Organization"
      description="Set up your organization and admin account. You'll be automatically logged in after creation."
    >
      <Alert className="mb-6">
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          After creating your organization, you'll be automatically logged in as the admin.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-primary rounded-md">
                <p className="text-sm font-medium text-foreground mb-2">Organization Details</p>
                <p className="text-xs text-muted-foreground">
                  Choose a unique organization code that your team will use to join
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgCode">Organization Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="orgCode"
                    data-testid="input-org-code"
                    placeholder="e.g., ACME2024"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                    required
                    maxLength={50}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateOrgCode}
                    data-testid="button-generate-code"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This code will be used by team members to join your organization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  data-testid="input-org-name"
                  placeholder="e.g., Acme Corporation"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-600 rounded-md">
                <p className="text-sm font-medium text-foreground mb-2">Admin Account</p>
                <p className="text-xs text-muted-foreground">
                  Create the first admin account for your organization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminFullName">Admin Full Name *</Label>
                <Input
                  id="adminFullName"
                  data-testid="input-admin-name"
                  placeholder="John Doe"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  data-testid="input-admin-email"
                  type="email"
                  placeholder="admin@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  data-testid="input-admin-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  data-testid="input-confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            data-testid="button-create-org"
            className="w-full"
          >
            {registerMutation.isPending ? "Creating Organization..." : "Create Organization"}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline inline-flex items-center"
            onClick={() => setLocation("/login")}
            data-testid="link-login"
          >
            <LogIn className="h-3 w-3 mr-1" />
            Sign in
          </button>
        </p>
      </div>
      </div>
    </OnboardingLayout>
  );
}
