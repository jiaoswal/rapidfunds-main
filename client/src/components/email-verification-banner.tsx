import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, CheckCircle } from "lucide-react";
import { getSentEmails } from "@/lib/emailService";

export function EmailVerificationBanner() {
  const { user, resendVerificationMutation, isEmailVerified } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Don't show banner if user is not logged in, email is verified, or banner is dismissed
  if (!user || isEmailVerified || isDismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      await resendVerificationMutation.mutateAsync();
      // Show success message
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const sentEmails = getSentEmails();
  const verificationEmail = sentEmails.find(email => 
    email.type === 'verification' && email.to === user.email
  );

  return (
    <div className="relative">
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Please verify your email address
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              We've sent a verification email to <strong>{user.email}</strong>. 
              Click the link in the email to verify your account and access all features.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendEmail}
                disabled={resendVerificationMutation.isPending}
                className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900"
              >
                {resendVerificationMutation.isPending ? "Sending..." : "Resend Email"}
              </Button>
              {verificationEmail && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
                >
                  {showEmailPreview ? "Hide" : "Show"} Email Preview
                </Button>
              )}
            </div>
            {showEmailPreview && verificationEmail && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border text-xs">
                <div className="mb-2">
                  <strong>To:</strong> {verificationEmail.to}
                </div>
                <div className="mb-2">
                  <strong>Subject:</strong> {verificationEmail.subject}
                </div>
                <div className="mb-2">
                  <strong>Verification Link:</strong> 
                  <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono break-all">
                    {verificationEmail.url}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Note:</strong> This is a demo environment. In production, you would receive this email in your inbox.
                </div>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
