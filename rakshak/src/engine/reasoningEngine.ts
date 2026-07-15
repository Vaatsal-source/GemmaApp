import { EMERGENCY_KNOWLEDGE_BASE } from './emergencyKnowledge';

export interface FamilyProfile {
  hasElderly: boolean;
  hasChildren: boolean;
  hasPregnant: boolean;
  hasDisabled: boolean;
}

export interface CommunityKnowledge {
  nearestShelter: string;
  knownSnakeHabitat: boolean;
  floodSafeRoute: string;
}

export interface FusedInputState {
  cameraDetections: string[];
  audioDetections: string[];
  speechText: string;
  familyProfile: FamilyProfile;
  communityContext: CommunityKnowledge;
  elapsedMinutes: number;
  photoCaptured?: boolean;
  videoCaptured?: boolean;
  audioCaptured?: boolean;
}

export interface PriorityAction {
  action: string;
  why: string;
  order: number;
}

export interface SituationAssessment {
  emergencyType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  mode: 'Home Response Mode' | 'Community Disaster Mode';
  primaryHazards: string[];
  secondaryHazards: string[];
  priorityActions: PriorityAction[];
  voiceGuidance: string; // Dynamic calmness statement for TTS
  sitrep: string; // Plain text SITREP summary for SMS/Mesh
  confidenceScore: number; // Percentage
  reasoningTrail: string;
}

