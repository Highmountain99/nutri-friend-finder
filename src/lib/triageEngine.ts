import {
  IntakeFormData,
  TriageResult,
  TriageReasonCode,
  ProviderCategory,
  RedFlagSymptom,
  PregnancyTriageReason,
  PrimaryConcernCategory,
} from '@/types/intake';

export interface TriageDecision {
  result: TriageResult;
  reasonCode: TriageReasonCode;
  providerCategory: ProviderCategory;
}

// Red flag symptoms that always route to dietist
const RED_FLAG_SYMPTOMS: RedFlagSymptom[] = [
  'medical_diagnosis',
  'involuntary_weight_loss',
  'eating_disorder_risk',
  'medication_risk',
];

// Pregnancy reasons that require dietist
const PREGNANCY_MEDICAL_REASONS: PregnancyTriageReason[] = [
  'gdm_risk_or_dx',
  'diabetes',
  'nutrient_deficiency',
  'medical_complication',
  'unsure',
];

// Dietist-only primary concern categories
const DIETIST_CATEGORIES: PrimaryConcernCategory[] = [
  'diabetes',
  'gut_health',
  'heart_health',
  'eating_disorder',
];

// Subcategories within gut_health that require dietist
const DIETIST_GUT_SUBCATEGORIES = [
  'crohns',
  'ulcerative_colitis',
  'sibo',
];

// Eating disorder subcategories that require dietist
const DIETIST_ED_SUBCATEGORIES = [
  'bulimia',
  'anorexia',
  'arfid',
  'osfed',
];

/**
 * Main triage function that determines if user should see dietist or coach
 * Priority order:
 * 1. Red flag symptoms → DIETIST
 * 2. Pregnancy with medical reason → DIETIST
 * 3. Dietist-specific categories → DIETIST
 * 4. Eating disorder indicators → DIETIST
 * 5. Uncertain/insufficient data → DIETIST (safety default)
 * 6. All else → COACH
 */
export function calculateTriage(data: IntakeFormData): TriageDecision {
  // Rule 1: Check for red flag symptoms (excluding pregnancy which has separate handling)
  const hasRedFlags = data.redFlagSymptoms?.some(
    symptom => RED_FLAG_SYMPTOMS.includes(symptom) && symptom !== 'pregnancy'
  );
  
  if (hasRedFlags) {
    // Determine specific reason code
    if (data.redFlagSymptoms?.includes('eating_disorder_risk')) {
      return {
        result: 'dietist',
        reasonCode: 'EATING_DISORDER',
        providerCategory: 'medical',
      };
    }
    return {
      result: 'dietist',
      reasonCode: 'RED_FLAG_SYMPTOM',
      providerCategory: 'medical',
    };
  }

  // Rule 2: Pregnancy triage
  if (data.pregnancyStatus === 'pregnant' || data.pregnancyStatus === 'postpartum' || data.pregnancyStatus === 'unsure') {
    // Check if pregnancy reason requires dietist
    if (data.pregnancyTriageReason && PREGNANCY_MEDICAL_REASONS.includes(data.pregnancyTriageReason)) {
      return {
        result: 'dietist',
        reasonCode: 'PREGNANCY_MEDICAL',
        providerCategory: 'medical',
      };
    }
    
    // Check if referred by care
    if (data.pregnancyReferredByCare === true || data.pregnancyReferredByCare === undefined) {
      return {
        result: 'dietist',
        reasonCode: 'PREGNANCY_REFERRED_OR_UNSURE',
        providerCategory: 'medical',
      };
    }
    
    // General pregnancy without medical concerns → coach
    return {
      result: 'coach',
      reasonCode: 'PREGNANCY_GENERAL',
      providerCategory: 'wellness',
    };
  }

  // Rule 3: Check if user selected a dietist-only category
  if (data.primaryConcernCategory && DIETIST_CATEGORIES.includes(data.primaryConcernCategory)) {
    // Special handling for gut_health - only certain subcategories require dietist
    if (data.primaryConcernCategory === 'gut_health') {
      if (data.primaryConcernSubcategory && DIETIST_GUT_SUBCATEGORIES.includes(data.primaryConcernSubcategory)) {
        return {
          result: 'dietist',
          reasonCode: 'DIAGNOSIS_SELECTED',
          providerCategory: 'medical',
        };
      }
      // IBS and mild gut issues can go to coach
      if (data.primaryConcernSubcategory === 'ibs' || data.primaryConcernSubcategory === 'reflux') {
        // Could be either depending on severity - default to coach for mild cases
        // This is a "soft rule" - the flow can ask follow-up questions
        return {
          result: 'coach',
          reasonCode: 'SAFE_COACH',
          providerCategory: 'wellness',
        };
      }
    }
    
    return {
      result: 'dietist',
      reasonCode: 'DIAGNOSIS_SELECTED',
      providerCategory: 'medical',
    };
  }

  // Rule 4: Check for eating disorder subcategories
  if (data.primaryConcernCategory === 'emotional_eating') {
    if (data.primaryConcernSubcategory && DIETIST_ED_SUBCATEGORIES.includes(data.primaryConcernSubcategory)) {
      return {
        result: 'dietist',
        reasonCode: 'EATING_DISORDER',
        providerCategory: 'medical',
      };
    }
    // Mild emotional eating without ED indicators → coach
    if (data.primaryConcernSubcategory === 'binge_eating') {
      // Binge eating is borderline - could need psychological support
      // Default to dietist for safety
      return {
        result: 'dietist',
        reasonCode: 'EATING_DISORDER',
        providerCategory: 'medical',
      };
    }
  }

  // Rule 5: Check for insufficient data
  if (!data.primaryConcernCategory && !data.coachConcernCategory) {
    // No category selected - need more info, default to dietist for safety
    return {
      result: 'dietist',
      reasonCode: 'UNCERTAIN',
      providerCategory: 'medical',
    };
  }

  // Rule 6: If user selected a coach category, they go to coach
  if (data.coachConcernCategory) {
    return {
      result: 'coach',
      reasonCode: 'SAFE_COACH',
      providerCategory: 'wellness',
    };
  }

  // Rule 7: Default - remaining dietist categories that aren't strictly medical
  // (weight_loss, general_health, womens_health without medical complications)
  if (data.primaryConcernCategory === 'weight_loss' || 
      data.primaryConcernCategory === 'general_health') {
    // These could go either way - but since user went through dietist flow, keep them there
    return {
      result: 'dietist',
      reasonCode: 'DIAGNOSIS_SELECTED',
      providerCategory: 'medical',
    };
  }

  // Womens health - depends on subcategory
  if (data.primaryConcernCategory === 'womens_health') {
    const medicalSubcategories = ['pcos', 'endometriosis'];
    if (data.primaryConcernSubcategory && medicalSubcategories.includes(data.primaryConcernSubcategory)) {
      return {
        result: 'dietist',
        reasonCode: 'DIAGNOSIS_SELECTED',
        providerCategory: 'medical',
      };
    }
    // General womens health → could be coach
    return {
      result: 'coach',
      reasonCode: 'SAFE_COACH',
      providerCategory: 'wellness',
    };
  }

  // Final fallback - default to dietist for safety
  return {
    result: 'dietist',
    reasonCode: 'UNCERTAIN',
    providerCategory: 'medical',
  };
}

