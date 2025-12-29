import { Text } from '@/components/ui/text';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { 
  MapPin, 
  Navigation, 
  Car, 
  Bike, 
  Footprints, 
  Clock,
  Route,
  Compass,
  TrendingUp,
  ChevronRight,
  Shield,
  Plus
} from 'lucide-react-native';
import * as React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 17) return '🌤️';
  if (hour >= 17 && hour < 21) return '🌅';
  return '🌙';
}

export default function HomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#800000" />
      </View>
    );
  }
  const greeting = getGreeting();
  const emoji = getGreetingEmoji();
  const firstName = user?.firstName || 'Traveler';

  const quickActions = [
    { icon: Navigation, label: 'Navigate', color: '#007AFF', onPress: () => router.push('/search') },
    { icon: Car, label: 'By Car', color: '#10b981', onPress: () => router.push('/search') },
    { icon: Bike, label: 'By Bike', color: '#FF9500', onPress: () => router.push('/search') },
    { icon: Footprints, label: 'Walk', color: '#8B5CF6', onPress: () => router.push('/search') },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <Text style={styles.subtitle}>Where would you like to go today?</Text>
        </View>

        {/* Main Search Card */}
        <TouchableOpacity 
          style={styles.searchCard}
          onPress={() => router.push('/search')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#007AFF', '#0055CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchGradient}
          >
            <View style={styles.searchContent}>
              <View style={styles.searchIconContainer}>
                <MapPin size={32} color="#fff" />
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchTitle}>Search Destination</Text>
                <Text style={styles.searchSubtitle}>Find the fastest route to anywhere</Text>
              </View>
              <Compass size={24} color="rgba(255,255,255,0.5)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.quickActionButton}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats / Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Route size={20} color="#007AFF" />
              <Text style={styles.infoCardTitle}>Live Traffic</Text>
            </View>
            <Text style={styles.infoCardValue}>Active</Text>
            <Text style={styles.infoCardSubtext}>Real-time updates</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <TrendingUp size={20} color="#10b981" />
              <Text style={styles.infoCardTitle}>Routes Today</Text>
            </View>
            <Text style={styles.infoCardValue}>Ready</Text>
            <Text style={styles.infoCardSubtext}>Start navigating</Text>
          </View>
        </View>

        {/* Feature Highlight */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Clock size={28} color="#007AFF" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Real-Time Navigation</Text>
            <Text style={styles.featureDescription}>
              Get the fastest routes with live traffic updates and accurate ETAs.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
    marginRight: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: '#666',
    marginRight: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
  },
  searchCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  searchGradient: {
    padding: 25,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  infoCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 25,
    gap: 15,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    marginLeft: 8,
  },
  infoCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  infoCardSubtext: {
    fontSize: 12,
    color: '#999',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
