import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntakeProfile } from '@/hooks/useIntakeProfile';
import { useAppointments } from '@/hooks/useAppointments';
import { AIInputStep } from './AIInputStep';
import { CareSeekerStep } from './CareSeekerStep';
import { PregnancyTriageStep } from './PregnancyTriageStep';
import { ProblemStep } from './ProblemStep';
import { ReviewsStep } from './ReviewsStep';
import { ActivityStep } from './ActivityStep';
import { MotivationStep } from './MotivationStep';
import { SupportAreasStep } from './SupportAreasStep';
import { SummaryStep } from './SummaryStep';
import { BookingStep } from './BookingStep';
import { calculateTriage } from '@/lib/triageEngine';
import { 
  IntakeFormData, 
  CareSeekerType, 
  RelationshipType, 
  UnifiedConcernCategory,
  ActivityLevel,
  MotivationLevel,
  PregnancyTriageReason,
} from '@/types/intake';
import { Loader2 } from 'lucide-react';

// Step indices for the simplified flow (9 steps total)
const STEPS = {
  AI_INPUT: 0,
  CARE_SEEKER: 1,
  PROBLEM: 2,
  PREGNANCY_TRIAGE: 2.5, // Sub-step, not counted in total
  REVIEWS: 3,
  ACTIVITY: 4,
  MOTIVATION: 5,
  SUPPORT_AREAS: 6,
  SUMMARY: 7,
  BOOKING: 8,
} as const;

const TOTAL_STEPS = 9;

