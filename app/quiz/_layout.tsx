import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function QuizLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="daily" />
        <Stack.Screen name="daily-results" />
        <Stack.Screen name="subject" />
      </Stack>
    </>
  );
}