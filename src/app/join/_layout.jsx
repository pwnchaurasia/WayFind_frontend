import { Stack } from 'expo-router';

export default function JoinLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="org/[code]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="ride/[id]" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
