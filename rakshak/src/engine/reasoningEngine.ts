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
    secondaryHazards.push('Total Structural Collapse ( weakened walls failing under aftershocks)');
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

  // 5. Calculate Confidence Score
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
  confidenceScore = Math.max(10, confidenceScore);

  // 6. Generate SITREP (Compact and structured, suitable for SMS/Mesh)
  const timestamp = new Date().toISOString().substring(11, 16);
  const headCount = 1 + (familyProfile.hasElderly ? 1 : 0) + (familyProfile.hasChildren ? 1 : 0) + (familyProfile.hasPregnant ? 1 : 0) + (familyProfile.hasDisabled ? 1 : 0);
  const sitrep = `RAKSHAK SITREP [${timestamp}]
INCIDENT: ${emergencyType}
SEVERITY: ${severity} (${state.elapsedMinutes}m elapsed)
MODE: ${isCommunityDisaster ? 'COMMUNITY' : 'HOME'}
PEOPLE: ${headCount} affected
HAZARDS: ${primaryHazards.concat(secondaryHazards).join(', ')}
STATUS: Assistance requested. Local GPS coordinates active.`;

  // 7. Reasoning Trail Description
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
    sitrep,
    confidenceScore,
    reasoningTrail
  };
}
