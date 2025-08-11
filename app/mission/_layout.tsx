import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function MissionLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="clarity" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="memory" />
        <Stack.Screen name="test" />
        <Stack.Screen name="completion" />
      </Stack>
    </>
  );
}