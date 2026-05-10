import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../src/constants/theme';

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {children}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 54 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          // Solid bgElevated — translucent surface tokens bleed the system
          // tab bar's default white through on iOS.
          backgroundColor: COLORS.bgElevated,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Fretboard',
          tabBarIcon: ({ focused, color }) => (
            <FretboardIcon color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chords"
        options={{
          title: 'Chords',
          tabBarIcon: ({ color }) => <ChordIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="progressions"
        options={{
          title: 'Chords',
          tabBarIcon: ({ color }) => <ProgressionsIcon color={color} />,
          tabBarLabel: 'Progressions',
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => <PracticeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color }) => <ToolsIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

function FretboardIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 16, justifyContent: 'space-between' }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{ height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      ))}
    </View>
  );
}

function ChordIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, position: 'relative' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1.5, borderColor: color, borderRadius: 4 }} />
      <View style={{ position: 'absolute', top: 5, left: 4, width: 10, height: 1.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: 10, left: 4, width: 10, height: 1.5, backgroundColor: color }} />
    </View>
  );
}

function PracticeIcon({ color }: { color: string }) {
  // Concentric target — "drill / aim" semantics
  return (
    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 18, height: 18, borderRadius: 9,
        borderWidth: 1.5, borderColor: color,
      }} />
      <View style={{
        position: 'absolute',
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: color,
      }} />
    </View>
  );
}

function ProgressionsIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
      {[8, 12, 10, 14].map((h, i) => (
        <View key={i} style={{ width: 4, height: h * 0.9, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

function ToolsIcon({ color }: { color: string }) {
  // Tuning-fork silhouette: two prongs + a stem
  return (
    <View style={{ width: 16, height: 18, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={{ width: 2, height: 9, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: 2, height: 9, backgroundColor: color, borderRadius: 1 }} />
      </View>
      <View style={{ width: 8, height: 2, backgroundColor: color, marginTop: -1, borderRadius: 1 }} />
      <View style={{ width: 2, height: 7, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: {},
});
