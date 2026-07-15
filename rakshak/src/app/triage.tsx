import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import CustomButton from '@/components/CustomButton';
import { EMERGENCY_KNOWLEDGE_BASE } from '@/engine/emergencyKnowledge';

interface Question {
  text: string;
  points: number;
}

interface TriageFlow {
  title: string;
  category: string;
  questions: Question[];
  highThreshold: number;
}

const TRIAGE_FLOWS: Record<string, TriageFlow> = {
  cardiac: {
    title: "Chest Pain / Cardiac Triage",
    category: "cardiac",
    questions: [
      { text: "Is the pain severe, crushing, or squeezing in the chest?", points: 3 },
      { text: "Does the pain radiate to the left arm, neck, jaw, or back?", points: 2 },
      { text: "Is the person experiencing difficulty breathing, sweating, or nausea?", points: 2 },
      { text: "Is the person dizzy, lightheaded, or unable to speak in full sentences?", points: 2 },
      { text: "Does the person have a history of heart disease or hypertension?", points: 1 }
    ],
    highThreshold: 4
  },
  snake_bite: {
    title: "Snake Bite Diagnosis",
    category: "snake_bite",
    questions: [
      { text: "Are there clear fang marks or swelling around the bite?", points: 2 },
      { text: "Is the patient experiencing severe pain, burning, or discoloration?", points: 2 },
      { text: "Is there numbness, tingling, or weakness in the limb or face?", points: 3 },
      { text: "Is the patient experiencing difficulty breathing, swallowing, or drooping eyelids?", points: 3 },
      { text: "Is the patient sweating, vomiting, or showing signs of shock?", points: 1 }
    ],
    highThreshold: 4
  },
  shock: {
    title: "Electrical Shock Assessment",
    category: "electrical_shock",
    questions: [
      { text: "Is the victim currently unconscious or unresponsive?", points: 3 },
      { text: "Is the victim having difficulty breathing or not breathing?", points: 3 },
      { text: "Are there visible entry/exit burn marks on the skin?", points: 2 },
      { text: "Did they experience a fall or impact as a result of the shock?", points: 1 },
      { text: "Is the victim experiencing muscle stiffness or confusion?", points: 2 }
    ],
    highThreshold: 4
  }
};