export function runGemmaReasoning(state: FusedInputState): SituationAssessment {
  const {
    cameraDetections = [],
    audioDetections = [],
    speechText = '',
    familyProfile = { hasElderly: false, hasChildren: false, hasPregnant: false, hasDisabled: false },
    communityContext = { nearestShelter: 'Main High School', knownSnakeHabitat: false, floodSafeRoute: 'High Road' },
    elapsedMinutes = 0,
  } = state;

  const textLower = speechText.toLowerCase();

  // 1. Determine Emergency Category/Type & Mode
  let emergencyType = 'Undetermined Incident';
  let matchedKey = '';
  let isCommunityDisaster = false;

  // Detection indicators
  const hasFire = cameraDetections.includes('flames') || cameraDetections.includes('smoke') || audioDetections.includes('crackling_fire') || textLower.includes('fire') || textLower.includes('smoke') || textLower.includes('burn');
  const hasWater = cameraDetections.includes('water_rising') || cameraDetections.includes('flooding') || audioDetections.includes('water_flow') || textLower.includes('flood') || textLower.includes('water rising') || textLower.includes('river');
  const hasElectric = cameraDetections.includes('exposed_wires') || cameraDetections.includes('broken_breaker') || textLower.includes('electric') || textLower.includes('shock') || textLower.includes('current') || textLower.includes('wire');
  const hasGas = cameraDetections.includes('lpg_cylinder') && (cameraDetections.includes('smoke') || textLower.includes('gas') || textLower.includes('cylinder') || textLower.includes('leak'));
  const hasEarthquake = cameraDetections.includes('cracked_wall') && (audioDetections.includes('structural_collapse') || textLower.includes('earthquake') || textLower.includes('shaking') || textLower.includes('wall cracked'));
  const hasSnake = textLower.includes('snake') || textLower.includes('bite') || textLower.includes('venom');
  const hasCardiac = textLower.includes('heart') || textLower.includes('chest pain') || textLower.includes('breathing difficulty') || textLower.includes('cpr') || textLower.includes('cardiac');
  const hasChoking = textLower.includes('choke') || textLower.includes('choking') || textLower.includes('coughing') && textLower.includes('throat');

  // Mode escalation trigger
  if (
    textLower.includes('village') || 
    textLower.includes('community') || 
    textLower.includes('entire street') || 
    textLower.includes('everyone') || 
    cameraDetections.includes('flooding') || 
    textLower.includes('cyclone') || 
    textLower.includes('landslide')
  ) {
    isCommunityDisaster = true;
  }

  // Map to category
  if (hasElectric && hasWater) {
    emergencyType = 'Electrical Water Leakage / Electrocution Risk';
    matchedKey = 'electrical_shock';
  } else if (hasGas) {
    emergencyType = 'LPG Gas Cylinder Leak / Explosion Risk';
    matchedKey = 'lpg_leak';
  } else if (hasElectric) {
    emergencyType = 'Electrical Shock / Electrical Failure';
    matchedKey = 'electrical_shock';
  } else if (hasFire) {
    emergencyType = 'Fire Emergency';
    matchedKey = 'fire';
  } else if (hasWater) {
    emergencyType = 'Flood Emergency';
    matchedKey = 'flood';
    isCommunityDisaster = true; // Floods are typically community scale
  } else if (hasEarthquake) {
    emergencyType = 'Earthquake Collapse Emergency';
    matchedKey = 'earthquake';
    isCommunityDisaster = true;
  } else if (hasSnake) {
    emergencyType = 'Snake Bite Incident';
    matchedKey = 'snake_bite';
  } else if (hasCardiac) {
    emergencyType = 'Cardiac / Medical Emergency';
    matchedKey = 'cardiac';
  } else if (hasChoking) {
    emergencyType = 'Choking Incident';
    matchedKey = 'choking';
  }

  // 2. Predictive Hazard Analysis
  const primaryHazards: string[] = [];
  const secondaryHazards: string[] = [];

  if (hasFire) primaryHazards.push('Active Flames', 'Toxic Smoke Inhalation');
  if (hasWater) primaryHazards.push('Rapidly Rising Floodwaters', 'Contaminated Water');
  if (hasElectric) primaryHazards.push('Live Electrical Wires', 'Power Grid Failure');
  if (hasGas) primaryHazards.push('Flammable Gas Accumulation');
  if (hasEarthquake) primaryHazards.push('Unstable Structure', 'Falling Masonry');
  if (hasSnake) primaryHazards.push('Active Venom Ingestion');
  if (hasCardiac) primaryHazards.push('Cardiac Arrest / Lack of Oxygen');

  // Secondary risk reasoning
  if (hasWater && (hasElectric || cameraDetections.includes('exposed_wires'))) {
    secondaryHazards.push('Submerged Grid Electrocution (Water conducting current from live wires)');
  }
  if (hasFire && cameraDetections.includes('lpg_cylinder')) {
    secondaryHazards.push('Cylinder Explosion (Heat leading to BLEVE / rapid gas ignition)');
  }
  if (hasEarthquake && cameraDetections.includes('cracked_wall')) {
    secondaryHazards.push('Total Structural Collapse (weakened walls failing under aftershocks)');
  }
  if (hasWater && communityContext.knownSnakeHabitat) {
    secondaryHazards.push('Displaced Venomous Snakes (Reptiles escaping water to higher dry areas where humans gather)');
  }
  if (hasFire && textLower.includes('closed room')) {
    secondaryHazards.push('Asphyxiation (Rapid oxygen depletion in enclosed space)');
  }

  // 3. Determine Severity Level based on Hazards & Elapsed Time (Timeline Reasoning)
  let severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
  let severityScore = 0;

  if (primaryHazards.length > 0) severityScore += 2;
  if (secondaryHazards.length > 0) severityScore += 2;
  if (isCommunityDisaster) severityScore += 1;

  // Add time factor (Timeline reasoning)
  if (elapsedMinutes >= 5) severityScore += 1;
  if (elapsedMinutes >= 10) severityScore += 2;

  // Check specific high risk matches
  const hasVulnerable = familyProfile.hasElderly || familyProfile.hasChildren || familyProfile.hasPregnant || familyProfile.hasDisabled;
  if (hasVulnerable && (hasFire || hasWater || hasEarthquake)) {
    severityScore += 2;
  }

  if (severityScore >= 7) {
    severity = 'CRITICAL';
  } else if (severityScore >= 4) {
    severity = 'HIGH';
  } else if (severityScore >= 2) {
    severity = 'MODERATE';
  } else {
    severity = 'LOW';
  }

  // 4. Prioritize Actions (incorporating Family Safety, Community Knowledge, and Explainability)
  const priorityActions: PriorityAction[] = [];
  let actionsSource = EMERGENCY_KNOWLEDGE_BASE[matchedKey];

  if (actionsSource) {
    actionsSource.steps.forEach((step, idx) => {
      priorityActions.push({
        action: step,
        why: actionsSource!.explanations[idx] || 'Critical safety protocol.',
        order: idx + 1
      });
    });
  } else {
    // General emergency instructions fallback
    priorityActions.push(
      { action: "Stay calm and evaluate your immediate surroundings for danger.", why: "Panic reduces response capabilities and increases risk.", order: 1 },
      { action: "Call local emergency services (112 / 101 / 102 / 108).", why: "Professional responders must be dispatched early.", order: 2 },
      { action: "Move to a safe, open location if inside an unstable building.", why: "Open areas minimize risk of falling debris.", order: 3 }
    );
  }

  // Insert Family-Aware Prioritizations
  if (hasVulnerable && (hasFire || hasWater || hasEarthquake)) {
    let vulnDescription = [];
    if (familyProfile.hasElderly) vulnDescription.push('elderly members');
    if (familyProfile.hasChildren) vulnDescription.push('children');
    if (familyProfile.hasDisabled) vulnDescription.push('disabled members');
    if (familyProfile.hasPregnant) vulnDescription.push('pregnant members');

    priorityActions.unshift({
      action: `Prioritize evacuating vulnerable family members (${vulnDescription.join(', ')}).`,
      why: "Vulnerable individuals have restricted mobility or higher physiological vulnerability in smoke/water.",
      order: 0
    });
  }

  // Insert Community Knowledge Evacuation Points
  if (hasWater || hasEarthquake) {
    priorityActions.push({
      action: `Evacuate toward: ${communityContext.nearestShelter} via the designated safe route (${communityContext.floodSafeRoute}).`,
      why: `Determined offline from community database to be the nearest safe zone avoiding low-lying flooding channels.`,
      order: priorityActions.length + 1
    });
  }

  // Make order sequential (0, 1, 2... mapping to 1, 2, 3...)
  priorityActions.sort((a, b) => a.order - b.order);
  priorityActions.forEach((act, index) => {
    act.order = index + 1;
  });

  // 5. Generate Fallback Voice Guidance
  let voiceGuidance = 'Remain calm and evaluate your surroundings for danger. Professional responders are being contacted.';
  if (emergencyType === 'Fire Emergency') {
    voiceGuidance = 'A fire is active. Stay low below the smoke, evacuate the building immediately, and do not throw water on grease or electrical fires.';
  } else if (emergencyType === 'Flood Emergency') {
    voiceGuidance = 'Flooding detected. Shut off your electrical breaker if safe, and evacuate immediately to higher ground. Do not walk or drive through flood waters.';
  } else if (emergencyType === 'LPG Gas Cylinder Leak / Explosion Risk') {
    voiceGuidance = 'Gas leak detected. Evacuate immediately. Open doors and windows, close the cylinder regulator, and do not touch any electrical switches.';
  } else if (emergencyType === 'Electrical Shock / Electrical Failure' || emergencyType === 'Electrical Water Leakage / Electrocution Risk') {
    voiceGuidance = 'Electrical hazard detected. Do not touch the person if they are contacting current. Switch off the main breaker immediately.';
  } else if (emergencyType === 'Earthquake Collapse Emergency') {
    voiceGuidance = 'Earthquake shaking detected. Drop, cover, and hold on. Watch for unstable walls and falling masonry. Prepare for aftershocks.';
  } else if (emergencyType === 'Snake Bite Incident') {
    voiceGuidance = 'Snake bite first aid. Keep the patient calm, immobilize the bitten limb below heart level, and seek anti-venom. Do not cut or suck the bite.';
  } else if (emergencyType === 'Cardiac / Medical Emergency') {
    voiceGuidance = 'Medical alert. Have the person sit down, loosen tight clothing, help them take nitroglycerin if prescribed, and start CPR if unconscious.';
  } else if (emergencyType === 'Choking Incident') {
    voiceGuidance = 'Choking incident. Perform five quick back blows, then five abdominal Heimlich thrusts. Repeat until the block is cleared.';
  }

  // 6. Calculate Confidence Score
  let confidenceScore = 90;
  if (cameraDetections.length === 0 && audioDetections.length === 0) {
    confidenceScore -= 30; // Image/Audio absent, text only
  }
  if (speechText.length < 10) {
    confidenceScore -= 10; // Speech too short, lack of semantic context
  }
  if (matchedKey === '') {
    confidenceScore -= 20; // Unmatched emergency
  }
  
  // Boost confidence based on actual media capture evidence
  if (state.photoCaptured || state.videoCaptured || state.audioCaptured) {
    confidenceScore += 10;
  }
  confidenceScore = Math.min(100, Math.max(10, confidenceScore));

  // 7. Generate SITREP (Compact and structured, suitable for SMS/Mesh)
  const timestamp = new Date().toISOString().substring(11, 16);
  const headCount = 1 + (familyProfile.hasElderly ? 1 : 0) + (familyProfile.hasChildren ? 1 : 0) + (familyProfile.hasPregnant ? 1 : 0) + (familyProfile.hasDisabled ? 1 : 0);
  
  let mediaEvidenceText = 'None';
  const mediaList = [];
  if (state.photoCaptured) mediaList.push('Photo');
  if (state.videoCaptured) mediaList.push('Video');
  if (state.audioCaptured) mediaList.push('Audio Note');
  if (mediaList.length > 0) mediaEvidenceText = mediaList.join('+');

  const sitrep = `RAKSHAK SITREP [${timestamp}]
INCIDENT: ${emergencyType}
SEVERITY: ${severity} (${state.elapsedMinutes}m elapsed)
MODE: ${isCommunityDisaster ? 'COMMUNITY' : 'HOME'}
PEOPLE: ${headCount} affected
HAZARDS: ${primaryHazards.concat(secondaryHazards).join(', ')}
MEDIA: ${mediaEvidenceText}
STATUS: Assistance requested. Local GPS coordinates active.`;

  // 8. Reasoning Trail Description
  const reasoningTrail = `Gemma 4 Reasoning Trail:
- Modal Fusion: Processed ${cameraDetections.length} camera objects, ${audioDetections.length} sound events, and ${speechText.length} character text input.
- Primary threat identified as ${primaryHazards[0] || 'Unknown Danger'}.
- Detected secondary hazard: ${secondaryHazards[0] || 'None immediately dangerous'}.
- Personalization: Adjusted steps for ${hasVulnerable ? 'vulnerable family profile' : 'standard household profile'}.
- Output formatted as a structured Situation Report with ${confidenceScore}% confidence.`;

  return {
    emergencyType,
    severity,
    mode: isCommunityDisaster ? 'Community Disaster Mode' : 'Home Response Mode',
    primaryHazards,
    secondaryHazards,
    priorityActions,
    voiceGuidance,
    sitrep,
    confidenceScore,
    reasoningTrail
  };
}

