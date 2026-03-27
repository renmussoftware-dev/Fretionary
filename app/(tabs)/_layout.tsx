import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../src/constants/theme';

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {children}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
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
        name="scales"
        options={{
          title: 'Scales',
          tabBarIcon: ({ color }) => <ScaleIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="caged"
        options={{
          title: 'CAGED',
          tabBarIcon: ({ color }) => <CagedIcon color={color} />,
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

function ScaleIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      {[4, 8, 6, 12, 10, 14, 11].map((h, i) => (
        <View key={i} style={{ width: 2, height: h * 0.7, backgroundColor: color, borderRadius: 1 }} />
      ))}
    </View>
  );
}

function CagedIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
      {['C','A','G'].map((l, i) => (
        <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.7 + i * 0.15 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: {},
});
