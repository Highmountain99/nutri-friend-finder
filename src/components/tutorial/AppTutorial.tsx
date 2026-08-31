import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CoachTour } from "@/components/tutorial/CoachTour";

const storageKey = (userId: string) => `gf_tutorial_v1_${userId}`;

export function hasSeenTutorial(userId: string) {
  try {
    return localStorage.getItem(storageKey(userId)) === "done";
  } catch {
    return true;
  }
}

export function restartTutorial() {
  window.dispatchEvent(new CustomEvent("gf-restart-tutorial"));
}

export function AppTutorial() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Auto-start once per user
  useEffect(() => {
    if (!user) return;
    if (hasSeenTutorial(user.id)) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [user]);

  // Manual restart from the side menu
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("gf-restart-tutorial", handler);
    return () => window.removeEventListener("gf-restart-tutorial", handler);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const finish = useCallback(() => {
    setOpen(false);
    if (user) {
      try {
        localStorage.setItem(storageKey(user.id), "done");
      } catch {
        /* ignore */
      }
    }
    navigate("/home");
  }, [user, navigate]);

  if (!open) return null;

  return <OnboardingSimulator onFinish={finish} />;
}
