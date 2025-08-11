import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function BattleLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="room" />
        <Stack.Screen name="live-quiz" />
        <Stack.Screen name="results" />
      </Stack>
    </>
  );
}