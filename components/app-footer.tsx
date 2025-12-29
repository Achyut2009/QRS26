import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { HomeIcon, UserIcon, Search, BookOpen } from 'lucide-react-native';
import { Link, usePathname } from 'expo-router';
import * as React from 'react';
import { View, Pressable } from 'react-native';

export function AppFooter() {
  const pathname = usePathname();

  // Define Maroon color for Tailwind (or use hex directly in classes)
  const maroonHex = '#800000';

  // active tab state keeps the tab highlighted on press; syncs with pathname
  const [active, setActive] = React.useState<'home' | 'search' | 'profile' | 'quizzes' | null>(() => {
    if (pathname === '/' || pathname === '/index') return 'home';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/search') return 'search';
    if (pathname === '/quizzes') return 'quizzes';
    return null;
  });

  React.useEffect(() => {
    // keep active in sync when route changes externally
    if (pathname === '/' || pathname === '/index') setActive('home');
    else if (pathname === '/profile') setActive('profile');
    else if (pathname === '/search') setActive('search');
    else if (pathname === '/quizzes') setActive('quizzes');
  }, [pathname]);

  const isHome = active === 'home';
  const isProfile = active === 'profile';
  const isSearch = active === 'search';
  const isQuizzes = active === 'quizzes';


  return (
    <View className="border-t border-border bg-background pb-safe">
      <View className="mx-auto flex w-full max-w-md flex-row items-center justify-around px-2">
        
        {/* Home Navigation */}
        <Link href="/" asChild>
          <Pressable 
            // android_ripple null removes the gray circle on Android
            android_ripple={{ color: 'transparent' }}
            className="relative flex-1 items-center justify-center py-4"
            onPress={() => setActive('home')}
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

        {/* Search / Map Navigation */}
        <Link href="/search" asChild>
          <Pressable
            android_ripple={{ color: 'transparent' }}
            className="relative flex-1 items-center justify-center py-4"
            onPress={() => setActive('search')}
          >
            <Icon
              as={Search}
              size={24}
              color={isSearch ? maroonHex : '#71717a'}
            />

            {isSearch && (
              <View
                className="absolute bottom-0 h-[3px] w-3/5 rounded-t-full"
                style={{ backgroundColor: maroonHex }}
              />
            )}
          </Pressable>
        </Link>

        {/* Quizzes Navigation */}
        <Link href="/quizzes" asChild>
          <Pressable
            android_ripple={{ color: 'transparent' }}
            className="relative flex-1 items-center justify-center py-4"
            onPress={() => setActive('quizzes')}
          >
            <Icon
              as={BookOpen}
              size={24}
              color={isQuizzes ? maroonHex : '#71717a'}
            />

            {isQuizzes && (
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
            onPress={() => setActive('profile')}
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
