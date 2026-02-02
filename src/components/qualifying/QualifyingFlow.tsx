import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntakeProfile } from '@/hooks/useIntakeProfile';
import { useAppointments } from '@/hooks/useAppointments';
import { AIInputStep } from './AIInputStep';
import { CareSeekerStep } from './CareSeekerStep';
import { ScreeningStep } from './ScreeningStep';
import { PregnancyTriageStep } from './PregnancyTriageStep';
import { ProblemStep } from './ProblemStep';
import { CoachProblemStep } from './CoachProblemStep';
import { TagsStep } from './TagsStep';
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
  PrimaryConcernCategory,
  CoachConcernCategory,
  ActivityLevel,
  MotivationLevel,
  RedFlagSymptom,
  PregnancyTriageReason,
} from '@/types/intake';
import { Loader2 } from 'lucide-react';

// Step indices for the new flow
const STEPS = {
  AI_INPUT: 0,
  CARE_SEEKER: 1,
  SCREENING: 2,
  PREGNANCY_TRIAGE: 2.5, // Sub-step, not counted in total
  PROBLEM: 3,
  TAGS: 4,
  REVIEWS: 5,
  ACTIVITY: 6,
  MOTIVATION: 7,
  SUPPORT_AREAS: 8,
  SUMMARY: 9,
  BOOKING: 10,
} as const;

const TOTAL_STEPS = 11;

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

  // Track if user should follow coach path (no red flags)
  const [isCoachPath, setIsCoachPath] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        careSeekerType: profile.careSeekerType,
        relationshipIfOther: profile.relationshipIfOther,
        primaryConcernCategory: profile.primaryConcernCategory,
        primaryConcernSubcategory: profile.primaryConcernSubcategory,
        concernTags: profile.concernTags || [],
        activityLevel: profile.activityLevel,
        motivationLevel: profile.motivationLevel,
        supportAreas: profile.supportAreas || [],
        aiFreeText: profile.aiFreeText,
        aiParsedFields: profile.aiParsedFields,
        redFlagSymptoms: profile.redFlagSymptoms || [],
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
      
      // Determine if on coach path based on saved data
      const hasRedFlags = (profile.redFlagSymptoms || []).some(
        s => s !== 'pregnancy' && ['medical_diagnosis', 'involuntary_weight_loss', 'eating_disorder_risk', 'medication_risk'].includes(s)
      );
      setIsCoachPath(!hasRedFlags && profile.redFlagSymptoms?.length === 0);
      
      // Resume from saved step
      if (profile.currentStep > 0 && !profile.completedAt) {
        setCurrentStep(profile.currentStep);
      }
    }
  }, [profile]);

  // Redirect if already completed
  useEffect(() => {
    if (isCompleted) {
      navigate('/', { replace: true });
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
    navigate('/auth', { replace: true });
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
    goToStep(STEPS.SCREENING);
  };

  const handleScreening = async (data: {
    redFlagSymptoms: RedFlagSymptom[];
    showPregnancyTriage: boolean;
  }) => {
    const newFormData = { ...formData, redFlagSymptoms: data.redFlagSymptoms };
    setFormData(newFormData);
    
    // Check if user has red flags (excluding pregnancy)
    const hasNonPregnancyRedFlags = data.redFlagSymptoms.some(
      s => s !== 'pregnancy' && ['medical_diagnosis', 'involuntary_weight_loss', 'eating_disorder_risk', 'medication_risk'].includes(s)
    );
    
    if (data.showPregnancyTriage) {
      // Show pregnancy triage sub-step
      setShowPregnancyTriage(true);
      await saveProfile({ 
        redFlagSymptoms: data.redFlagSymptoms,
        pregnancyStatus: 'pregnant',
      });
    } else if (hasNonPregnancyRedFlags) {
      // User has red flags → dietist path
      setIsCoachPath(false);
      await saveProfile({ redFlagSymptoms: data.redFlagSymptoms });
      goToStep(STEPS.PROBLEM);
    } else {
      // No red flags → coach path
      setIsCoachPath(true);
      await saveProfile({ redFlagSymptoms: data.redFlagSymptoms });
      goToStep(STEPS.PROBLEM);
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
    
    // Calculate if this leads to dietist or coach
    const triageDecision = calculateTriage(newFormData);
    setIsCoachPath(triageDecision.result === 'coach');
    
    await saveProfile({
      pregnancyTriageReason: data.pregnancyTriageReason,
      pregnancyReferredByCare: data.pregnancyReferredByCare,
      triageResult: triageDecision.result,
      triageReasonCode: triageDecision.reasonCode,
      providerCategory: triageDecision.providerCategory,
    });
    
    setShowPregnancyTriage(false);
    goToStep(STEPS.PROBLEM);
  };

  const handleProblem = async (data: {
    primaryConcernCategory: PrimaryConcernCategory;
    primaryConcernSubcategory?: string;
    concernTags: string[];
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(STEPS.TAGS);
  };

  const handleCoachProblem = async (data: {
    coachConcernCategory: CoachConcernCategory;
    coachConcernSubcategory?: string;
  }) => {
    const newFormData = { ...formData, ...data };
    setFormData(newFormData);
    
    // Calculate triage result
    const triageDecision = calculateTriage(newFormData);
    
    await saveProfile({
      ...data,
      triageResult: triageDecision.result,
      triageReasonCode: triageDecision.reasonCode,
      providerCategory: triageDecision.providerCategory,
    });
    goToStep(STEPS.TAGS);
  };

  const handleTags = async (data: { preferenceTags: string[] }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
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

  const handleBooking = async (appointmentDate: Date) => {
    const result = await bookAppointment(appointmentDate, 'video');
    if (result) {
      await saveProfile({}, true);
      navigate('/', { replace: true });
    }
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
  const suggestedCategory = formData.aiParsedFields?.primaryConcernCategory as PrimaryConcernCategory | undefined;
  const suggestedSubcategory = formData.aiParsedFields?.primaryConcernSubcategory;
  const suggestedSupportAreas = formData.aiParsedFields?.supportAreas || [];

  // Pregnancy triage sub-step
  if (showPregnancyTriage) {
    return (
      <PregnancyTriageStep
        currentStep={STEPS.SCREENING}
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

      {currentStep === STEPS.SCREENING && (
        <ScreeningStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleScreening}
          onBack={handleBack}
          initialSymptoms={formData.redFlagSymptoms}
        />
      )}

      {currentStep === STEPS.PROBLEM && (
        isCoachPath ? (
          <CoachProblemStep
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleCoachProblem}
            onBack={handleBack}
            initialCategory={formData.coachConcernCategory}
            initialSubcategory={formData.coachConcernSubcategory}
          />
        ) : (
          <ProblemStep
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleProblem}
            onBack={handleBack}
            initialCategory={formData.primaryConcernCategory}
            initialSubcategory={formData.primaryConcernSubcategory}
            initialTags={formData.concernTags}
            suggestedCategory={suggestedCategory}
            suggestedSubcategory={suggestedSubcategory}
          />
        )
      )}

      {currentStep === STEPS.TAGS && (
        <TagsStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleTags}
          onBack={handleBack}
          initialTags={formData.preferenceTags}
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
          onNext={handleBooking}
          onBack={handleBack}
          onSkip={handleSkipBooking}
          isLoading={bookingSaving || saving}
          triageResult={formData.triageResult}
        />
      )}
    </>
  );
}
