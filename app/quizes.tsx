// /app/quizzes.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Quiz = {
  id: string;
  title: string;
  description: string;
  duration: number;
  scheduledEnd: string;
  totalQuestions: number;
};

type Attempt = {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalScore: number;
  completedAt: string;
};

export default function QuizzesScreen() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    fetchApiUrl();
    fetchData();
  }, []);

  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress === 'achyutkpaliwal@gmail.com') {
      setIsAdmin(true);
    }
  }, [user]);

  const fetchApiUrl = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://YOUR_SERVER_IP:3001/api/user/info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setApiUrl(data.appUrl);
    } catch (error) {
      console.error('Failed to fetch API URL:', error);
      // Fallback URLs
      setApiUrl('http://YOUR_SERVER_IP:3001');
    }
  };

  const fetchData = async () => {
    try {
      const token = await getToken();
      
      // Use the dynamic API URL
      const baseUrl = apiUrl || 'http://YOUR_SERVER_IP:3001';
      
      const [quizzesRes, attemptsRes] = await Promise.all([
        fetch(`${baseUrl}/api/quiz/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/quiz/user/attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const quizzesData = await quizzesRes.json();
      const attemptsData = await attemptsRes.json();

      setQuizzes(quizzesData);
      setAttempts(attemptsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTakeQuiz = (quizId: string) => {
    // cast to any to satisfy expo-router's strict route string types
    router.push((`/quiz/${quizId}`) as any);
  };

  const handleViewRankings = (quizId: string) => {
    router.push((`/quiz/${quizId}/rankings`) as any);
  };

  const handleCreateQuiz = () => {
    router.push(('/quiz/create') as any);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" className="text-blue-500" />
        <Text className="mt-4 text-gray-600">Loading quizzes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Quizzes</Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={handleCreateQuiz}
              className="flex-row items-center bg-blue-500 px-4 py-2 rounded-lg"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="ml-2 text-white font-semibold">Create Quiz</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text className="mt-1 text-gray-500">
          Test your knowledge and compete with others
        </Text>
      </View>

      {/* Active Quizzes */}
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View className="m-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">{item.title}</Text>
                <Text className="mt-1 text-gray-600">{item.description}</Text>
                
                <View className="flex-row mt-3 space-x-4">
                  <View className="flex-row items-center">
                    <Ionicons name="help-circle-outline" size={16} color="#6b7280" />
                    <Text className="ml-1 text-sm text-gray-500">
                      {item.totalQuestions} questions
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text className="ml-1 text-sm text-gray-500">
                      {item.duration} min
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text className="ml-1 text-sm text-gray-500">
                      Expires {formatDate(item.scheduledEnd)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row mt-4 space-x-2">
              <TouchableOpacity
                onPress={() => handleTakeQuiz(item.id)}
                className="flex-1 bg-green-500 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">Take Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleViewRankings(item.id)}
                className="flex-1 bg-amber-500 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">Rankings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
            <Text className="mt-4 text-lg text-gray-500 font-medium">
              No active quizzes
            </Text>
            <Text className="text-gray-400">Check back later for new quizzes</Text>
          </View>
        }
        ListHeaderComponent={
          quizzes.length > 0 ? (
            <Text className="px-4 pt-4 text-lg font-bold text-gray-700">
              Available Quizzes ({quizzes.length})
            </Text>
          ) : null
        }
      />

      {/* Previous Attempts Section */}
      {attempts.length > 0 && (
        <View className="px-4 pb-4">
          <Text className="text-lg font-bold text-gray-700 mb-2">
            Your Previous Attempts
          </Text>
          <FlatList
            data={attempts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="w-64 mr-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <Text className="font-bold text-gray-900" numberOfLines={1}>
                  {item.quizTitle}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500">Score</Text>
                    <Text className="text-2xl font-bold text-green-600">
                      {item.score}<Text className="text-lg text-gray-400">/{item.totalScore}</Text>
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm text-gray-500">Completed</Text>
                    <Text className="text-gray-600">
                      {formatDate(item.completedAt)}
                    </Text>
                  </View>
                </View>
                <View className="mt-3 bg-gray-50 rounded-lg p-2">
                  <View className="flex-row items-center">
                    <Ionicons name="trophy" size={16} color="#f59e0b" />
                    <Text className="ml-2 text-sm text-gray-600">
                      {Math.round((item.score / item.totalScore) * 100)}% accuracy
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Ionicons name="stats-chart-outline" size={48} color="#9ca3af" />
                <Text className="mt-2 text-gray-500">No attempts yet</Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}