export default function MedicalTriage() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [activeFlowKey, setActiveFlowKey] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [triageResult, setTriageResult] = useState<{
    risk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    score: number;
    guideKey: string;
  } | null>(null);

  const startTriage = (key: string) => {
    setActiveFlowKey(key);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setTriageResult(null);
  };

  const handleAnswer = (yes: boolean) => {
    const flow = TRIAGE_FLOWS[activeFlowKey!];
    const question = flow.questions[currentQuestionIndex];
    const newAnswers = [...answers, yes];
    setAnswers(newAnswers);

    let addedScore = yes ? question.points : 0;
    const newScore = score + addedScore;
    setScore(newScore);

    if (currentQuestionIndex + 1 < flow.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Flow complete, calculate result
      let risk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      
      // Critical indicator (e.g. if the first/most heavy question is yes or score is high)
      if (newScore >= 6) {
        risk = 'CRITICAL';
      } else if (newScore >= flow.highThreshold) {
        risk = 'HIGH';
      } else if (newScore >= 2) {
        risk = 'MODERATE';
      }

      setTriageResult({
        risk,
        score: newScore,
        guideKey: flow.category
      });
    }
  };

  const resetTriage = () => {
    setActiveFlowKey(null);
    setTriageResult(null);
  };

  const activeFlow = activeFlowKey ? TRIAGE_FLOWS[activeFlowKey] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>🩺 Offline Medical Triage</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Immediate first-aid diagnostic wizard
            </Text>
          </View>

          {/* Category selection */}
          {!activeFlow && !triageResult && (
            <View style={styles.menuContainer}>
              <Text style={[styles.titleText, { color: colors.text }]}>Select Symptoms Category</Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>
                Asks diagnostic check questions entirely offline. Fuses answers to identify risks and display correct treatment.
              </Text>

              {Object.keys(TRIAGE_FLOWS).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => startTriage(key)}
                  style={[styles.menuItem, { backgroundColor: colors.backgroundElement }]}
                >
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    {TRIAGE_FLOWS[key].title}
                  </Text>
                  <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>▶ Start Triage</Text>
                </Pressable>
              ))}

              <View style={[styles.infoBox, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>🚨 Note on Offline Safety</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  This wizard provides first response guidelines based on emergency protocols. If a victim is not breathing, always start chest compressions (CPR) immediately without waiting for diagnostic screening.
                </Text>
              </View>
            </View>
          )}

          {/* Active questionnaire */}
          {activeFlow && !triageResult && (
            <View style={[styles.questionCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.flowTitle, { color: colors.text }]}>{activeFlow.title}</Text>
              
              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${((currentQuestionIndex) / activeFlow.questions.length) * 100}%`,
                      backgroundColor: '#1976D2'
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Question {currentQuestionIndex + 1} of {activeFlow.questions.length}
              </Text>

              <View style={styles.questionContainer}>
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {activeFlow.questions[currentQuestionIndex].text}
                </Text>
              </View>

              <View style={styles.btnRow}>
                <CustomButton
                  title="YES"
                  variant="danger"
                  onPress={() => handleAnswer(true)}
                  style={styles.answerBtn}
                />
                <CustomButton
                  title="NO"
                  variant="neutral"
                  onPress={() => handleAnswer(false)}
                  style={styles.answerBtn}
                />
              </View>

              <CustomButton
                title="Cancel Triage"
                variant="outline"
                onPress={resetTriage}
                style={{ marginTop: Spacing.four }}
              />
            </View>
          )}

          {/* Triage summary result */}
          {triageResult && (
            <View style={styles.resultContainer}>
              <View style={[styles.resultCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>Triage Summary Assessment</Text>
                
                <View style={[
                  styles.riskBadge, 
                  { 
                    backgroundColor: 
                      triageResult.risk === 'CRITICAL' ? '#D32F2F' :
                      triageResult.risk === 'HIGH' ? '#F57C00' :
                      triageResult.risk === 'MODERATE' ? '#FBC02D' : '#388E3C'
                  }
                ]}>
                  <Text style={styles.riskText}>{triageResult.risk} RISK</Text>
                </View>

                <Text style={[styles.scoreText, { color: colors.textSecondary }]}>
                  Computed severity score: {triageResult.score} pts
                </Text>

                {/* Inject into active SOS trigger hook */}
                <CustomButton
                  title="Inject into SOS Report"
                  variant="info"
                  onPress={() => {
                    const guide = EMERGENCY_KNOWLEDGE_BASE[triageResult.guideKey];
                    // Save global state for SOS Dashboard screen
                    (globalThis as any).injectedScenario = {
                      camera: triageResult.guideKey === 'snake_bite' ? ['snake_bite'] : [],
                      audio: [],
                      text: `Triage evaluation completed: ${TRIAGE_FLOWS[activeFlowKey!].title} resulted in ${triageResult.risk} risk. Patient is showing symptoms of ${guide?.title}.`,
                    };
                    alert('Medical assessment injected! Tap on the SOS tab to view compiled dashboard.');
                    resetTriage();
                  }}
                  style={{ width: '100%', marginVertical: Spacing.two }}
                />
              </View>

              {/* Specific first aid steps */}
              <Text style={[styles.firstAidHeading, { color: colors.text }]}>
                🚑 Immediate First Aid Protocols
              </Text>
              {EMERGENCY_KNOWLEDGE_BASE[triageResult.guideKey] ? (
                <View style={[styles.guideContainer, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.guideTitle, { color: colors.text }]}>
                    {EMERGENCY_KNOWLEDGE_BASE[triageResult.guideKey].title}
                  </Text>
                  
                  {EMERGENCY_KNOWLEDGE_BASE[triageResult.guideKey].steps.map((step, index) => (
                    <View key={index} style={styles.guideStepRow}>
                      <View style={[styles.guideNumberBadge, { backgroundColor: colors.backgroundSelected }]}>
                        <Text style={[styles.guideNumberText, { color: colors.text }]}>{index + 1}</Text>
                      </View>
                      <View style={styles.guideStepTextContainer}>
                        <Text style={[styles.guideStepText, { color: colors.text }]}>{step}</Text>
                        <Text style={[styles.guideWhyText, { color: colors.textSecondary }]}>
                          Why: {EMERGENCY_KNOWLEDGE_BASE[triageResult.guideKey].explanations[index]}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Donts */}
                  {EMERGENCY_KNOWLEDGE_BASE[triageResult.guideKey].donts.length > 0 && (
                    <View style={styles.dontsContainer}>
                      <Text style={styles.dontsTitle}>🚫 CRITICAL DONT'S (Avoid immediately):</Text>
                      {EMERGENCY_KNOWLEDGE_BASE[triageResult.guideKey].donts.map((dont, i) => (
                        <Text key={i} style={styles.dontText}>• {dont}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={{ color: colors.textSecondary }}>No offline guide found for this diagnosis.</Text>
              )}

              <CustomButton
                title="Perform Another Triage"
                variant="outline"
                onPress={resetTriage}
                style={{ marginTop: Spacing.three }}
              />
            </View>
          )}

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
  menuContainer: {
    gap: Spacing.two,
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
  menuItem: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.one,
    minHeight: 60,
    elevation: 1,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  menuItemArrow: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginTop: Spacing.four,
    gap: Spacing.one,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  questionCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    elevation: 3,
    alignItems: 'stretch',
  },
  flowTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#DDD',
    borderRadius: 3,
    marginVertical: Spacing.one,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  questionContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  answerBtn: {
    flex: 1,
  },
  resultContainer: {
    alignItems: 'stretch',
  },
  resultCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  riskBadge: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.one,
  },
  riskText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  scoreText: {
    fontSize: 12,
  },
  firstAidHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: Spacing.two,
  },
  guideContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: Spacing.one,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  guideNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  guideNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  guideStepTextContainer: {
    flex: 1,
    gap: Spacing.half,
  },
  guideStepText: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  guideWhyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dontsContainer: {
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  dontsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  dontText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
});
