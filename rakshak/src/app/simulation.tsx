import React from 'react';
import { StyleSheet, View, Text, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import CustomButton from '@/components/CustomButton';

interface ScenarioPreset {
  name: string;
  desc: string;
  inputs: {
    camera: string[];
    audio: string[];
    text: string;
    family?: {
      hasElderly: boolean;
      hasChildren: boolean;
      hasPregnant: boolean;
      hasDisabled: boolean;
    };
    community?: {
      nearestShelter: string;
      knownSnakeHabitat: boolean;
      floodSafeRoute: string;
    };
  };
  expectedResult: string;
}

const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    name: "🔥 Kitchen Gas Leak & Fire",
    desc: "A grease fire has spread to the kitchen counter where an LPG gas cylinder is stored.",
    inputs: {
      camera: ["flames", "smoke", "lpg_cylinder"],
      audio: ["alarms"],
      text: "Kitchen grease fire is growing, there is a gas cylinder nearby!",
      family: { hasElderly: false, hasChildren: true, hasPregnant: false, hasDisabled: false }
    },
    expectedResult: "Secondary Hazard predicted: LPG Cylinder Explosion. Actions will prioritize evacuating children and avoiding throwing water on grease, focusing on gas shutoff and evacuation."
  },
  {
    name: "⚡ Monsoon Basement Flood",
    desc: "Heavy monsoon rain has flooded the basement, rising close to active electrical sockets.",
    inputs: {
      camera: ["water_rising", "exposed_wires"],
      audio: ["water_flow"],
      text: "Water is filling up the basement and covers the power outlets, sparks are coming out."
    },
    expectedResult: "Secondary Hazard predicted: Submerged Grid Electrocution. Risk level elevated to CRITICAL. Actions will prioritize isolating main breaker immediately (only if dry) and maintaining distance from water."
  },
  {
    name: "🏚 Post-Earthquake Collapse",
    desc: "A minor tremor has cracked load-bearing walls and blocked the primary door. An elderly family member is trapped inside.",
    inputs: {
      camera: ["cracked_wall", "blocked_exit"],
      audio: ["structural_collapse"],
      text: "Earthquake cracked the kitchen wall. The front door is jammed. My grandmother cannot walk out easily.",
      family: { hasElderly: true, hasChildren: false, hasPregnant: false, hasDisabled: false }
    },
    expectedResult: "Personalized Family Safety active. Secondary Hazard: Total Structural Collapse from aftershocks. Actions will prioritize carrying grandmother to a safe internal structural corner first before clearing door."
  },
  {
    name: "🐍 Rural Flood & Snake Hazard",
    desc: "A river has overflowed into the village, and local reports show snakes seeking shelter in dry homes.",
    inputs: {
      camera: ["water_rising"],
      audio: ["screaming"],
      text: "Our village is completely flooded. Water is entering the living room. Local area is a snake zone.",
      community: { nearestShelter: "High School Cyclone Center", knownSnakeHabitat: true, floodSafeRoute: "High Bypass Road" }
    },
    expectedResult: "Secondary Hazard predicted: Displaced venomous snakes in floating items. Mode upgraded to Community Disaster Mode. Action directs evacuation to the Cyclone Center via High Bypass Road."
  },
  {
    name: "🫀 Sudden Cardiac Distress",
    desc: "An elderly resident experiences heavy chest pain radiating to the jaw with extreme sweating.",
    inputs: {
      camera: [],
      audio: [],
      text: "Grandfather is having severe heart pain radiating to his left shoulder and is sweating excessively."
    },
    expectedResult: "Emergency typed: Cardiac Emergency. Risk level set to HIGH. Immediate action checklist includes loosening tight clothing, sitting upright, helping with nitroglycerin, and starting CPR if unconscious."
  }
];

export default function SimulationControls() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const injectScenario = (scenario: ScenarioPreset) => {
    (globalThis as any).injectedScenario = scenario.inputs;
    alert(`Scenario Injected: "${scenario.name}". SOS triggered! Go to the SOS tab (Home) to view the AI response.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>🎛 Emergency Scenario Simulator</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Interactive judge testing panel
            </Text>
          </View>

          <Text style={[styles.titleText, { color: colors.text }]}>Select Scenario to Inject</Text>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            Injecting a scenario instantly simulates camera feed, ambient sounds, voice transcripts, and family/community parameters. This allows you to evaluate how the Gemma reasoning engine parses inputs and runs logical risk deductions offline.
          </Text>

          <View style={styles.scenariosGrid}>
            {PRESET_SCENARIOS.map((scenario, index) => (
              <View key={index} style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{scenario.name}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{scenario.desc}</Text>
                
                <View style={[styles.expectedBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.expectedTitle, { color: colors.text }]}>AI Reasoning Goal:</Text>
                  <Text style={[styles.expectedText, { color: colors.textSecondary }]}>
                    {scenario.expectedResult}
                  </Text>
                </View>

                <CustomButton
                  title="Inject Simulation Scenario"
                  variant="info"
                  onPress={() => injectScenario(scenario)}
                  style={{ marginTop: Spacing.two }}
                />
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  scenariosGrid: {
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    elevation: 2,
    alignItems: 'stretch',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  expectedBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginTop: Spacing.one,
  },
  expectedTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Spacing.half,
  },
  expectedText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
