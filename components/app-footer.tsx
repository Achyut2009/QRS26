import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { HomeIcon, UserIcon } from 'lucide-react-native';
import { Link, usePathname } from 'expo-router';
import * as React from 'react';
import { View, Pressable } from 'react-native';

export function AppFooter() {
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '/index';
  const isProfile = pathname === '/profile';

  // Define Maroon color for Tailwind (or use hex directly in classes)
  const maroonHex = '#800000';

  return (
    <View className="border-t border-border bg-background pb-safe">
      <View className="mx-auto flex w-full max-w-md flex-row items-center justify-around px-2">
        
        {/* Home Navigation */}
        <Link href="/" asChild>
          <Pressable 
            // android_ripple null removes the gray circle on Android
            android_ripple={{ color: 'transparent' }}
            className="relative flex-1 items-center justify-center py-4"
          >
            <Icon 
              as={HomeIcon} 
              size={24}
              // pass color as a prop (not inside style)
              color={isHome ? maroonHex : '#71717a'}
            />
            
            {/* Underline - Only visible when isHome is true */}
            {isHome && (
              <View 
                className="absolute bottom-0 h-[3px] w-3/5 rounded-t-full"
                style={{ backgroundColor: maroonHex }}
              />
            )}
          </Pressable>
        </Link>

        {/* Profile Navigation */}
        <Link href="/profile" asChild>
          <Pressable 
            android_ripple={{ color: 'transparent' }}
            className="relative flex-1 items-center justify-center py-4"
          >
            <Icon 
              as={UserIcon} 
              size={24}
              color={isProfile ? maroonHex : '#71717a'}
            />

            {/* Underline - Only visible when isProfile is true */}
            {isProfile && (
              <View 
                className="absolute bottom-0 h-[3px] w-3/5 rounded-t-full"
                style={{ backgroundColor: maroonHex }}
              />
            )}
          </Pressable>
        </Link>
        
      </View>
    </View>
  );
}