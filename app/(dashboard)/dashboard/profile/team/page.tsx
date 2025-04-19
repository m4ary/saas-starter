import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteTeamMember } from '@/app/(dashboard)/dashboard/invite-team';
import { removeTeamMember } from '@/app/(login)/actions';
import { customerPortalAction } from '@/lib/payments/actions';
import { User } from '@/lib/db/schema';
import { CreditCard, UserPlus } from 'lucide-react';

export default async function TeamSettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User';
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 sm:px-0">
      <h1 className="text-lg font-medium mb-4">Team Settings</h1>
      
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Subscription</CardTitle>
                <p className="text-xs text-muted-foreground">Manage your team's plan</p>
              </div>
              <form action={customerPortalAction}>
                <Button type="submit" variant="outline" size="sm">
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Manage
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded p-3 text-sm">
              <div className="flex justify-between">
                <span>Current Plan:</span>
                <span className="font-medium">{teamData.planName || 'Free'}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Status:</span>
                <span className={`${
                  teamData.subscriptionStatus === 'active' 
                    ? 'text-green-600' 
                    : teamData.subscriptionStatus === 'trialing' 
                      ? 'text-blue-600' 
                      : 'text-muted-foreground'
                }`}>
                  {teamData.subscriptionStatus === 'active'
                    ? 'Active (billed monthly)'
                    : teamData.subscriptionStatus === 'trialing'
                      ? 'Trial period'
                      : 'No active subscription'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <p className="text-xs text-muted-foreground">Manage your team</p>
              </div>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Invite
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {teamData.teamMembers.map((member, index) => (
                <li key={member.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`/placeholder.svg?height=32&width=32`}
                        alt={getUserDisplayName(member.user)}
                      />
                      <AvatarFallback className="text-xs">
                        {getUserDisplayName(member.user)
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {getUserDisplayName(member.user)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  {index > 1 ? (
                    <form>
                      <input type="hidden" name="memberId" value={member.id} />
                      <Button
                        formAction={async (formData: FormData) => {
                          await removeTeamMember(undefined as any, formData);
                        }}
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 