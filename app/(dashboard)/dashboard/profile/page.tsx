'use client';

import { startTransition, use, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { updateAccount } from '@/app/(login)/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type ActionState = {
  error?: string;
  success?: string;
};

export default function ProfilePage() {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    { error: '', success: '' }
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      formAction(new FormData(event.currentTarget));
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 sm:px-0">
      <h1 className="text-lg font-medium mb-4">My Profile</h1>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage alt={user.name || ''} />
              <AvatarFallback className="text-sm">
                {user.name
                  ? user.name.split(' ').map((n) => n[0]).join('')
                  : user.email.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{user.name || 'User'}</CardTitle>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" className="text-xs">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                defaultValue={user.name || ''}
                required
                className="h-9 mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={user.email || ''}
                required
                className="h-9 mt-1.5"
              />
            </div>
            {state.error && (
              <p className="text-red-500 text-xs">{state.error}</p>
            )}
            {state.success && (
              <p className="text-green-500 text-xs">{state.success}</p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 