/**
 * Check if any red flags are present that should force dietist path
 */
export function hasRedFlagSymptoms(symptoms: RedFlagSymptom[]): boolean {
  return symptoms.some(symptom => RED_FLAG_SYMPTOMS.includes(symptom));
}

/**
 * Check if screening indicates user should skip to dietist path
 */
export function shouldRouteToDietist(data: IntakeFormData): boolean {
  const decision = calculateTriage(data);
  return decision.result === 'dietist';
}

/**
 * Get a human-readable explanation for the triage decision
 */
export function getTriageExplanation(reasonCode: TriageReasonCode, result: TriageResult): string {
  if (result === 'dietist') {
    switch (reasonCode) {
      case 'DIAGNOSIS_SELECTED':
        return 'Baserat på dina svar behöver du träffa en legitimerad dietist som är specialiserad på ditt tillstånd.';
      case 'RED_FLAG_SYMPTOM':
        return 'Dina symptom kräver en medicinsk bedömning av en legitimerad dietist.';
      case 'EATING_DISORDER':
        return 'För din säkerhet rekommenderar vi att du träffar en dietist med specialistkompetens inom ätstörningar.';
      case 'PREGNANCY_MEDICAL':
        return 'Under graviditeten med medicinska överväganden bör du träffa en dietist.';
      case 'PREGNANCY_REFERRED_OR_UNSURE':
        return 'Eftersom vården har hänvisat dig eller du är osäker, rekommenderar vi en dietist.';
      case 'UNCERTAIN':
        return 'Vi behöver mer information för att ge dig rätt stöd. En dietist kan hjälpa dig vidare.';
      case 'GI_PERSISTENT':
        return 'Långvariga magbesvär bör utredas av en dietist.';
      default:
        return 'Baserat på dina svar matchar vi dig med en dietist.';
    }
  } else {
    switch (reasonCode) {
      case 'SAFE_COACH':
        return 'Dina mål passar perfekt för en kostrådgivare som kan hjälpa dig med vardagliga kostval och vanor.';
      case 'PREGNANCY_GENERAL':
        return 'En kostrådgivare kan ge dig allmänna tips om kost under graviditeten.';
      default:
        return 'En kostrådgivare kan hjälpa dig att nå dina hälsomål.';
    }
  }
}

/**
 * Get pricing info based on triage result
 */
export function getPricingInfo(result: TriageResult): { label: string; description: string } {
  if (result === 'dietist') {
    return {
      label: '0 kr',
      description: 'Täcks av primärvården. Frikort gäller.',
    };
  } else {
    return {
      label: 'Från 100 kr',
      description: 'Kan betalas med friskvårdsbidrag eller privat försäkring.',
    };
  }
}
