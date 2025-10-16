import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Trash2, Eye, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { getSentEmails, clearSentEmails, getEmailPreview } from "@/lib/emailService";

export default function EmailDemoPage() {
  const { user, resendVerificationMutation, requestPasswordResetMutation } = useAuth();
  const [sentEmails, setSentEmails] = useState(getSentEmails());
  const [selectedEmailType, setSelectedEmailType] = useState<'verification' | 'password-reset' | 'welcome'>('verification');

  const refreshEmails = () => {
    setSentEmails(getSentEmails());
  };

  const clearEmails = () => {
    clearSentEmails();
    setSentEmails([]);
  };

  const sendTestVerification = async () => {
    if (!user) return;
    try {
      await resendVerificationMutation.mutateAsync();
      refreshEmails();
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  };

  const sendTestPasswordReset = async () => {
    if (!user) return;
    try {
      await requestPasswordResetMutation.mutateAsync(user.email);
      refreshEmails();
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'password-reset':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'welcome':
        return <Mail className="h-4 w-4 text-green-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEmailTypeBadge = (type: string) => {
    switch (type) {
      case 'verification':
        return <Badge variant="secondary">Verification</Badge>;
      case 'password-reset':
        return <Badge variant="destructive">Password Reset</Badge>;
      case 'welcome':
        return <Badge className="bg-green-100 text-green-800">Welcome</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Demo</h1>
          <p className="text-muted-foreground mt-1">
            Test and preview email functionality in RapidFunds
          </p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            This is a demo environment. Emails are stored locally and can be previewed below. 
            In production, these would be sent via email service providers like SendGrid, Mailgun, or AWS SES.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Send Test Emails</CardTitle>
              <CardDescription>
                Send test emails to see how they work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={sendTestVerification} 
                  disabled={resendVerificationMutation.isPending}
                  className="w-full"
                >
                  {resendVerificationMutation.isPending ? "Sending..." : "Send Verification Email"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Sends an email verification link to {user?.email}
                </p>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={sendTestPasswordReset} 
                  disabled={requestPasswordResetMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {requestPasswordResetMutation.isPending ? "Sending..." : "Send Password Reset Email"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Sends a password reset link to {user?.email}
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button onClick={refreshEmails} variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={clearEmails} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Email Statistics</CardTitle>
              <CardDescription>
                Overview of sent emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Emails Sent</span>
                  <Badge variant="outline">{sentEmails.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Emails</span>
                  <Badge variant="outline">
                    {sentEmails.filter(e => e.type === 'verification').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Password Reset Emails</span>
                  <Badge variant="outline">
                    {sentEmails.filter(e => e.type === 'password-reset').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Welcome Emails</span>
                  <Badge variant="outline">
                    {sentEmails.filter(e => e.type === 'welcome').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sent Emails List */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Emails</CardTitle>
            <CardDescription>
              All emails sent in this session (stored locally for demo)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails sent yet</p>
                <p className="text-sm">Send a test email to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentEmails.map((email, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEmailTypeIcon(email.type)}
                        <span className="font-medium">{email.subject}</span>
                        {getEmailTypeBadge(email.type)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(email.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>To:</strong> {email.to}
                    </div>
                    {email.url && (
                      <div className="text-xs">
                        <strong>Link:</strong> 
                        <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono break-all">
                          {email.url}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              Preview the HTML content of different email types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedEmailType} onValueChange={(v) => setSelectedEmailType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
                <TabsTrigger value="welcome">Welcome</TabsTrigger>
              </TabsList>
              
              <TabsContent value="verification" className="mt-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Verification Email Template
                  </div>
                  <div 
                    className="border rounded p-4 bg-white text-xs overflow-auto max-h-96"
                    dangerouslySetInnerHTML={{ 
                      __html: getEmailPreview('verification') || 
                      '<p>No verification email template available</p>' 
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="password-reset" className="mt-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Password Reset Email Template
                  </div>
                  <div 
                    className="border rounded p-4 bg-white text-xs overflow-auto max-h-96"
                    dangerouslySetInnerHTML={{ 
                      __html: getEmailPreview('password-reset') || 
                      '<p>No password reset email template available</p>' 
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="welcome" className="mt-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Welcome Email Template
                  </div>
                  <div 
                    className="border rounded p-4 bg-white text-xs overflow-auto max-h-96"
                    dangerouslySetInnerHTML={{ 
                      __html: getEmailPreview('welcome') || 
                      '<p>No welcome email template available</p>' 
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
