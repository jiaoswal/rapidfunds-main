import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Shield, Building2 } from "lucide-react";
import { authManager } from "@/lib/browserAuth";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regInviteCode, setRegInviteCode] = useState("");
  const [regOrgName, setRegOrgName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");

  // Validate invite code and auto-fill organization name
  useEffect(() => {
    const validateInviteCode = async () => {
      if (regInviteCode && regInviteCode.length >= 8) {
        try {
          const inviteData = await authManager.validateInviteCode(regInviteCode);
          if (inviteData) {
            setRegOrgName(inviteData.orgName);
          } else {
            setRegOrgName("");
          }
        } catch (error) {
          setRegOrgName("");
        }
      } else {
        setRegOrgName("");
      }
    };

    validateInviteCode();
  }, [regInviteCode]);

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: loginEmail,
      password: loginPassword,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      inviteCode: regInviteCode,
      email: regEmail,
      password: regPassword,
      fullName: regFullName,
      phoneNumber: regPhoneNumber,
    } as any);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
              RF
            </div>
            <h1 className="ml-3 text-2xl font-bold text-foreground">RapidFunds</h1>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Join Org</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to your organization account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        data-testid="input-login-email"
                        type="email"
                        placeholder="name@company.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="input-login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="text-center">
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot your password?
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Join your organization on RapidFunds</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-invitecode">Invite Code</Label>
                      <Input
                        id="reg-invitecode"
                        data-testid="input-register-invitecode"
                        placeholder="Get this from your admin"
                        value={regInviteCode}
                        onChange={(e) => setRegInviteCode(e.target.value.toUpperCase())}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the invite code provided by your organization admin
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-orgname">Organization Name</Label>
                      <Input
                        id="reg-orgname"
                        data-testid="input-register-orgname"
                        placeholder="Will be auto-filled from invite code"
                        value={regOrgName}
                        onChange={(e) => setRegOrgName(e.target.value)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-fullname">Full Name</Label>
                      <Input
                        id="reg-fullname"
                        data-testid="input-register-fullname"
                        placeholder="John Doe"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        data-testid="input-register-email"
                        type="email"
                        placeholder="name@company.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phonenumber">Phone Number</Label>
                      <Input
                        id="reg-phonenumber"
                        data-testid="input-register-phonenumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={regPhoneNumber}
                        onChange={(e) => setRegPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        data-testid="input-register-password"
                        type="password"
                        placeholder="Create a password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Joining organization..." : "Join Organization"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Don't have an organization yet?</p>
            <Link href="/create-org">
              <Button variant="outline" className="w-full" data-testid="button-create-org-link">
                <Building2 className="h-4 w-4 mr-2" />
                Create New Organization
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Hero/Info Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-secondary p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">Streamline Your Funding Approvals</h2>
          <p className="text-lg text-white/90 mb-8">
            RapidFunds makes it easy to manage internal funding requests with a professional dashboard,
            approval workflows, and visual organizational charts.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Request Management</h3>
                <p className="text-white/80 text-sm">Track and manage funding requests with AI-powered summaries</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Visual Org Charts</h3>
                <p className="text-white/80 text-sm">Drag-and-drop organizational structure visualization</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Role-Based Access</h3>
                <p className="text-white/80 text-sm">Secure permissions for Admins, Approvers, and Requesters</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
