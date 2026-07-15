export interface FirstAidGuide {
  title: string;
  steps: string[];
  explanations: string[];
  donts: string[];
}

export interface PreparednessCoachGuide {
  title: string;
  checklist: string[];
  description: string;
}

export const EMERGENCY_KNOWLEDGE_BASE: Record<string, FirstAidGuide> = {
  cardiac: {
    title: "Cardiac Emergency / Heart Attack",
    steps: [
      "Call emergency services immediately.",
      "Have the person sit down, rest, and try to keep calm.",
      "Loosen any tight clothing.",
      "Ask if they take any chest pain medication (like nitroglycerin) and help them take it.",
      "If the person is unconscious and not breathing, start CPR immediately (100-120 compressions per minute)."
    ],
    explanations: [
      "Immediate professional help is critical to survival.",
      "Physical exertion increases the workload on the heart and worsens damage.",
      "Eases breathing and improves comfort.",
      "Prescribed medication can help dilate blood vessels and restore blood flow.",
      "Chest compressions maintain critical blood circulation to the brain."
    ],
    donts: [
      "Do NOT leave the person alone unless absolutely necessary to call for help.",
      "Do NOT give them anything to eat or drink (except prescribed nitroglycerin/aspirin).",
      "Do NOT wait to see if symptoms go away—minutes count."
    ]
  },
  snake_bite: {
    title: "Snake Bite First Aid",
    steps: [
      "Move the person away from the snake's striking distance and keep them calm.",
      "Immobilize the bitten limb using a splint or loose bandage. Keep it below heart level.",
      "Remove any tight clothing, rings, or jewelry near the bite site.",
      "Clean the wound gently with water, but do not flush it vigorously.",
      "Note the snake's appearance (color, pattern, head shape) or take a photo if safe."
    ],
    explanations: [
      "Avoids secondary bites. Keeping calm slows the spread of venom through the bloodstream.",
      "Movement accelerates venom circulation. Keeping it low limits spread to vital organs.",
      "Bites cause rapid swelling; tight items can cut off blood circulation.",
      "Cleans superficial dirt without speeding up venom absorption.",
      "Helps responders identify the correct anti-venom."
    ],
    donts: [
      "Do NOT cut the wound or try to suck out the venom.",
      "Do NOT apply a tight tourniquet (can cause amputation/tissue necrosis).",
      "Do NOT apply ice or immerse the wound in water."
    ]
  },
  electrical_shock: {
    title: "Electrical Shock",
    steps: [
      "Do NOT touch the victim if they are still in contact with the electrical current.",
      "Turn off the main power source (circuit breaker) immediately.",
      "If you cannot turn off power, use a dry, non-conductive object (wooden stick, plastic broom) to separate the victim from the source.",
      "Once safe, check for breathing. If absent, start CPR.",
      "Lay the victim flat, elevate their legs slightly, and cover them with a blanket."
    ],
    explanations: [
      "You will become part of the electrical circuit and also get shocked.",
      "Severing the electrical source stops active damage and makes the scene safe.",
      "Non-conductive materials do not allow electrical current to flow to you.",
      "Electrical shocks frequently disrupt heart rhythm, causing cardiac arrest.",
      "Helps treat shock by maintaining core body temperature and blood flow."
    ],
    donts: [
      "Do NOT use damp or metal objects to push the electrical source.",
      "Do NOT move the victim unless they are in immediate danger.",
      "Do NOT apply ice or ointments to electrical burns."
    ]
  },
  lpg_leak: {
    title: "LPG / Gas Cylinder Leak",
    steps: [
      "Evacuate everyone from the area immediately.",
      "Open all windows and doors to ventilate the space.",
      "Close the regulator valve on the LPG cylinder.",
      "Do NOT operate any electrical switches, appliances, or matchsticks.",
      "If the cylinder is on fire, use a wet blanket or fire extinguisher (Class B) to smother it."
    ],
    explanations: [
      "Prevents inhalation of toxic gas and ensures safety in case of ignition.",
      "Allows the gas to disperse, lowering the concentration below explosive levels.",
      "Stops the flow of gas at the source.",
      "Even a tiny spark from a light switch or appliance plug can ignite the gas cloud, causing a massive explosion.",
      "Deprives the fire of oxygen, extinguishing it."
    ],
    donts: [
      "Do NOT turn lights or fans ON or OFF (sparks are generated in both actions).",
      "Do NOT use mobile phones inside the gas-filled room.",
      "Do NOT strike matches or lighters to find the leak source."
    ]
  },
  fire: {
    title: "Fire Safety (General & Kitchen)",
    steps: [
      "If a fire starts in a pan, slide a metal lid over it and turn off the burner.",
      "For electrical or grease fires, do NOT throw water on them.",
      "Get low to the ground below the smoke and evacuate the building immediately.",
      "Feel doors with the back of your hand before opening; do not open if hot.",
      "Close doors behind you as you escape."
    ],
    explanations: [
      "Lid smothers the grease fire by cutting off oxygen supply.",
      "Water conducts electricity (electrocution) and vaporizes instantly in hot oil, scattering burning grease.",
      "Smoke rises; cleaner air is near the floor. Inhaling hot smoke can scorch lungs.",
      "Hot doors indicate active fire on the other side.",
      "Closing doors slows down oxygen supply to the fire and limits smoke spread."
    ],
    donts: [
      "Do NOT throw water on grease or electrical fires.",
      "Do NOT use elevators during a building fire.",
      "Do NOT go back inside for personal belongings."
    ]
  },
  choking: {
    title: "Choking (Heimlich Maneuver)",
    steps: [
      "Ask 'Are you choking? Can you speak?' If they can cough/speak, encourage them to cough.",
      "If they cannot speak or breathe, stand behind them and lean them forward.",
      "Give 5 sharp blows between their shoulder blades with the heel of your hand.",
      "If blocked, wrap arms around their waist, make a fist, place it above the navel, and press inward and upward 5 times.",
      "Repeat 5 back blows and 5 abdominal thrusts until the object is expelled or they lose consciousness."
    ],
    explanations: [
      "If they can cough, their airway is only partially blocked. Coughing is the most effective extraction.",
      "Gravity helps dislodge the object out of the mouth rather than deeper down.",
      "Physical vibration helps dislodge the obstruction.",
      "Abdominal thrusts create artificial pressure in the lungs, forcing the obstruction out like a cork.",
      "Continuous cycle maximizes likelihood of clearing the airway."
    ],
    donts: [
      "Do NOT perform abdominal thrusts on pregnant women or infants under 1 year (use chest thrusts/back blows instead).",
      "Do NOT perform blind finger sweeps in the mouth (can push object further down)."
    ]
  },
  flood: {
    title: "Flood & Flash Flood Safety",
    steps: [
      "Move to higher ground immediately; do not wait for instructions.",
      "Disconnect main electrical breakers and gas valves if safe to do so.",
      "Do NOT walk, swim, or drive through flood waters. Turn around!",
      "If trapped in a building, climb to the roof. Do not climb into a closed attic.",
      "Avoid contact with floodwater, which may carry sewage, chemicals, or live electric currents."
    ],
    explanations: [
      "Flash floods happen in minutes without warning; delay is fatal.",
      "Submerged electrical wires can energize standing water, creating electrocution hazards.",
      "Just 6 inches of moving water can knock you off your feet; 12 inches can sweep away a car.",
      "Attics can trap you if waters rise to the ceiling; the roof ensures a rescue path.",
      "Flood waters are highly contaminated and dangerous."
    ],
    donts: [
      "Do NOT drive past barricades or flooded roads.",
      "Do NOT touch electrical equipment while wet or standing in water."
    ]
  },
  earthquake: {
    title: "Earthquake (Drop, Cover, and Hold On)",
    steps: [
      "DROP down onto your hands and knees.",
      "COVER your head and neck under a sturdy table or desk.",
      "HOLD ON to your shelter until the shaking stops.",
      "If outdoors, move to an open area away from buildings, power lines, and trees.",
      "Be prepared for aftershocks."
    ],
    explanations: [
      "Prevents you from falling and keeps you low to crawl for cover.",
      "Protects you from falling debris, plaster, and shattered glass.",
      "Shelters move during shaking; holding on ensures you stay protected under it.",
      "Most earthquake injuries occur from falling masonry and structural facades outdoors.",
      "Aftershocks can trigger secondary collapses of already weakened structures."
    ],
    donts: [
      "Do NOT run outside while shaking is happening.",
      "Do NOT stand in doorways (they are not stronger and offer no overhead cover).",
      "Do NOT use elevators."
    ]
  }
};

