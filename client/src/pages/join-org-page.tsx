import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { OnboardingLayout } from "@/components/onboarding-layout";
import { AlertCircle, CheckCircle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function JoinOrgPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const inviteToken = new URLSearchParams(searchParams).get("token");

  const [orgCode, setOrgCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("");
  const [department, setDepartment] = useState("");

  // Validate invite token if present
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["/api/invite-tokens/validate", inviteToken],
    queryFn: async () => {
      if (!inviteToken) return null;
      const res = await fetch(`/api/invite-tokens/validate/${inviteToken}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid token");
      }
      return res.json();
    },
    enabled: !!inviteToken,
    retry: false,
  });

  useEffect(() => {
    if (tokenData && tokenData.valid) {
      setRole(tokenData.role);
      setOrgCode(tokenData.orgCode);
    }
  }, [tokenData]);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Registration failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your account has been created. Please log in.",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      orgCode,
      email,
      password,
      fullName,
      role,
      department: department || null,
      customFieldsData: {},
      inviteToken: inviteToken || undefined,
    });
  };

  const isTokenValid: boolean = Boolean(inviteToken && tokenData && tokenData.valid);
  const isRoleLocked: boolean = isTokenValid;

  return (
    <OnboardingLayout
      title="Join Organization"
      description={inviteToken ? "Complete your registration using the invite link" : "Sign up to join an existing organization"}
    >
      {tokenLoading && inviteToken && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Validating invite link...</AlertDescription>
        </Alert>
      )}

      {inviteToken && !tokenLoading && !isTokenValid && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This invite link is invalid or has expired. Please use a valid invite link or enter your organization code manually.
          </AlertDescription>
        </Alert>
      )}

      {inviteToken && isTokenValid && (
        <Alert className="mb-4 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Invite link validated! Your role has been pre-assigned.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-code">Organization Code</Label>
          <Input
            id="org-code"
            data-testid="input-org-code"
            placeholder="Enter organization code"
            value={orgCode}
            onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
            required
            disabled={isTokenValid}
          />
          {!inviteToken && (
            <p className="text-xs text-muted-foreground">
              Don't have a code? Ask your admin for an invite link or organization code.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input
            id="full-name"
            data-testid="input-full-name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            data-testid="input-email"
            type="email"
            placeholder="your.email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            data-testid="input-password"
            type="password"
            placeholder="Create a password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            data-testid="input-confirm-password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={setRole} disabled={isRoleLocked}>
            <SelectTrigger id="role" data-testid="select-role">
              <SelectValue placeholder={isRoleLocked ? "Pre-assigned by invite" : "Select your role"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Requester">Requester</SelectItem>
              <SelectItem value="Approver">Approver</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {isRoleLocked ? (
            <p className="text-xs text-muted-foreground">
              Your role has been pre-assigned by the admin who sent you the invite link.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department (Optional)</Label>
          <Input
            id="department"
            data-testid="input-department"
            placeholder="e.g., Engineering, Marketing"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
          data-testid="button-register"
        >
          {registerMutation.isPending ? "Creating account..." : "Create Account"}
        </Button>
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
    </OnboardingLayout>
  );
}
