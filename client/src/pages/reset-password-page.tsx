import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { authManager } from "@/lib/browserAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      setStatus('error');
      setMessage('No reset token provided');
      return;
    }

    setToken(tokenParam);
    // For demo purposes, we'll assume the token is valid
    // In a real app, you might want to validate the token first
    setStatus('ready');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');
      
      await authManager.resetPassword(token, newPassword);
      
      setStatus('success');
      setMessage('Your password has been successfully reset! You can now log in with your new password.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      
      if (errorMessage.includes('expired')) {
        setStatus('expired');
        setMessage('This reset link has expired. Please request a new password reset.');
      } else if (errorMessage.includes('already been used')) {
        setStatus('expired');
        setMessage('This reset link has already been used. Please request a new password reset.');
      } else {
        setStatus('error');
        setMessage(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    setLocation('/auth');
  };

  const requestNewReset = () => {
    setLocation('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {(status === 'error' || status === 'expired') && <XCircle className="h-12 w-12 text-red-500" />}
            {status === 'ready' && <Lock className="h-12 w-12 text-primary" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Validating Link...'}
            {status === 'ready' && 'Reset Password'}
            {status === 'success' && 'Password Reset!'}
            {(status === 'error' || status === 'expired') && 'Reset Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we validate your reset link.'}
            {status === 'ready' && 'Enter your new password below.'}
            {status === 'success' && 'Your password has been successfully reset.'}
            {(status === 'error' || status === 'expired') && 'There was a problem resetting your password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                />
              </div>

              {message && (
                <Alert variant={message.includes('successfully') ? 'default' : 'destructive'}>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !newPassword || !confirmPassword}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {(status === 'success' || status === 'error' || status === 'expired') && (
            <div className="space-y-4">
              {message && (
                <Alert variant={status === 'success' ? 'default' : 'destructive'}>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {status === 'success' && (
                  <Button onClick={goToLogin} className="w-full">
                    Go to Login
                  </Button>
                )}

                {(status === 'error' || status === 'expired') && (
                  <div className="space-y-2">
                    <Button onClick={requestNewReset} className="w-full">
                      Request New Reset Link
                    </Button>
                    <Button onClick={goToLogin} variant="outline" className="w-full">
                      Back to Login
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>
              Password must be at least 6 characters long and contain a mix of letters and numbers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
