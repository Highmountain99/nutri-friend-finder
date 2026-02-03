import {
  IntakeFormData,
  TriageResult,
  TriageReasonCode,
  ProviderCategory,
  RedFlagSymptom,
  PregnancyTriageReason,
  UnifiedConcernCategory,
} from '@/types/intake';

export interface TriageDecision {
  result: TriageResult;
  reasonCode: TriageReasonCode;
  providerCategory: ProviderCategory;
}

// Red flag symptoms that suggest dietist (but don't force it)
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

// Categories that typically need dietist (medical focus)
const DIETIST_CATEGORIES: UnifiedConcernCategory[] = [
  'diabetes',
  'gut_health',
  'heart_health',
  'eating_disorder',
];

/**
 * Main triage function - now recommendation-based, not gatekeeping
 * 
 * Priority order:
 * 1. Medication that affects diet → DIETIST (recommendation)
 * 2. Red flag symptoms → DIETIST (recommendation)
 * 3. Pregnancy with medical reason → DIETIST
 * 4. Medical categories → DIETIST
 * 5. General wellness categories → COACH
 * 6. No category selected → Recommendation based on other factors
 */
export function calculateTriage(data: IntakeFormData): TriageDecision {
  // Rule 1: Takes medication that affects diet → recommend dietist
  if (data.takesMedication) {
    return {
      result: 'dietist',
      reasonCode: 'MEDICATION_RISK',
      providerCategory: 'medical',
    };
  }

  // Rule 2: Check for red flag symptoms (these strongly suggest dietist)
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

  // Rule 3: Pregnancy triage (triggered by isPregnant checkbox)
  if (data.isPregnant || data.pregnancyStatus === 'pregnant' || data.pregnancyStatus === 'postpartum' || data.pregnancyStatus === 'unsure') {
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

  // Rule 4: Check unified category selection
  if (data.unifiedConcernCategory) {
    if (DIETIST_CATEGORIES.includes(data.unifiedConcernCategory)) {
      return {
        result: 'dietist',
        reasonCode: 'DIAGNOSIS_SELECTED',
        providerCategory: 'medical',
      };
    }

    // Womens health - depends on context
    if (data.unifiedConcernCategory === 'womens_health') {
      // If they have medical symptoms, recommend dietist
      if (data.redFlagSymptoms && data.redFlagSymptoms.length > 0) {
        return {
          result: 'dietist',
          reasonCode: 'DIAGNOSIS_SELECTED',
          providerCategory: 'medical',
        };
      }
      // Otherwise coach is fine
      return {
        result: 'coach',
        reasonCode: 'SAFE_COACH',
        providerCategory: 'wellness',
      };
    }

    // All other categories → coach
    return {
      result: 'coach',
      reasonCode: 'SAFE_COACH',
      providerCategory: 'wellness',
    };
  }

  // Rule 5: Fallback for legacy category system
  if (data.primaryConcernCategory) {
    const medicalCategories = ['diabetes', 'gut_health', 'heart_health', 'eating_disorder'];
    if (medicalCategories.includes(data.primaryConcernCategory)) {
      return {
        result: 'dietist',
        reasonCode: 'DIAGNOSIS_SELECTED',
        providerCategory: 'medical',
      };
    }
  }

  if (data.coachConcernCategory) {
    return {
      result: 'coach',
      reasonCode: 'SAFE_COACH',
      providerCategory: 'wellness',
    };
  }

  // Rule 6: No category selected - default based on screening
  // If they went through without selecting anything specific, default to coach
  // (they can always switch to dietist via the summary page)
  return {
    result: 'coach',
    reasonCode: 'SAFE_COACH',
    providerCategory: 'wellness',
  };
}

/**
 * Check if any red flags are present that suggest dietist
 */
export function hasRedFlagSymptoms(symptoms: RedFlagSymptom[]): boolean {
  return symptoms.some(symptom => RED_FLAG_SYMPTOMS.includes(symptom));
}

/**
 * Check if screening indicates user should be recommended dietist
 */
export function shouldRecommendDietist(data: IntakeFormData): boolean {
  const decision = calculateTriage(data);
  return decision.result === 'dietist';
}

/**
 * Get a human-readable explanation for the triage decision
 */
export function getTriageExplanation(reasonCode: TriageReasonCode, result: TriageResult): string {
  if (result === 'dietist') {
    switch (reasonCode) {
      case 'MEDICATION_RISK':
        return 'Baserat på att du tar mediciner som kan påverka kosten rekommenderar vi en dietist.';
      case 'DIAGNOSIS_SELECTED':
        return 'Baserat på dina svar rekommenderar vi en legitimerad dietist som är specialiserad på ditt behov.';
      case 'RED_FLAG_SYMPTOM':
        return 'Baserat på din situation rekommenderar vi att du träffar en dietist för en professionell bedömning.';
      case 'EATING_DISORDER':
        return 'Vi rekommenderar att du träffar en dietist med specialistkompetens inom ätstörningar.';
      case 'PREGNANCY_MEDICAL':
        return 'Under graviditeten med medicinska överväganden bör du träffa en dietist.';
      case 'PREGNANCY_REFERRED_OR_UNSURE':
        return 'Vi rekommenderar en dietist för trygg vägledning under din graviditet.';
      case 'UNCERTAIN':
        return 'En dietist kan hjälpa dig att reda ut vilken typ av stöd som passar bäst.';
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
