import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntakeProfile } from '@/hooks/useIntakeProfile';
import { useAppointments } from '@/hooks/useAppointments';
import { AIInputStep } from './AIInputStep';
import { CareSeekerStep } from './CareSeekerStep';
import { ProblemStep } from './ProblemStep';
import { ReviewsStep } from './ReviewsStep';
import { ActivityStep } from './ActivityStep';
import { MotivationStep } from './MotivationStep';
import { SupportAreasStep } from './SupportAreasStep';
import { SummaryStep } from './SummaryStep';
import { BookingStep } from './BookingStep';
import { 
  IntakeFormData, 
  CareSeekerType, 
  RelationshipType, 
  PrimaryConcernCategory,
  ActivityLevel,
  MotivationLevel,
} from '@/types/intake';
import { Loader2 } from 'lucide-react';

const TOTAL_STEPS = 9;

export function QualifyingFlow() {
  const navigate = useNavigate();
  const { profile, loading, saving, saveProfile, isCompleted } = useIntakeProfile();
  const { bookAppointment, saving: bookingSaving } = useAppointments();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IntakeFormData>({
    concernTags: [],
    supportAreas: [],
  });

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
      });
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
    goToStep(1);
  };

  const handleSkipAI = () => {
    goToStep(1);
  };

  const handleCareSeeker = async (data: {
    careSeekerType: CareSeekerType;
    relationshipIfOther?: RelationshipType;
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(2);
  };

  const handleProblem = async (data: {
    primaryConcernCategory: PrimaryConcernCategory;
    primaryConcernSubcategory?: string;
    concernTags: string[];
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(3);
  };

  const handleReviews = () => {
    goToStep(4);
  };

  const handleActivity = async (data: { activityLevel: ActivityLevel }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(5);
  };

  const handleMotivation = async (data: { motivationLevel: MotivationLevel }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(6);
  };

  const handleSupportAreas = async (data: { supportAreas: string[] }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    await saveProfile(data);
    goToStep(7);
  };

  const handleSummary = () => {
    goToStep(8);
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

  return (
    <>
      {currentStep === 0 && (
        <AIInputStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleAIInput}
          onBack={handleBackToAuth}
          onSkip={handleSkipAI}
          initialValue={formData.aiFreeText}
        />
      )}

      {currentStep === 1 && (
        <CareSeekerStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleCareSeeker}
          onBack={handleBack}
          initialCareSeekerType={formData.careSeekerType}
          initialRelationship={formData.relationshipIfOther}
        />
      )}

      {currentStep === 2 && (
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
      )}

      {currentStep === 3 && (
        <ReviewsStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleReviews}
          onBack={handleBack}
        />
      )}

      {currentStep === 4 && (
        <ActivityStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleActivity}
          onBack={handleBack}
          initialValue={formData.activityLevel}
        />
      )}

      {currentStep === 5 && (
        <MotivationStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleMotivation}
          onBack={handleBack}
          initialValue={formData.motivationLevel}
        />
      )}

      {currentStep === 6 && (
        <SupportAreasStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleSupportAreas}
          onBack={handleBack}
          initialValue={formData.supportAreas}
          suggestedAreas={suggestedSupportAreas}
        />
      )}

      {currentStep === 7 && (
        <SummaryStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleSummary}
          onBack={handleBack}
          isLoading={saving}
        />
      )}

      {currentStep === 8 && (
        <BookingStep
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleBooking}
          onBack={handleBack}
          onSkip={handleSkipBooking}
          isLoading={bookingSaving || saving}
        />
      )}
    </>
  );
}
