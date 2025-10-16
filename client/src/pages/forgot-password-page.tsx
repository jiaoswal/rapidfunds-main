import { useState } from "react";
import { Link } from "wouter";
import { authManager } from "@/lib/browserAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');
      
      await authManager.requestPasswordReset(email);
      
      setIsSubmitted(true);
      setMessage('If an account with that email exists, we\'ve sent you a password reset link.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendEmail = async () => {
    if (!email) return;
    
    try {
      setIsSubmitting(true);
      setMessage('');
      
      await authManager.requestPasswordReset(email);
      
      setMessage('Password reset email sent again!');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isSubmitted ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <Mail className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle>
            {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
          </CardTitle>
          <CardDescription>
            {isSubmitted 
              ? 'We\'ve sent you a password reset link if your account exists.'
              : 'Enter your email address and we\'ll send you a link to reset your password.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {message && (
                <Alert variant={message.includes('sent') ? 'default' : 'destructive'}>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !email}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button onClick={resendEmail} variant="outline" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Resend Email'}
                </Button>
                <Button onClick={() => setIsSubmitted(false)} variant="ghost" className="w-full">
                  Try Different Email
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>
              Remember your password?{' '}
              <Link href="/auth" className="text-primary hover:underline">
                Back to Login
              </Link>
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-2">
            <p>
              Don't have an account?{' '}
              <Link href="/auth" className="text-primary hover:underline">
                Sign up here
              </Link>
            </p>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>
              If you don't receive an email within a few minutes, check your spam folder
              or contact your organization administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
