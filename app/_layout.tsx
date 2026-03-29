import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme/colors';
import '../src/theme/webStyles'; // Injects global hover CSS on web
import { ResembleProvider } from '../src/context/ResembleContext';
import { OnboardingSteps } from '../src/components/OnboardingSteps';
import { useOnboarding } from '../src/hooks/useOnboarding';

function AppContent() {
  const { hasOnboarded, loading, completeOnboarding } = useOnboarding();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <OnboardingSteps onComplete={completeOnboarding} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ResembleProvider>
      <AppContent />
    </ResembleProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