export async function runGemmaReasoningAsync(state: FusedInputState): Promise<SituationAssessment> {
  const modelName = "gemma4:e2b";
  const url = "http://localhost:11434/api/generate";

  // Build the detailed fusion prompt
  const prompt = `
You are Rakshak AI, an offline emergency responder copilot running locally on-device.
Analyze the following fused emergency inputs and return a situation assessment in JSON format.

=== EMERGENCY INPUTS ===
- Elapsed time since SOS triggered: ${state.elapsedMinutes} minutes
- Camera (Vision) tags: [${(state.cameraDetections || []).join(', ')}]
- Audio (Sound) tags: [${(state.audioDetections || []).join(', ')}]
- User's speech/text note: "${state.speechText || ''}"
- Media Evidence captured:
  * Still Photo captured: ${state.photoCaptured ? "YES" : "NO"}
  * Video Clip captured: ${state.videoCaptured ? "YES" : "NO"}
  * Voice Note captured: ${state.audioCaptured ? "YES" : "NO"}
- Family Vulnerability Profile:
  * Elderly present: ${state.familyProfile?.hasElderly ? "YES" : "NO"}
  * Children present: ${state.familyProfile?.hasChildren ? "YES" : "NO"}
  * Pregnant member present: ${state.familyProfile?.hasPregnant ? "YES" : "NO"}
  * Disabled member present: ${state.familyProfile?.hasDisabled ? "YES" : "NO"}
- Community Context:
  * Nearest Shelter: "${state.communityContext?.nearestShelter || 'Primary School Cyclone Center'}"
  * Known Snake Habitat nearby: ${state.communityContext?.knownSnakeHabitat ? "YES" : "NO"}
  * Designated Flood Safe Route: "${state.communityContext?.floodSafeRoute || 'High Bypass Road'}"

=== OFFLINE FIRST AID & PROTOCOL KNOWLEDGE BASE ===
${JSON.stringify(EMERGENCY_KNOWLEDGE_BASE, null, 2)}

=== INSTRUCTIONS ===
1. IDENTIFY the emergency category (one of: "Fire Emergency", "Flood Emergency", "LPG Gas Cylinder Leak / Explosion Risk", "Electrical Shock / Electrical Failure", "Earthquake Collapse Emergency", "Snake Bite Incident", "Cardiac / Medical Emergency", "Choking Incident", "Undetermined Incident").
2. ESTIMATE the risk level (severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW"). Factor in elapsed time, vulnerability profile, snake habitat risks, and other hazards.
3. DETERMINE active protocol mode:
   - "Community Disaster Mode" if the inputs mention community-scale events (village, street, flooding, cyclone, landslide, etc.) or flood.
   - "Home Response Mode" otherwise.
4. DETERMINE primary hazards and predict secondary hazards (e.g. electrocution in flood, cylinder explosion in fire, snake displacement in flood, structural collapse in earthquake/aftershocks).
5. DEVELOP a prioritized action plan as an ordered array of actions.
   - Each action must contain: "action" (instruction), "why" (rationale), "order" (sequential 1-based number).
   - If vulnerable family members are present, prioritize their evacuation first.
   - If nearest shelter/routes are provided and there's a flood/earthquake, guide evacuation to that shelter.
6. GENERATE a short voice guidance (1-2 calm, directive sentences suitable for TTS playback).
7. GENERATE a compact text SITREP summary for SMS/Mesh radio (must fit within standard SMS length, contain incident type, severity, elapsed time, mode, number of affected people, active hazards, and state of media evidence).
8. CALCULATE a confidence score (0-100). Boost the score if video, photo, or voice notes are captured.
9. PROVIDE a reasoning trail tracing your logical steps.

=== OUTPUT FORMAT ===
You must return a single JSON object conforming to this TypeScript interface:
interface SituationAssessment {
  emergencyType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  mode: 'Home Response Mode' | 'Community Disaster Mode';
  primaryHazards: string[];
  secondaryHazards: string[];
  priorityActions: Array<{ action: string; why: string; order: number }>;
  voiceGuidance: string;
  sitrep: string;
  confidenceScore: number;
  reasoningTrail: string;
}

Output ONLY the JSON object. Do not include markdown code block syntax (like \`\`\`json) or any additional conversational text.
`;

  try {
    // Call Ollama with a timeout to maintain system responsiveness (6.5 second timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1
        },
        format: "json"
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    const responseText = responseData.response || responseData.text || '';
    
    // Parse the output as JSON
    const parsed = JSON.parse(responseText.trim());
    
    // Validate output structure to avoid runtime failures
    if (
      parsed &&
      typeof parsed.emergencyType === 'string' &&
      typeof parsed.severity === 'string' &&
      typeof parsed.mode === 'string' &&
      Array.isArray(parsed.primaryHazards) &&
      Array.isArray(parsed.secondaryHazards) &&
      Array.isArray(parsed.priorityActions) &&
      typeof parsed.voiceGuidance === 'string' &&
      typeof parsed.sitrep === 'string' &&
      typeof parsed.confidenceScore === 'number' &&
      typeof parsed.reasoningTrail === 'string'
    ) {
      return parsed as SituationAssessment;
    } else {
      throw new Error("Invalid schema structure returned from Ollama gemma4:e2b");
    }
  } catch (err) {
    console.warn("Ollama inference failed, falling back to rule-based engine:", err);
    // Add fallback tag to reasoning trail
    const fallbackAssessment = runGemmaReasoning(state);
    return {
      ...fallbackAssessment,
      reasoningTrail: `[FALLBACK] ${fallbackAssessment.reasoningTrail}`
    };
  }
}