export const PREPAREDNESS_GUIDES: PreparednessCoachGuide[] = [
  {
    title: "Emergency Kit Checklist",
    description: "Every household must prepare an offline kit containing survival items for at least 72 hours.",
    checklist: [
      "Drinking water (4 liters per person per day)",
      "Non-perishable food (biscuits, parched rice, energy bars)",
      "Flashlight with spare batteries",
      "First aid kit (bandages, antiseptic, cotton, essential meds)",
      "Battery-powered or hand-crank radio",
      "Copies of important documents (ID, insurance, deeds) in waterproof pouch",
      "Emergency whistle to signal for help",
      "Hand sanitizer and basic hygiene wipes"
    ]
  },
  {
    title: "Monsoon & Flood Prep",
    description: "Actions to perform prior to the monsoon season to prevent localized disaster.",
    checklist: [
      "Identify the highest elevation point in your community/village.",
      "Clear drainage ditches around your house to prevent water logging.",
      "Elevate electrical outlets, appliances, and wiring above historical flood levels.",
      "Keep cattle/livestock rescue paths planned and emergency ropes ready.",
      "Store feed/fodder for cattle in a raised dry place.",
      "Back up phone contacts offline and download local offline maps."
    ]
  },
  {
    title: "Fire Drill Practice",
    description: "Basic practice instructions for household fire safety drills.",
    checklist: [
      "Map out at least two escape routes from every room in the house.",
      "Establish a designated family meeting spot outside (e.g. specific tree or gate).",
      "Teach children 'Stop, Drop, and Roll' if clothing catches fire.",
      "Inspect smoke detectors and test battery operations.",
      "Practice escaping blindfolded or in the dark to simulate smoke conditions."
    ]
  }
];
