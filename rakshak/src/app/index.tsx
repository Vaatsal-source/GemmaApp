import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Modal, Image, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { runGemmaReasoning, runGemmaReasoningAsync, FusedInputState, SituationAssessment } from '@/engine/reasoningEngine';
import CustomButton from '@/components/CustomButton';
import EmergencyCard from '@/components/EmergencyCard';

// Hardware integration imports
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';

export default function EmergencyDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // SOS state
  const [sosActive, setSosActive] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Fused state inputs
  const [selectedCamera, setSelectedCamera] = useState<string[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string[]>([]);
  const [speechText, setSpeechText] = useState('');
  
  // Hardware Captured URIs
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedVideoUri, setCapturedVideoUri] = useState<string | null>(null);
  const [capturedAudioUri, setCapturedAudioUri] = useState<string | null>(null);

  // AI Media Scanning Status
  const [isScanningMedia, setIsScanningMedia] = useState(false);
  const [scannedMessage, setScannedMessage] = useState<string | null>(null);

  // Permissions state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  // Recording State
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [audioRecording, setAudioRecording] = useState<Audio.Recording | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Refs
  const cameraRef = useRef<CameraView>(null);

  // Settings loaded from profile/config
  const [familyProfile, setFamilyProfile] = useState({
    hasElderly: true,
    hasChildren: false,
    hasPregnant: false,
    hasDisabled: false,
  });

  const [communityContext, setCommunityContext] = useState({
    nearestShelter: 'Primary School Cyclone Center',
    knownSnakeHabitat: true,
    floodSafeRoute: 'High Bypass Road',
  });

  // Modal control for SITREP QR
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Listen to preset scenario injection
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if ((globalThis as any).injectedScenario) {
        const scenario = (globalThis as any).injectedScenario;
        setSelectedCamera(scenario.camera);
        setSelectedAudio(scenario.audio);
        setSpeechText(scenario.text);
        if (scenario.family) setFamilyProfile(scenario.family);
        if (scenario.community) setCommunityContext(scenario.community);
        
        // Reset hardware captures on preset simulations
        setCapturedPhotoUri(null);
        setCapturedVideoUri(null);
        setCapturedAudioUri(null);
        setScannedMessage(null);

        setElapsedMinutes(0);
        setSosActive(true);
        (globalThis as any).injectedScenario = null; // consume
      }
    }, 1000);
    return () => clearInterval(checkInterval);
  }, []);

  // Request permissions when SOS is activated
  const checkAndRequestPermissions = async () => {
    // 1. Camera Permissions
    if (!cameraPermission?.granted) {
      const cameraStatus = await requestCameraPermission();
      if (!cameraStatus.granted) {
        alert("Camera permission is required to capture emergency visuals.");
        return false;
      }
    }

    // 2. Microphone / Audio Recording Permissions
    const micStatus = await Audio.requestPermissionsAsync();
    setMicPermissionGranted(micStatus.status === 'granted');
    if (micStatus.status !== 'granted') {
      alert("Microphone permission is required to record audio logs.");
      return false;
    }

    return true;
  };

  // Handle SOS Activation Toggle
  const handleSosToggle = async () => {
    if (!sosActive) {
      const permissionsGranted = await checkAndRequestPermissions();
      if (permissionsGranted) {
        setSosActive(true);
        setElapsedMinutes(0);
      }
    } else {
      // Cancel SOS and stop any active recordings/sound
      if (isRecordingVideo && cameraRef.current) {
        cameraRef.current.stopRecording();
      }
      if (isRecordingAudio && audioRecording) {
        await stopAudioRecording();
      }
      if (playbackSound) {
        await playbackSound.stopAsync();
        setIsPlayingAudio(false);
      }
      setSosActive(false);
      setCapturedPhotoUri(null);
      setCapturedVideoUri(null);
      setCapturedAudioUri(null);
      setScannedMessage(null);
    }
  };

  // --- HARDWARE ACTIONS ---

  // Capture Photo
  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setIsScanningMedia(true);
      setScannedMessage("Taking picture...");
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
        simulateAiScanning("Visual Image", ["smoke", "flames"]);
      }
    } catch (error) {
      console.error("Capture photo error:", error);
      setIsScanningMedia(false);
    }
  };

  // Capture Video
  const handleVideoRecordToggle = async () => {
    if (!cameraRef.current) return;

    if (isRecordingVideo) {
      cameraRef.current.stopRecording();
      setIsRecordingVideo(false);
    } else {
      setCameraMode('video');
      setIsRecordingVideo(true);
      setIsScanningMedia(true);
      setScannedMessage("Recording video...");
      try {
        const video = await cameraRef.current.recordAsync();
        if (video?.uri) {
          setCapturedVideoUri(video.uri);
          simulateAiScanning("Visual Video", ["water_rising", "exposed_wires"]);
        }
      } catch (error) {
        console.error("Video record error:", error);
        setIsRecordingVideo(false);
        setIsScanningMedia(false);
      }
    }
  };

  // Record Audio Voice Note
  const startAudioRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecordingAudio(true);
      setIsScanningMedia(true);
      setScannedMessage("Recording voice note...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setAudioRecording(recording);
    } catch (err) {
      console.error('Failed to start audio recording', err);
      setIsRecordingAudio(false);
      setIsScanningMedia(false);
    }
  };

  const stopAudioRecording = async () => {
    if (!audioRecording) return;
    try {
      setIsRecordingAudio(false);
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      if (uri) {
        setCapturedAudioUri(uri);
        simulateAiScanning("Voice Transcript", [], "Cardiac symptoms or evacuation help requested");
      }
      setAudioRecording(null);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (error) {
      console.error("Stop audio recording error:", error);
    }
  };

  // Playback Captured Voice Note
  const playAudio = async () => {
    if (!capturedAudioUri) return;
    try {
      if (isPlayingAudio && playbackSound) {
        await playbackSound.stopAsync();
        setIsPlayingAudio(false);
        return;
      }

      setIsPlayingAudio(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: capturedAudioUri },
        { shouldPlay: true }
      );
      setPlaybackSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsPlayingAudio(false);
    }
  };

  // Mock Edge AI Processing
  const simulateAiScanning = (type: string, autoTags: string[], textDetect = "") => {
    setScannedMessage(`🧠 Edge AI Model (Gemma E2B) parsing ${type} offline...`);
    setTimeout(() => {
      setIsScanningMedia(false);
      setScannedMessage(`✓ ${type} analyzed offline. Fused details added to Gemma prompt.`);
      
      // Auto-tag detections to demonstrate reasoning linkage
      if (autoTags.length > 0) {
        const uniqueCamera = Array.from(new Set([...selectedCamera, ...autoTags]));
        setSelectedCamera(uniqueCamera);
      }
      if (textDetect) {
        setSpeechText((prev) => (prev ? prev + " | " + textDetect : textDetect));
      }
    }, 2000);
  };

  // TTS Voice Guidance function
  const speakVoiceGuidance = () => {
    if (!assessment?.voiceGuidance) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(assessment.voiceGuidance);
      utterance.rate = 0.9; // Calm, directive pace
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Voice guidance: " + assessment.voiceGuidance);
    }
  };

  // Compute assessment
  const inputState: FusedInputState = {
    cameraDetections: selectedCamera,
    audioDetections: selectedAudio,
    speechText,
    familyProfile,
    communityContext,
    elapsedMinutes,
    photoCaptured: !!capturedPhotoUri,
    videoCaptured: !!capturedVideoUri,
    audioCaptured: !!capturedAudioUri,
  };

  const [assessment, setAssessment] = useState<SituationAssessment>(() => runGemmaReasoning(inputState));
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  // Run local Ollama model asynchronously when inputs change
  useEffect(() => {
    if (!sosActive) {
      setAssessment(runGemmaReasoning(inputState));
      return;
    }

    let active = true;
    setIsLlmLoading(true);

    const runInference = async () => {
      try {
        const res = await runGemmaReasoningAsync(inputState);
        if (active) {
          setAssessment(res);
        }
      } catch (err) {
        console.error("Failed to run reasoning async", err);
      } finally {
        if (active) {
          setIsLlmLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      runInference();
    }, 800);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    sosActive,
    selectedCamera,
    selectedAudio,
    speechText,
    familyProfile,
    communityContext,
    elapsedMinutes,
    capturedPhotoUri,
    capturedVideoUri,
    capturedAudioUri
  ]);

  const toggleCamera = (item: string) => {
    if (selectedCamera.includes(item)) {
      setSelectedCamera(selectedCamera.filter((c) => c !== item));
    } else {
      setSelectedCamera([...selectedCamera, item]);
    }
  };

  const toggleAudio = (item: string) => {
    if (selectedAudio.includes(item)) {
      setSelectedAudio(selectedAudio.filter((a) => a !== item));
    } else {
      setSelectedAudio([...selectedAudio, item]);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return '#D32F2F';
      case 'HIGH':
        return '#F57C00';
      case 'MODERATE':
        return '#FBC02D';
      default:
        return '#388E3C';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>RAKSHAK</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Offline Emergency AI Copilot
            </Text>
          </View>

          {/* SOS Primary Trigger */}
          <View style={[styles.sosContainer, { backgroundColor: colors.backgroundElement }]}>
            <Pressable
              onPress={handleSosToggle}
              style={[
                styles.sosButton,
                { backgroundColor: sosActive ? '#D32F2F' : '#388E3C' }
              ]}
            >
              <Text style={styles.sosButtonText}>{sosActive ? 'ACTIVE SOS' : 'TRIGGER SOS'}</Text>
              <Text style={styles.sosButtonSub}>{sosActive ? 'Tap to cancel and reset' : 'Tap to start incident capture'}</Text>
            </Pressable>

            {sosActive && (
              <View style={styles.timerRow}>
                <Text style={[styles.timerText, { color: colors.text }]}>
                  Elapsed: <Text style={{ fontWeight: 'bold' }}>{elapsedMinutes} minutes</Text>
                </Text>
                <View style={styles.timerControls}>
                  <Pressable
                    onPress={() => setElapsedMinutes((m) => Math.max(0, m - 1))}
                    style={[styles.timerBtn, { backgroundColor: colors.backgroundSelected }]}
                  >
                    <Text style={[styles.timerBtnText, { color: colors.text }]}>-1m</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setElapsedMinutes((m) => m + 1)}
                    style={[styles.timerBtn, { backgroundColor: colors.backgroundSelected }]}
                  >
                    <Text style={[styles.timerBtnText, { color: colors.text }]}>+1m</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setElapsedMinutes((m) => m + 5)}
                    style={[styles.timerBtn, { backgroundColor: colors.backgroundSelected }]}
                  >
                    <Text style={[styles.timerBtnText, { color: colors.text }]}>+5m</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Hardware Viewfinder & Record Panel */}
          {sosActive && (
            <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📹 Live Emergency Media Capture</Text>
              <Text style={[styles.captionText, { color: colors.textSecondary }]}>
                Record video, capture photos, and record audio completely offline.
              </Text>

              {/* Viewfinder block */}
              {cameraPermission?.granted ? (
                <View style={styles.viewfinderContainer}>
                  <CameraView
                    ref={cameraRef}
                    style={styles.viewfinder}
                    facing="back"
                    mode={cameraMode}
                  />
                  
                  {isRecordingVideo && (
                    <View style={styles.recBadge}>
                      <View style={styles.recDot} />
                      <Text style={styles.recText}>REC</Text>
                    </View>
                  )}

                  {/* Camera overlay actions */}
                  <View style={styles.viewfinderOverlay}>
                    <Pressable
                      onPress={() => setCameraMode(cameraMode === 'picture' ? 'video' : 'picture')}
                      style={[styles.overlayBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                        MODE: {cameraMode.toUpperCase()}
                      </Text>
                    </Pressable>

                    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                      {cameraMode === 'picture' ? (
                        <CustomButton
                          title="📸 Capture Image"
                          variant="danger"
                          onPress={takePhoto}
                          style={styles.capBtn}
                          textStyle={{ fontSize: 13 }}
                        />
                      ) : (
                        <CustomButton
                          title={isRecordingVideo ? "⏹ Stop Video" : "📹 Record Video"}
                          variant="danger"
                          onPress={handleVideoRecordToggle}
                          style={styles.capBtn}
                          textStyle={{ fontSize: 13 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.warningBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.warningText, { color: colors.text }]}>
                    Camera permissions not active. Press SOS again to prompt or set manually.
                  </Text>
                </View>
              )}

              {/* Audio recording trigger */}
              <View style={styles.audioControlsRow}>
                {isRecordingAudio ? (
                  <CustomButton
                    title="⏹ Stop Audio Note"
                    variant="danger"
                    onPress={stopAudioRecording}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <CustomButton
                    title="🎙 Record Voice Log"
                    variant="info"
                    onPress={startAudioRecording}
                    style={{ flex: 1 }}
                  />
                )}
              </View>

              {/* AI Scanner indicator */}
              {scannedMessage && (
                <View style={[styles.scanIndicator, { backgroundColor: colors.background }]}>
                  <Text style={[styles.scanText, { color: colors.text }]}>
                    {isScanningMedia ? "🔄 " : "❇️ "}
                    {scannedMessage}
                  </Text>
                </View>
              )}

              {/* Captured Media Assets Header */}
              {(capturedPhotoUri || capturedVideoUri || capturedAudioUri) && (
                <View style={[styles.mediaAssetsBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.mediaTitle, { color: colors.text }]}>📁 Stored Media Evidence Capsule</Text>
                  
                  <View style={styles.mediaRow}>
                    {capturedPhotoUri && (
                      <View style={styles.mediaThumbnailBox}>
                        <Image source={{ uri: capturedPhotoUri }} style={styles.thumbnail} />
                        <Text style={[styles.mediaLabel, { color: colors.textSecondary }]}>Image</Text>
                      </View>
                    )}

                    {capturedVideoUri && (
                      <View style={styles.mediaThumbnailBox}>
                        <View style={[styles.thumbnail, styles.videoPlaceholder]}>
                          <Text style={{ fontSize: 24 }}>▶</Text>
                        </View>
                        <Text style={[styles.mediaLabel, { color: colors.textSecondary }]}>Video</Text>
                      </View>
                    )}

                    {capturedAudioUri && (
                      <View style={styles.audioPlaybackBox}>
                        <Pressable
                          onPress={playAudio}
                          style={[styles.audioPlayBtn, { backgroundColor: isPlayingAudio ? '#D32F2F' : '#388E3C' }]}
                        >
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>
                            {isPlayingAudio ? "⏹ Stop Play" : "▶ Play Voice Note"}
                          </Text>
                        </Pressable>
                        <Text style={[styles.mediaLabel, { color: colors.textSecondary, textAlign: 'center' }]}>Audio note</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Fused Perception Signal Emulator */}
          <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📟 On-Device Perception Signal Overrides
            </Text>
            <Text style={[styles.captionText, { color: colors.textSecondary }]}>
              Fine-tune the detected factors. Gemma combines these with captured media files.
            </Text>

            {/* Camera Tag Selector */}
            <Text style={[styles.subLabel, { color: colors.text }]}>📷 Camera Sightings (Visual Indicators)</Text>
            <View style={styles.tagGrid}>
              {[
                { id: 'smoke', label: 'Smoke' },
                { id: 'flames', label: 'Flames' },
                { id: 'water_rising', label: 'Water Rising' },
                { id: 'exposed_wires', label: 'Exposed Wires' },
                { id: 'lpg_cylinder', label: 'LPG Gas Cylinder' },
                { id: 'cracked_wall', label: 'Cracked Walls' },
                { id: 'blocked_exit', label: 'Blocked Exit' },
              ].map((item) => {
                const selected = selectedCamera.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleCamera(item.id)}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: selected ? '#1976D2' : colors.backgroundSelected,
                        borderColor: selected ? '#1976D2' : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: selected ? '#FFFFFF' : colors.text }]}>
                      {selected ? '✓ ' : ''}
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Audio Tag Selector */}
            <Text style={[styles.subLabel, { color: colors.text }]}>🎙 Audio Signatures (Acoustic Indicators)</Text>
            <View style={styles.tagGrid}>
              {[
                { id: 'alarms', label: 'Smoke/Fire Alarm' },
                { id: 'screaming', label: 'Distress Scream' },
                { id: 'crackling_fire', label: 'Crackling Fire' },
                { id: 'water_flow', label: 'Rapid Water Flow' },
                { id: 'structural_collapse', label: 'Heavy Crash/Collapse' },
              ].map((item) => {
                const selected = selectedAudio.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleAudio(item.id)}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: selected ? '#E65100' : colors.backgroundSelected,
                        borderColor: selected ? '#E65100' : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: selected ? '#FFFFFF' : colors.text }]}>
                      {selected ? '✓ ' : ''}
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Speech Translation Input */}
            <Text style={[styles.subLabel, { color: colors.text }]}>✍ Emergency Description (Speech / Text Note)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.backgroundSelected,
                },
              ]}
              value={speechText}
              onChangeText={setSpeechText}
              placeholder="e.g. Kitchen is filled with smoke, grandmother is unable to walk..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>

          {/* Local Gemma Reasoning Output */}
          {sosActive && (
            <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
              {/* Severity Indicators */}
              <View style={styles.indicatorRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>🧠 Offline Gemma Reasoning</Text>
                  {isLlmLoading && (
                    <Text style={{ color: '#1976D2', fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>
                      🔄 Ollama Inference Running...
                    </Text>
                  )}
                  <Text style={[styles.captionText, { color: colors.textSecondary }]}>
                    Context-aware hazard and location assessment
                  </Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(assessment.severity) },
                  ]}
                >
                  <Text style={styles.severityText}>{assessment.severity}</Text>
                </View>
              </View>

              {/* General details */}
              <View style={[styles.detailBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>Incident Assessment:</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{assessment.emergencyType}</Text>

                <View style={styles.modeContainer}>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>Active Protocol:</Text>
                  <Text style={[styles.modeText, { color: '#1976D2', fontWeight: 'bold' }]}>
                    {assessment.mode}
                  </Text>
                </View>

                {/* Secondary Risk Flags */}
                {assessment.secondaryHazards.length > 0 && (
                  <View style={styles.hazardContainer}>
                    <Text style={[styles.hazardTitle, { color: '#D32F2F' }]}>⚠️ Predicted Secondary Hazards:</Text>
                    {assessment.secondaryHazards.map((haz, i) => (
                      <Text key={i} style={[styles.hazardText, { color: colors.text }]}>
                        • {haz}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Voice Guidance Banner */}
              {assessment.voiceGuidance ? (
                <View style={[styles.voiceGuidanceBox, { backgroundColor: colors.background, borderColor: getSeverityColor(assessment.severity) }]}>
                  <View style={styles.voiceGuidanceHeader}>
                    <Text style={[styles.voiceGuidanceTitle, { color: colors.text }]}>🔊 Spoken Voice Guidance</Text>
                    <Pressable
                      onPress={speakVoiceGuidance}
                      style={[styles.speakBtn, { backgroundColor: colors.backgroundSelected }]}
                    >
                      <Text style={[styles.speakBtnText, { color: colors.text }]}>🗣️ Play Audio</Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.voiceGuidanceText, { color: colors.text }]}>
                    "{assessment.voiceGuidance}"
                  </Text>
                </View>
              ) : null}

              {/* Action Plan Guidance */}
              <Text style={[styles.subLabel, { color: colors.text, marginTop: Spacing.three }]}>
                📋 Prioritized Action Plan (Click for 'Why')
              </Text>
              {assessment.priorityActions.map((act, index) => (
                <EmergencyCard
                  key={index}
                  order={act.order}
                  action={act.action}
                  why={act.why}
                  isFirst={index === 0}
                />
              ))}

              {/* SITREP Sharing Section */}
              <Text style={[styles.subLabel, { color: colors.text, marginTop: Spacing.three }]}>
                📡 Offline SITREP Packet
              </Text>
              <View style={[styles.sitrepBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.sitrepText, { color: colors.text }]}>{assessment.sitrep}</Text>
              </View>

              <View style={styles.buttonRow}>
                <CustomButton
                  title="Show QR Code Profile"
                  variant="info"
                  onPress={() => setQrModalVisible(true)}
                  style={{ flex: 1, marginRight: Spacing.two }}
                />
                <CustomButton
                  title="Simulate SMS Relay"
                  variant="neutral"
                  onPress={() => alert('SITREP copied and queued for Mesh communication.')}
                  style={{ flex: 1 }}
                />
              </View>
              
              <Text style={[styles.trailText, { color: colors.textSecondary }]}>
                {assessment.reasoningTrail}
              </Text>
            </View>
          )}

          {/* If SOS is inactive */}
          {!sosActive && (
            <View style={styles.inactivePrompt}>
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                Ready to assist. Trigger SOS or inject a simulation scenario to test local offline AI reasoning.
              </Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* QR Code Simulation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Emergency Data Capsule QR</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              First responders can scan this to fetch your medical details and the incident report offline.
            </Text>

            {/* Draw Simulated QR Graphic */}
            <View style={styles.qrPlaceholder}>
              <View style={styles.qrSquare}>
                {/* 4 corner position squares */}
                <View style={[styles.qrCorner, { top: 10, left: 10 }]} />
                <View style={[styles.qrCorner, { top: 10, right: 10 }]} />
                <View style={[styles.qrCorner, { bottom: 10, left: 10 }]} />
                <View style={styles.qrDots}>
                  {/* Mock pattern grid */}
                  {Array.from({ length: 48 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.qrDot,
                        {
                          backgroundColor:
                            (i + 3) % 4 === 0 || i % 7 === 0 || i === 22 || i === 31
                              ? colors.text
                              : 'transparent',
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={[styles.qrScanText, { color: colors.textSecondary }]}>[ SCAN GRID ACTIVE ]</Text>
            </View>

            <ScrollView style={styles.qrDataScroll} contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={[styles.sitrepText, { color: colors.text, fontSize: 13 }]}>{assessment.sitrep}</Text>
            </ScrollView>

            <CustomButton
              title="Close Profile"
              variant="outline"
              onPress={() => setQrModalVisible(false)}
              style={{ width: '100%', marginTop: Spacing.two }}
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.three,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sosContainer: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    alignItems: 'stretch',
    elevation: 3,
  },
  sosButton: {
    paddingVertical: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  sosButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sosButtonSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.one,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: Spacing.two,
  },
  timerText: {
    fontSize: 14,
  },
  timerControls: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timerBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  timerBtnText: {
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
  },
  captionText: {
    fontSize: 11,
    marginBottom: Spacing.two,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  tag: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    height: 60,
    fontSize: 13,
    textAlignVertical: 'top',
    marginTop: Spacing.one,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  severityBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  detailBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginBottom: Spacing.two,
    gap: Spacing.half,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 14,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  modeText: {
    fontSize: 12,
  },
  hazardContainer: {
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.two,
    gap: Spacing.half,
  },
  hazardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  hazardText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  sitrepBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#CCC',
    borderStyle: 'dashed',
    marginVertical: Spacing.two,
  },
  sitrepText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.two,
  },
  trailText: {
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  inactivePrompt: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  promptText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  modalDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  qrPlaceholder: {
    width: 200,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  qrSquare: {
    width: 160,
    height: 160,
    borderWidth: 2,
    borderColor: '#444',
    padding: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCorner: {
    width: 25,
    height: 25,
    borderWidth: 5,
    borderColor: '#000',
    position: 'absolute',
  },
  qrDots: {
    width: 100,
    height: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  qrDot: {
    width: 8,
    height: 8,
  },
  qrScanText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: Spacing.two,
  },
  qrDataScroll: {
    width: '100%',
    maxHeight: 120,
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: Spacing.two,
  },
  
  // Viewfinder styling
  viewfinderContainer: {
    height: 240,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: Spacing.two,
    backgroundColor: '#000',
  },
  viewfinder: {
    flex: 1,
  },
  viewfinderOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 4,
  },
  capBtn: {
    minHeight: 38,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  recBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  recText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  warningBox: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    marginVertical: Spacing.two,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  audioControlsRow: {
    flexDirection: 'row',
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  scanIndicator: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginVertical: Spacing.one,
    borderWidth: 1,
    borderColor: '#388E3C',
  },
  scanText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mediaAssetsBox: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  mediaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  mediaThumbnailBox: {
    alignItems: 'center',
    gap: 4,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 6,
  },
  videoPlaceholder: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  audioPlaybackBox: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  audioPlayBtn: {
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  voiceGuidanceBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 2,
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  voiceGuidanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.half,
  },
  voiceGuidanceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  speakBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 4,
  },
  speakBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  voiceGuidanceText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
