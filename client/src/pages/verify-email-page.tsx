import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { authManager } from "@/lib/browserAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    setToken(tokenParam);
    verifyEmail(tokenParam);
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setStatus('loading');
      await authManager.verifyEmail(verificationToken);
      setStatus('success');
      setMessage('Your email has been successfully verified! You can now access all features of RapidFunds.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      
      if (errorMessage.includes('expired')) {
        setStatus('expired');
        setMessage('This verification link has expired. Please request a new verification email.');
      } else if (errorMessage.includes('already verified')) {
        setStatus('already-verified');
        setMessage('Your email has already been verified. You can continue using RapidFunds.');
      } else {
        setStatus('error');
        setMessage(errorMessage);
      }
    }
  };

  const resendVerification = async () => {
    try {
      await authManager.resendVerificationEmail();
      setMessage('A new verification email has been sent to your email address.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to resend verification email');
    }
  };

  const goToDashboard = () => {
    setLocation('/dashboard');
  };

  const goToLogin = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {(status === 'error' || status === 'expired') && <XCircle className="h-12 w-12 text-red-500" />}
            {status === 'already-verified' && <CheckCircle className="h-12 w-12 text-blue-500" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'expired' && 'Link Expired'}
            {status === 'already-verified' && 'Already Verified'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your email has been successfully verified.'}
            {status === 'error' && 'There was a problem verifying your email.'}
            {status === 'expired' && 'This verification link has expired.'}
            {status === 'already-verified' && 'Your email is already verified.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {status === 'success' && (
              <Button onClick={goToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            )}

            {status === 'already-verified' && (
              <Button onClick={goToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            )}

            {status === 'expired' && (
              <div className="space-y-2">
                <Button onClick={resendVerification} variant="outline" className="w-full">
                  Resend Verification Email
                </Button>
                <Button onClick={goToLogin} variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <Button onClick={resendVerification} variant="outline" className="w-full">
                  Try Resending Email
                </Button>
                <Button onClick={goToLogin} variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              If you continue to have issues, please contact your organization administrator
              or check your email spam folder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
