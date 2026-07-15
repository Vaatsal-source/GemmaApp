import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, TextInput, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { PREPAREDNESS_GUIDES } from '@/engine/emergencyKnowledge';
import CustomButton from '@/components/CustomButton';

export default function ProfileKnowledge() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Family profile settings
  const [hasElderly, setHasElderly] = useState(true);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasPregnant, setHasPregnant] = useState(false);
  const [hasDisabled, setHasDisabled] = useState(false);

  // Community Knowledge Layer
  const [nearestShelter, setNearestShelter] = useState('Primary School Cyclone Center');
  const [knownSnakeHabitat, setKnownSnakeHabitat] = useState(true);
  const [floodSafeRoute, setFloodSafeRoute] = useState('High Bypass Road');

  // Interactive Preparedness Coach drill state
  const [activeDrillIndex, setActiveDrillIndex] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheckItem = (drillIndex: number, itemIndex: number) => {
    const key = `${drillIndex}-${itemIndex}`;
    setCheckedItems({
      ...checkedItems,
      [key]: !checkedItems[key]
    });
  };

  const saveSettings = () => {
    // Persist to global memory (mock DB) so index.tsx can consume it in real-time
    (globalThis as any).familyProfile = { hasElderly, hasChildren, hasPregnant, hasDisabled };
    (globalThis as any).communityContext = { nearestShelter, knownSnakeHabitat, floodSafeRoute };
    alert('Offline profile details saved. Safety recommendations will dynamically personalize.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>📋 Profile & Preparedness</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Personalized offline parameters
            </Text>
          </View>

          {/* Family profile */}
          <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>👨‍👩‍👧‍👦 Family Profile (Safety Prioritization)</Text>
            <Text style={[styles.captionText, { color: colors.textSecondary }]}>
              Register vulnerable members. The reasoning engine will reorder actions to prioritize their evacuation.
            </Text>

            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Elderly Household Members</Text>
              <Switch value={hasElderly} onValueChange={setHasElderly} />
            </View>

            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Infants / Young Children</Text>
              <Switch value={hasChildren} onValueChange={setHasChildren} />
            </View>

            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Pregnant Family Members</Text>
              <Switch value={hasPregnant} onValueChange={setHasPregnant} />
            </View>

            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Members with Physical Disabilities</Text>
              <Switch value={hasDisabled} onValueChange={setHasDisabled} />
            </View>
          </View>

          {/* Community knowledge graph */}
          <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🗺 Community Knowledge Layer</Text>
            <Text style={[styles.captionText, { color: colors.textSecondary }]}>
              Configure local geographical parameters. These details are stored offline to avoid server dependencies.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Nearest Cyclone / Disaster Shelter</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              value={nearestShelter}
              onChangeText={setNearestShelter}
            />

            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Flooding Causes Snake Displacements?</Text>
              <Switch value={knownSnakeHabitat} onValueChange={setKnownSnakeHabitat} />
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Monsoon Evacuation Escape Route</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              value={floodSafeRoute}
              onChangeText={setFloodSafeRoute}
            />

            <CustomButton
              title="Save Profile Configuration"
              variant="info"
              onPress={saveSettings}
              style={{ marginTop: Spacing.three }}
            />
          </View>

          {/* Preparedness drills */}
          <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎓 Offline Preparedness Coach</Text>
            <Text style={[styles.captionText, { color: colors.textSecondary }]}>
              Practice drill procedures and complete readiness checklists prior to storms.
            </Text>

            {PREPAREDNESS_GUIDES.map((guide, drillIdx) => {
              const active = activeDrillIndex === drillIdx;
              return (
                <View key={drillIdx} style={[styles.drillBox, { backgroundColor: colors.background }]}>
                  <Pressable 
                    onPress={() => setActiveDrillIndex(active ? null : drillIdx)} 
                    style={styles.drillHeader}
                  >
                    <Text style={[styles.drillTitle, { color: colors.text }]}>{guide.title}</Text>
                    <Text style={[styles.drillArrow, { color: colors.textSecondary }]}>
                      {active ? '▼ Hide' : '▶ Start Coach'}
                    </Text>
                  </Pressable>
                  <Text style={[styles.drillDesc, { color: colors.textSecondary }]}>
                    {guide.description}
                  </Text>

                  {active && (
                    <View style={styles.checklistContainer}>
                      {guide.checklist.map((item, itemIdx) => {
                        const checked = checkedItems[`${drillIdx}-${itemIdx}`] || false;
                        return (
                          <Pressable 
                            key={itemIdx}
                            onPress={() => toggleCheckItem(drillIdx, itemIdx)}
                            style={styles.checkItemRow}
                          >
                            <View style={[
                              styles.checkbox, 
                              { 
                                backgroundColor: checked ? '#388E3C' : 'transparent',
                                borderColor: colors.text 
                              }
                            ]}>
                              {checked && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[
                              styles.checkText, 
                              { 
                                color: colors.text,
                                textDecorationLine: checked ? 'line-through' : 'none',
                                opacity: checked ? 0.6 : 1
                              }
                            ]}>
                              {item}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
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
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  captionText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    fontSize: 14,
  },
  drillBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginVertical: Spacing.one,
    elevation: 1,
  },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  drillArrow: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  drillDesc: {
    fontSize: 12,
    marginTop: Spacing.one,
  },
  checklistContainer: {
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkText: {
    fontSize: 13,
    flex: 1,
  },
});
