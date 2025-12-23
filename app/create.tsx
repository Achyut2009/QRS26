// /app/quiz/create.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Question = {
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: { [key: string]: string };
  correctAnswer: string;
  points: number;
};

export default function CreateQuizScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [scheduledStart, setScheduledStart] = useState(new Date());
  const [scheduledEnd, setScheduledEnd] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: '',
      questionType: 'multiple_choice',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: 'a',
      points: 1,
    },
  ]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();
  const router = useRouter();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        questionType: 'multiple_choice',
        options: { a: '', b: '', c: '', d: '' },
        correctAnswer: 'a',
        points: 1,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, optionKey: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = {
      ...newQuestions[qIndex].options,
      [optionKey]: value,
    };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a quiz title');
      return false;
    }

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return false;
    }

    if (scheduledEnd <= scheduledStart) {
      Alert.alert('Error', 'End date must be after start date');
      return false;
    }

    for (const [index, question] of questions.entries()) {
      if (!question.questionText.trim()) {
        Alert.alert('Error', `Please enter text for question ${index + 1}`);
        return false;
      }

      if (question.questionType === 'multiple_choice') {
        const options = question.options || {};
        if (!options.a.trim() || !options.b.trim()) {
          Alert.alert('Error', `Please fill at least options A and B for question ${index + 1}`);
          return false;
        }
        if (!Object.keys(options).includes(question.correctAnswer)) {
          Alert.alert('Error', `Correct answer must be one of the options for question ${index + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateQuiz()) return;

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('http://YOUR_SERVER_IP:3001/api/quiz/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          duration: parseInt(duration),
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          questions,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Quiz created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create quiz');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create quiz. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Create New Quiz</Text>
          </View>
          <Text className="mt-2 ml-9 text-gray-500">
            Create a timed quiz for users to attempt
          </Text>
        </View>

        <View className="p-4">
          {/* Basic Info Card */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-3">Basic Information</Text>
            
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Quiz Title *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter quiz title"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-24"
                value={description}
                onChangeText={setDescription}
                placeholder="Enter quiz description"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Schedule Card */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-3">Schedule</Text>
            
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Start Date</Text>
              <TouchableOpacity 
                onPress={() => setShowStartPicker(true)}
                className="border border-gray-300 rounded-lg px-4 py-3"
              >
                <Text className="text-gray-900">{formatDateTime(scheduledStart)}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={scheduledStart}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setScheduledStart(date);
                  }}
                />
              )}
            </View>

            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">End Date *</Text>
              <TouchableOpacity 
                onPress={() => setShowEndPicker(true)}
                className="border border-gray-300 rounded-lg px-4 py-3"
              >
                <Text className="text-gray-900">{formatDateTime(scheduledEnd)}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={scheduledEnd}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setScheduledEnd(date);
                  }}
                />
              )}
            </View>
          </View>

          {/* Questions Card */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">Questions ({questions.length})</Text>
              <TouchableOpacity 
                onPress={addQuestion}
                className="flex-row items-center bg-green-500 px-3 py-2 rounded-lg"
              >
                <Ionicons name="add" size={18} color="white" />
                <Text className="ml-1 text-white font-medium">Add Question</Text>
              </TouchableOpacity>
            </View>

            {questions.map((question, qIndex) => (
              <View key={qIndex} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {/* Question Header */}
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-bold text-gray-800">Question {qIndex + 1}</Text>
                  {questions.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeQuestion(qIndex)}
                      className="flex-row items-center"
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text className="ml-1 text-red-500">Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Question Text */}
                <View className="mb-3">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Question Text *</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900"
                    value={question.questionText}
                    onChangeText={(text) => updateQuestion(qIndex, 'questionText', text)}
                    placeholder="Enter your question here"
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </View>

                {/* Question Type */}
                <View className="mb-3">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Question Type</Text>
                  <View className="flex-row space-x-2">
                    {['multiple_choice', 'true_false', 'short_answer'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        className={`px-3 py-2 rounded-lg ${question.questionType === type ? 'bg-blue-500' : 'bg-gray-200'}`}
                        onPress={() => updateQuestion(qIndex, 'questionType', type)}
                      >
                        <Text className={`font-medium ${question.questionType === type ? 'text-white' : 'text-gray-700'}`}>
                          {type.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Options for Multiple Choice */}
                {question.questionType === 'multiple_choice' && (
                  <View className="mb-3">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Options *</Text>
                    {['a', 'b', 'c', 'd'].map((option) => (
                      <View key={option} className="flex-row items-center mb-2">
                        <Text className="w-6 font-bold text-gray-700">{option.toUpperCase()}.</Text>
                        <TextInput
                          className="flex-1 ml-2 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                          value={question.options?.[option] || ''}
                          onChangeText={(text) => updateOption(qIndex, option, text)}
                          placeholder={`Option ${option.toUpperCase()}`}
                          placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity
                          onPress={() => updateQuestion(qIndex, 'correctAnswer', option)}
                          className="ml-2"
                        >
                          <View className={`w-6 h-6 rounded-full border-2 ${question.correctAnswer === option ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}>
                            {question.correctAnswer === option && (
                              <View className="w-3 h-3 rounded-full bg-green-500 m-auto" />
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Options for True/False */}
                {question.questionType === 'true_false' && (
                  <View className="mb-3">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Correct Answer</Text>
                    <View className="flex-row space-x-3">
                      {['true', 'false'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          className={`flex-1 px-4 py-3 rounded-lg ${question.correctAnswer === option ? 'bg-blue-500' : 'bg-gray-200'}`}
                          onPress={() => updateQuestion(qIndex, 'correctAnswer', option)}
                        >
                          <Text className={`text-center font-medium ${question.correctAnswer === option ? 'text-white' : 'text-gray-700'}`}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Short Answer */}
                {question.questionType === 'short_answer' && (
                  <View className="mb-3">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Correct Answer *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900"
                      value={question.correctAnswer}
                      onChangeText={(text) => updateQuestion(qIndex, 'correctAnswer', text)}
                      placeholder="Enter the correct answer"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                )}

                {/* Points */}
                <View className="mb-2">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Points</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900"
                    value={question.points.toString()}
                    onChangeText={(text) => updateQuestion(qIndex, 'points', parseInt(text) || 1)}
                    placeholder="1"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-xl ${loading ? 'bg-blue-400' : 'bg-blue-500'}`}
          >
            {loading ? (
              <View className="flex-row justify-center items-center">
                <Ionicons name="time-outline" size={20} color="white" />
                <Text className="ml-2 text-white font-bold text-lg">Creating Quiz...</Text>
              </View>
            ) : (
              <Text className="text-center text-white font-bold text-lg">Create Quiz</Text>
            )}
          </TouchableOpacity>

          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}