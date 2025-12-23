import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useUser } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type {
  LocationCoordinates,
  SearchResult,
  RouteInfo,
  StepDirection,
  TravelMode,
  TomTomSearchResponse,
  TomTomRouteResponse,
  Point,
  MapRegion
} from '@/types/navigation';

// API Key - Store in .env file
const TOMTOM_API_KEY: string = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || '';

const NavigationScreen: React.FC = () => {
  const { user } = useUser();
  const mapRef = useRef<MapView>(null);
  
  // State variables with proper types
  const [currentLocation, setCurrentLocation] = useState<MapRegion>({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [destination, setDestination] = useState<string>('');
  const [destinationCoords, setDestinationCoords] = useState<LocationCoordinates | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('car');
  const [routeCoordinates, setRouteCoordinates] = useState<Point[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [stepByStepDirections, setStepByStepDirections] = useState<StepDirection[]>([]);

  // Get user's current location
  useEffect(() => {
    const getLocation = async (): Promise<void> => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    };

    getLocation();
  }, []);

  // Search for destination
  const searchDestination = async (): Promise<void> => {
    if (!destination.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(destination)}.json?key=${TOMTOM_API_KEY}&limit=10`
      );
      
      const data: TomTomSearchResponse = await response.json();
      if (data.results) {
        const results: SearchResult[] = data.results.map(result => ({
          id: result.id,
          address: result.address.freeformAddress,
          city: result.address.municipality,
          country: result.address.country,
          coordinates: {
            latitude: result.position.lat,
            longitude: result.position.lon
          }
        }));
        setSearchResults(results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search location');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate route
  const calculateRoute = async (destCoords: LocationCoordinates): Promise<void> => {
    if (!destCoords) return;
    
    setIsLoading(true);
    setDestinationCoords(destCoords);
    setShowResults(false);

    try {
      // Proper type mapping for travel modes
      const modeMapping: Record<TravelMode, string> = {
        car: 'car',
        walk: 'pedestrian',
        bike: 'bicycle',
        motorcycle: 'motorcycle',
        truck: 'truck'
      };

      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/` +
        `${currentLocation.longitude},${currentLocation.latitude}:` +
        `${destCoords.longitude},${destCoords.latitude}/json?` +
        `key=${TOMTOM_API_KEY}` +
        `&travelMode=${modeMapping[travelMode]}` +
        `&routeType=${travelMode === 'walk' || travelMode === 'bike' ? 'shortest' : 'fastest'}` +
        `&traffic=true` +
        `&instructionsType=text`
      );

      const data: TomTomRouteResponse = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const summary = route.summary;
        
        // Extract route coordinates with proper typing
        const coordinates: Point[] = route.legs[0].points.map((point: Point) => ({
          latitude: point.latitude,
          longitude: point.longitude
        }));
        
        setRouteCoordinates(coordinates);
        
        // Set route information
        const newRouteInfo: RouteInfo = {
          distance: (summary.lengthInMeters / 1000).toFixed(1),
          time: Math.round(summary.travelTimeInSeconds / 60),
          trafficDelay: summary.trafficDelayInSeconds ? Math.round(summary.trafficDelayInSeconds / 60) : 0
        };
        
        setRouteInfo(newRouteInfo);
        
        // Extract step-by-step directions
        if (route.guidance && route.guidance.instructions) {
          const directions: StepDirection[] = route.guidance.instructions.map(instruction => ({
            instruction: instruction.message,
            distance: (instruction.routeOffsetInMeters / 1000).toFixed(1),
          }));
          setStepByStepDirections(directions);
        }
        
        // Fit map to show both points and route
        if (mapRef.current) {
          const coordinatesArray: Point[] = [
            { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            ...coordinates,
            { latitude: destCoords.latitude, longitude: destCoords.longitude }
          ];
          
          mapRef.current.fitToCoordinates(coordinatesArray, {
            edgePadding: { top: 100, right: 100, bottom: 300, left: 100 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('Routing error:', error);
      Alert.alert('Error', 'Failed to calculate route');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear route
  const clearRoute = (): void => {
    setRouteCoordinates([]);
    setRouteInfo(null);
    setStepByStepDirections([]);
    setDestinationCoords(null);
    setDestination('');
  };

  // Get mode icon
  const getModeIcon = (mode: TravelMode): React.ReactNode => {
    switch (mode) {
      case 'car': return <Ionicons name="car" size={24} color="#1E40AF" />;
      case 'walk': return <Ionicons name="walk" size={24} color="#059669" />;
      case 'bike': return <FontAwesome5 name="bicycle" size={24} color="#DC2626" />;
      case 'motorcycle': return <Ionicons name="bicycle" size={24} color="#7C3AED" />;
      case 'truck': return <FontAwesome5 name="truck" size={24} color="#D97706" />;
      default: return <Ionicons name="navigate" size={24} color="#1E40AF" />;
    }
  };

  // Get mode color for route line
  const getModeColor = (): string => {
    switch (travelMode) {
      case 'car': return '#3B82F6';
      case 'walk': return '#10B981';
      case 'bike': return '#EF4444';
      case 'motorcycle': return '#8B5CF6';
      case 'truck': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult): void => {
    calculateRoute(result.coordinates);
  };

  // Travel mode options
  const travelModes: TravelMode[] = ['car', 'walk', 'bike', 'motorcycle', 'truck'];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: user?.firstName ? `${user.firstName}'s Navigation` : 'TomTom Navigation',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E40AF',
          },
          headerTintColor: '#fff',
        }} 
      />
      
      <View className="flex-1 bg-gray-50">
        {/* Main Map */}
        <View className="flex-1">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={currentLocation}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            showsTraffic={true}
            showsBuildings={true}
            pitchEnabled={true}
            rotateEnabled={true}
            onMapReady={() => setIsMapReady(true)}
            provider={Platform.OS === 'ios' ? 'apple' : 'google'}
            customMapStyle={[
              {
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}]
              },
              {
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
              },
              {
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#616161"}]
              },
              {
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#f5f5f5"}]
              },
              {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#bdbdbd"}]
              },
              {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{"color": "#eeeeee"}]
              },
              {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#757575"}]
              },
              {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}]
              },
              {
                "featureType": "road.arterial",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#757575"}]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{"color": "#dadada"}]
              },
              {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#616161"}]
              },
              {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#9e9e9e"}]
              },
              {
                "featureType": "transit.line",
                "elementType": "geometry",
                "stylers": [{"color": "#e5e5e5"}]
              },
              {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [{"color": "#eeeeee"}]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#c9c9c9"}]
              },
              {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#9e9e9e"}]
              }
            ]}
          >
            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={getModeColor()}
                strokeWidth={5}
                lineDashPattern={travelMode === 'walk' ? [1, 10] : undefined}
              />
            )}
            
            {/* Destination Marker */}
            {destinationCoords && (
              <Marker
                coordinate={destinationCoords}
                title="Destination"
                description="Your destination"
              >
                <View className="bg-red-500 p-2 rounded-full border-4 border-white shadow-lg">
                  <Ionicons name="location" size={24} color="white" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {/* Search Bar */}
        <View className="absolute top-4 left-4 right-4 bg-white rounded-2xl shadow-xl p-3">
          <View className="flex-row items-center space-x-2">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 text-base text-gray-800"
              placeholder="Where do you want to go?"
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={searchDestination}
              returnKeyType="search"
            />
            {isLoading ? (
              <ActivityIndicator size="small" color="#1E40AF" />
            ) : (
              <TouchableOpacity 
                onPress={searchDestination}
                className="bg-blue-600 p-2 rounded-full"
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Travel Mode Selector */}
        <View className="absolute top-24 left-4 right-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="bg-white rounded-2xl shadow-xl p-2"
          >
            {travelModes.map((mode: TravelMode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setTravelMode(mode)}
                className={`px-4 py-3 mx-1 rounded-xl flex-row items-center ${
                  travelMode === mode ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'
                }`}
              >
                {getModeIcon(mode)}
                <Text className={`ml-2 font-semibold ${
                  travelMode === mode ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Route Information Panel */}
        {routeInfo && (
          <View className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Route Details</Text>
              <TouchableOpacity onPress={clearRoute}>
                <Ionicons name="close-circle" size={28} color="#DC2626" />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row justify-around mb-4">
              <View className="items-center">
                <Text className="text-sm text-gray-500">Distance</Text>
                <Text className="text-2xl font-bold text-blue-600">{routeInfo.distance} km</Text>
              </View>
              <View className="items-center">
                <Text className="text-sm text-gray-500">Time</Text>
                <Text className="text-2xl font-bold text-green-600">{routeInfo.time} min</Text>
              </View>
              <View className="items-center">
                <Text className="text-sm text-gray-500">Mode</Text>
                <View className="flex-row items-center mt-1">
                  {getModeIcon(travelMode)}
                  <Text className="ml-1 text-lg font-bold text-gray-700">
                    {travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Step-by-Step Directions */}
            {stepByStepDirections.length > 0 && (
              <View className="mt-4">
                <Text className="text-lg font-semibold text-gray-800 mb-2">Directions</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {stepByStepDirections.map((step: StepDirection, index: number) => (
                    <View key={index} className="flex-row items-start py-2 border-b border-gray-100">
                      <View className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                        <Text className="text-blue-700 font-bold px-2">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-700">{step.instruction}</Text>
                        <Text className="text-sm text-gray-500 mt-1">{step.distance} km</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <TouchableOpacity 
              className="mt-4 bg-blue-600 py-3 rounded-xl items-center"
              onPress={() => {
                Alert.alert('Navigation Started', 'Follow the route on the map!');
              }}
            >
              <Text className="text-white text-lg font-semibold">Start Navigation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Results Modal */}
        <Modal
          visible={showResults}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowResults(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl max-h-3/4">
              <View className="p-4 border-b border-gray-200">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-bold text-gray-800">Search Results</Text>
                  <TouchableOpacity onPress={() => setShowResults(false)}>
                    <Ionicons name="close" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <ScrollView className="p-4">
                {searchResults.map((result: SearchResult) => (
                  <TouchableOpacity
                    key={result.id}
                    onPress={() => handleResultSelect(result)}
                    className="p-4 border-b border-gray-100"
                  >
                    <View className="flex-row items-start">
                      <Ionicons name="location" size={24} color="#3B82F6" />
                      <View className="ml-3 flex-1">
                        <Text className="text-lg font-semibold text-gray-800">{result.address}</Text>
                        {(result.city || result.country) && (
                          <Text className="text-gray-500">
                            {result.city && `${result.city}, `}{result.country}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Loading Overlay */}
        {isLoading && (
          <View className="absolute inset-0 bg-black/50 justify-center items-center">
            <View className="bg-white p-8 rounded-2xl items-center">
              <ActivityIndicator size="large" color="#1E40AF" />
              <Text className="mt-4 text-lg font-semibold text-gray-800">Calculating Route...</Text>
            </View>
          </View>
        )}

        {/* User Welcome Banner */}
        <View className="absolute top-16 left-4 bg-white/90 rounded-xl p-3 shadow-lg">
          <Text className="text-gray-800">
            <Text className="font-bold">Welcome{user?.firstName ? `, ${user.firstName}` : ''}!</Text>
            <Text className="text-gray-600"> Ready to navigate?</Text>
          </Text>
        </View>
      </View>
    </>
  );
};

export default NavigationScreen;