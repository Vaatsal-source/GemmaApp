import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'SOS Panel',
          }} 
        />
        <Tabs.Screen 
          name="triage" 
          options={{ 
            title: 'Triage',
          }} 
        />
        <Tabs.Screen 
          name="mesh" 
          options={{ 
            title: 'Mesh Comms',
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
          }} 
        />
        <Tabs.Screen 
          name="simulation" 
          options={{ 
            title: 'Simulator',
          }} 
        />
      </Tabs>
    </ThemeProvider>
  );
}
