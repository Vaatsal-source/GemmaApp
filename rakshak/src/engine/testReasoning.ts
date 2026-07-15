import { runGemmaReasoning, FusedInputState } from './reasoningEngine';

function runTests() {
  console.log("=== STARTING OFFLINE REASONING ENGINE TESTS ===");

  // Test 1: LPG Grease Kitchen Fire with vulnerable children present
  const state1: FusedInputState = {
    cameraDetections: ["flames", "smoke", "lpg_cylinder"],
    audioDetections: ["alarms"],
    speechText: "The pan caught fire and the gas cylinder is right next to it. Help, my kid is here!",
    familyProfile: { hasElderly: false, hasChildren: true, hasPregnant: false, hasDisabled: false },
    communityContext: { nearestShelter: "Cyclone Shelter", knownSnakeHabitat: false, floodSafeRoute: "Bypass" },
    elapsedMinutes: 2
  };

  const res1 = runGemmaReasoning(state1);
  console.log("\nTest 1 (Kitchen Gas Fire):");
  console.log("- Emergency Type:", res1.emergencyType);
  console.log("- Severity Level:", res1.severity);
  console.log("- Mode:", res1.mode);
  console.log("- Secondary Hazards:", res1.secondaryHazards);
  console.log("- Action Count:", res1.priorityActions.length);
  
  // Assertions
  const hasExplosionRisk = res1.secondaryHazards.some(h => h.includes("Explosion"));
  const prioritizesChildren = res1.priorityActions[0].action.includes("children");
  console.log(`- Assert Explosion Risk Predicted: ${hasExplosionRisk ? "PASS" : "FAIL"}`);
  console.log(`- Assert Evacuate Children Prioritized First: ${prioritizesChildren ? "PASS" : "FAIL"}`);

  // Test 2: Basement flood near electrical lines
  const state2: FusedInputState = {
    cameraDetections: ["water_rising", "exposed_wires"],
    audioDetections: ["water_flow"],
    speechText: "Basement is flooding and the sockets are under water.",
    familyProfile: { hasElderly: false, hasChildren: false, hasPregnant: false, hasDisabled: false },
    communityContext: { nearestShelter: "Cyclone Shelter", knownSnakeHabitat: false, floodSafeRoute: "Bypass" },
    elapsedMinutes: 0
  };

  const res2 = runGemmaReasoning(state2);
  console.log("\nTest 2 (Monsoon Electrocution Hazard):");
  console.log("- Emergency Type:", res2.emergencyType);
  console.log("- Severity Level:", res2.severity);
  console.log("- Secondary Hazards:", res2.secondaryHazards);
  
  const hasElectrocution = res2.secondaryHazards.some(h => h.includes("Electrocution"));
  console.log(`- Assert Electrocution Risk Predicted: ${hasElectrocution ? "PASS" : "FAIL"}`);

  // Test 3: Rural flood with displacement snake habitat warning
  const state3: FusedInputState = {
    cameraDetections: ["water_rising"],
    audioDetections: [],
    speechText: "Village is flooded, water is very high.",
    familyProfile: { hasElderly: false, hasChildren: false, hasPregnant: false, hasDisabled: false },
    communityContext: { nearestShelter: "Main Cyclone Shelter", knownSnakeHabitat: true, floodSafeRoute: "High Bypass Road" },
    elapsedMinutes: 5
  };

  const res3 = runGemmaReasoning(state3);
  console.log("\nTest 3 (Rural Flood with Snake Threat):");
  console.log("- Mode:", res3.mode);
  console.log("- Secondary Hazards:", res3.secondaryHazards);
  
  const hasSnakes = res3.secondaryHazards.some(h => h.includes("Snakes"));
  const hasEvacuationGuide = res3.priorityActions.some(a => a.action.includes("Main Cyclone Shelter"));
  console.log(`- Assert Snake Displacement Predicted: ${hasSnakes ? "PASS" : "FAIL"}`);
  console.log(`- Assert Community Shelter Evac Guide Appended: ${hasEvacuationGuide ? "PASS" : "FAIL"}`);

  // Test 4: Dynamic Timeline Escalation
  const state4_early: FusedInputState = {
    cameraDetections: ["smoke"],
    audioDetections: [],
    speechText: "Small smoke in the kitchen.",
    familyProfile: { hasElderly: false, hasChildren: false, hasPregnant: false, hasDisabled: false },
    communityContext: { nearestShelter: "Shelter", knownSnakeHabitat: false, floodSafeRoute: "Bypass" },
    elapsedMinutes: 1
  };
  
  const state4_late: FusedInputState = {
    ...state4_early,
    elapsedMinutes: 12 // 12 minutes elapsed
  };

  const res_early = runGemmaReasoning(state4_early);
  const res_late = runGemmaReasoning(state4_late);
  console.log("\nTest 4 (Timeline Escalation):");
  console.log("- Early Severity:", res_early.severity);
  console.log("- Late Severity (12m later):", res_late.severity);
  console.log(`- Assert Severity Upgraded: ${res_late.severity !== res_early.severity ? "PASS" : "FAIL"}`);

  console.log("\n=== TESTS COMPLETE ===");
}

runTests();
