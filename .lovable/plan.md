

## Plan: AI Nutrition Onboarding Card for New Users

### What the user wants
When a new user first opens the Journal page, they should see a card overlaying the daily nutrition goals area. This card offers two options:
1. **Activate** — Opens a setup form (gender, height, weight, activity level), then calculates personalized daily macro goals using the Mifflin-St Jeor equation
2. **Decline** — Keeps the current default goals (2000 kcal, 50g protein, 250g carbs, 65g fat)

### Current state
- The `AITrackingOnboarding` card exists but only shows when `aiTrackingEnabled=true && aiTrackingOnboardingCompleted=false` — new users never see it because `aiTrackingEnabled` defaults to `false`
- The `AITrackingSetupForm` collects body data but does NOT calculate personalized goals
- Default goals are hardcoded (2000/50/250/65)

### Changes

**1. Update show-condition for onboarding card** (`Journal.tsx`)
- Change `showOnboarding` from `settings.aiTrackingEnabled && !settings.aiTrackingOnboardingCompleted` to just `!settings.aiTrackingOnboardingCompleted`
- This makes the card appear for all new users who haven't made a choice yet

**2. Update onboarding card copy** (`AITrackingOnboarding.tsx`)
- Reframe from "AI photo tracking" to "personalized nutrition goals"
- Title: "Vill du ha personliga näringmål?"
- Description: Explain that goals will be calculated based on body measurements
- Keep "Inte nu" and "Aktivera" buttons

**3. Add macro calculation logic** (`useJournalData.ts` or new utility)
- Implement Mifflin-St Jeor BMR formula:
  - Male: `10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161` (simplified without age, use 30 as default)
  - Female: same minus 161
- Apply activity multiplier for TDEE
- Derive macros: protein ~1.6g/kg, fat ~30% of TDEE, carbs fill remaining
- On form completion, save calculated goals to `user_nutrition_goals` table

**4. Update `handleAISetupComplete`** (`Journal.tsx`)
- After saving settings, calculate goals from the body data and call `updateGoals()` with the computed values
- Mark `aiTrackingOnboardingCompleted = true`

**5. Update skip handler**
- `handleSkipAITracking` already marks onboarding completed — no change needed, defaults remain

### No database changes needed
The existing `user_nutrition_settings` and `user_nutrition_goals` tables already support all required fields.