export function QualifyingFlow() {
  const navigate = useNavigate();
  const { profile, loading, saving, saveProfile, isCompleted } = useIntakeProfile();
  const { bookAppointment, saving: bookingSaving } = useAppointments();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPregnancyTriage, setShowPregnancyTriage] = useState(false);
  const [formData, setFormData] = useState<IntakeFormData>({
    concernTags: [],
    supportAreas: [],
    redFlagSymptoms: [],
    preferenceTags: [],
  });

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        careSeekerType: profile.careSeekerType,
        relationshipIfOther: profile.relationshipIfOther,
        unifiedConcernCategory: profile.unifiedConcernCategory,
        primaryConcernCategory: profile.primaryConcernCategory,
        primaryConcernSubcategory: profile.primaryConcernSubcategory,
        concernTags: profile.concernTags || [],
        activityLevel: profile.activityLevel,
        motivationLevel: profile.motivationLevel,
        supportAreas: profile.supportAreas || [],
        aiFreeText: profile.aiFreeText,
        aiParsedFields: profile.aiParsedFields,
        redFlagSymptoms: profile.redFlagSymptoms || [],
        isPregnant: profile.isPregnant,
        takesMedication: profile.takesMedication,
        pregnancyStatus: profile.pregnancyStatus,
        pregnancyTriageReason: profile.pregnancyTriageReason,
        pregnancyReferredByCare: profile.pregnancyReferredByCare,
        triageResult: profile.triageResult,
        triageReasonCode: profile.triageReasonCode,
        providerCategory: profile.providerCategory,
        coachConcernCategory: profile.coachConcernCategory,
        coachConcernSubcategory: profile.coachConcernSubcategory,
        preferenceTags: profile.preferenceTags || [],
      });
      
      // Resume from saved step.
      // NOTE: We only migrate step indices when we detect a legacy (pre-simplification) profile.
      // Otherwise we'd incorrectly map new step indices (e.g. 3 -> 2) and the user gets stuck.
      if (profile.currentStep > 0 && !profile.completedAt) {
        const rawStep = profile.currentStep;

        const isLikelyLegacyProgress = (() => {
          if (rawStep > STEPS.BOOKING) return true;
          // In the new flow, triage is calculated in Problem (step 2), so at Reviews (3) it should exist.
          if (rawStep === STEPS.REVIEWS && !profile.triageResult) return true;
          // In the new flow you can't reach step 5+ without having set activityLevel in step 4.
          if (rawStep >= STEPS.MOTIVATION && !profile.activityLevel) return true;
          // In the new flow you can't reach step 6+ without having set motivationLevel in step 5.
          if (rawStep >= STEPS.SUPPORT_AREAS && !profile.motivationLevel) return true;
          return false;
        })();

        const migrateLegacyStep = (legacyStep: number) => {
          let mappedStep = legacyStep;
          if (legacyStep >= 3) {
            // After legacy SCREENING step removal
            mappedStep = Math.min(legacyStep - 1, STEPS.BOOKING);
          }
          if (mappedStep >= 4) {
            // After legacy TAGS step removal
            mappedStep = Math.min(mappedStep - 1, STEPS.BOOKING);
          }
          return mappedStep;
        };

        const resolvedStep = isLikelyLegacyProgress
          ? migrateLegacyStep(rawStep)
          : Math.min(rawStep, STEPS.BOOKING);

        setCurrentStep(resolvedStep);

        // Persist migration once so we don't keep remapping forever.
        if (isLikelyLegacyProgress && resolvedStep !== rawStep) {
          void saveProfile({ currentStep: resolvedStep });
        }
      }
    }
  }, [profile]);

  // Redirect if already completed
  useEffect(() => {
    if (isCompleted) {
      navigate('/home', { replace: true });
    }
  }, [isCompleted, navigate]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    saveProfile({ currentStep: step });
  };

  const handleBack = () => {
    if (showPregnancyTriage) {
      setShowPregnancyTriage(false);
      return;
    }
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleBackToAuth = () => {
    navigate('/', { replace: true });
  };

  // Step handlers
  const handleAIInput = async (data: {
    aiFreeText: string;
    aiParsedFields: IntakeFormData['aiParsedFields'];
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(STEPS.CARE_SEEKER);
  };

  const handleSkipAI = () => {
    goToStep(STEPS.CARE_SEEKER);
  };

  const handleCareSeeker = async (data: {
    careSeekerType: CareSeekerType;
    relationshipIfOther?: RelationshipType;
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(STEPS.PROBLEM);
  };

  const handleProblem = async (data: {
    unifiedConcernCategory?: UnifiedConcernCategory;
    isPregnant: boolean;
  }) => {
    const newFormData = { 
      ...formData, 
      ...data,
      // If pregnant, set pregnancy status
      pregnancyStatus: data.isPregnant ? 'pregnant' as const : undefined,
    };
    setFormData(newFormData);
    
    // If pregnant checkbox is checked, show pregnancy triage sub-step
    if (data.isPregnant) {
      await saveProfile({
        ...data,
        pregnancyStatus: 'pregnant',
      });
      setShowPregnancyTriage(true);
    } else {
      // Calculate triage based on all collected data
      const triageDecision = calculateTriage(newFormData);
      
      await saveProfile({
        ...data,
        triageResult: triageDecision.result,
        triageReasonCode: triageDecision.reasonCode,
        providerCategory: triageDecision.providerCategory,
        currentStep: STEPS.REVIEWS,
      });
      setCurrentStep(STEPS.REVIEWS);
    }
  };

  const handlePregnancyTriage = async (data: {
    pregnancyTriageReason: PregnancyTriageReason;
    pregnancyReferredByCare?: boolean;
  }) => {
    const newFormData = { 
      ...formData, 
      pregnancyTriageReason: data.pregnancyTriageReason,
      pregnancyReferredByCare: data.pregnancyReferredByCare,
    };
    setFormData(newFormData);
    
    // Calculate triage
    const triageDecision = calculateTriage(newFormData);
    
    await saveProfile({
      pregnancyTriageReason: data.pregnancyTriageReason,
      pregnancyReferredByCare: data.pregnancyReferredByCare,
      triageResult: triageDecision.result,
      triageReasonCode: triageDecision.reasonCode,
      providerCategory: triageDecision.providerCategory,
    });
    
    setShowPregnancyTriage(false);
    goToStep(STEPS.REVIEWS);
  };

  const handleReviews = () => {
    goToStep(STEPS.ACTIVITY);
  };

  const handleActivity = async (data: { activityLevel: ActivityLevel }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(STEPS.MOTIVATION);
  };

  const handleMotivation = async (data: { motivationLevel: MotivationLevel }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(STEPS.SUPPORT_AREAS);
  };

  const handleSupportAreas = async (data: { supportAreas: string[] }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    
    // Final triage calculation before summary
    const finalFormData = { ...formData, ...data };
    const triageDecision = calculateTriage(finalFormData);
    
    await saveProfile({
      ...data,
      triageResult: triageDecision.result,
      triageReasonCode: triageDecision.reasonCode,
      providerCategory: triageDecision.providerCategory,
    });
    goToStep(STEPS.SUMMARY);
  };

  const handleSummary = () => {
    goToStep(STEPS.BOOKING);
  };

  const handleBookingComplete = async () => {
    await saveProfile({}, true);
    navigate('/', { replace: true });
  };

  const handleSkipBooking = async () => {
    await saveProfile({}, true);
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get AI-suggested values for pre-filling
  const suggestedCategory = formData.aiParsedFields?.primaryConcernCategory as UnifiedConcernCategory | undefined;
  const suggestedSupportAreas = formData.aiParsedFields?.supportAreas || [];

  // Pregnancy triage sub-step
  if (showPregnancyTriage) {
    return (
      <PregnancyTriageStep
        currentStep={STEPS.PROBLEM}
        totalSteps={TOTAL_STEPS}
        onNext={handlePregnancyTriage}
        onBack={handleBack}
        initialReason={formData.pregnancyTriageReason}
        initialReferredByCare={formData.pregnancyReferredByCare}
      />
    );
  }

  return (
    <>
      {currentStep === STEPS.AI_INPUT && (
        <AIInputStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleAIInput}
          onBack={handleBackToAuth}
          onSkip={handleSkipAI}
          initialValue={formData.aiFreeText}
        />
      )}

      {currentStep === STEPS.CARE_SEEKER && (
        <CareSeekerStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleCareSeeker}
          onBack={handleBack}
          initialCareSeekerType={formData.careSeekerType}
          initialRelationship={formData.relationshipIfOther}
        />
      )}

      {currentStep === STEPS.PROBLEM && (
        <ProblemStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleProblem}
          onBack={handleBack}
          initialCategory={formData.unifiedConcernCategory}
          suggestedCategory={suggestedCategory}
          initialIsPregnant={formData.isPregnant}
        />
      )}

      {currentStep === STEPS.REVIEWS && (
        <ReviewsStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleReviews}
          onBack={handleBack}
        />
      )}

      {currentStep === STEPS.ACTIVITY && (
        <ActivityStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleActivity}
          onBack={handleBack}
          initialValue={formData.activityLevel}
        />
      )}

      {currentStep === STEPS.MOTIVATION && (
        <MotivationStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleMotivation}
          onBack={handleBack}
          initialValue={formData.motivationLevel}
        />
      )}

      {currentStep === STEPS.SUPPORT_AREAS && (
        <SupportAreasStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleSupportAreas}
          onBack={handleBack}
          initialValue={formData.supportAreas}
          suggestedAreas={suggestedSupportAreas}
        />
      )}

      {currentStep === STEPS.SUMMARY && (
        <SummaryStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleSummary}
          onBack={handleBack}
          isLoading={saving}
          triageResult={formData.triageResult}
          triageReasonCode={formData.triageReasonCode}
        />
      )}

      {currentStep === STEPS.BOOKING && (
        <BookingStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onComplete={handleBookingComplete}
          onBack={handleBack}
          onSkip={handleSkipBooking}
          isLoading={bookingSaving || saving}
          triageResult={formData.triageResult}
        />
      )}
    </>
  );
}
