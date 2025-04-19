'use client';

import { startTransition, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';
import { updatePassword } from '@/app/(login)/actions';

type ActionState = {
  error?: string;
  success?: string;
};

export default function PasswordChangePage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    ActionState,
    FormData
  >(updatePassword, { error: '', success: '' });

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    startTransition(() => {
      passwordAction(new FormData(event.currentTarget));
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 sm:px-0">
      <h1 className="text-lg font-medium mb-4">Change Password</h1>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Update Password</CardTitle>
          <p className="text-xs text-muted-foreground">
            Keep your account secure with a strong password
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handlePasswordSubmit}>
            <div>
              <Label htmlFor="current-password" className="text-xs">
                Current Password
              </Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                className="h-9 mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="text-xs">
                New Password
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                className="h-9 mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-xs">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
                className="h-9 mt-1.5"
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-xs">{passwordState.error}</p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-xs">{passwordState.success}</p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-3.5 w-3.5" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 