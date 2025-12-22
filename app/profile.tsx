import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import * as React from 'react';
import { Alert, View } from 'react-native';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const fullName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your name';
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? 'your@email.com';

  const initials = React.useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [fullName]);

  async function handleSignOut() {
    await signOut();
  }

  async function handleDeleteAccount() {
    if (!user) return;

    Alert.alert(
      'Delete account',
      'This will permanently delete your QRS26 account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await user.delete();
            } catch (error) {
              console.error('Failed to delete account', error);
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <View className="flex-1 bg-background">
        <View className="flex-1 px-4 pt-10 pb-4">
          {/* Top profile card */}
          <Card className="mb-4">
            <CardHeader className="flex-row items-center gap-4">
              <Avatar className="size-16">
                {user?.imageUrl ? (
                  <AvatarImage source={{ uri: user.imageUrl }} />
                ) : (
                  <AvatarFallback>
                    <Text className="text-lg font-semibold">{initials}</Text>
                  </AvatarFallback>
                )}
              </Avatar>
              <View className="flex-1">
                <Text className="text-lg font-semibold">{fullName}</Text>
                <Text className="text-sm text-muted-foreground">{email}</Text>
              </View>
            </CardHeader>
          </Card>

          {/* Account details */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-1.5">
                <Text className="text-xs text-muted-foreground">Full name</Text>
                <Text className="font-medium">{fullName}</Text>
              </View>
              <Separator />
              <View className="gap-1.5">
                <Text className="text-xs text-muted-foreground">Email</Text>
                <Text className="font-medium">{email}</Text>
              </View>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Button variant="outline" className="w-full border-destructive/30" onPress={handleSignOut}>
                <Text className="text-destructive">Log out</Text>
              </Button>
              <Button variant="destructive" className="w-full" onPress={handleDeleteAccount}>
                <Text>Delete account</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    </>
  );
}


