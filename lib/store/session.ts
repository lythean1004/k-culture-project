import { create } from 'zustand';
import { RecommendInput, ThemeCode, VisitForm } from '../recommend/types';

interface UserSession extends Partial<RecommendInput> {
  step?: number;
}

interface SessionState {
  userSession: UserSession;
  savedPackages: string[];
  setSession: (session: Partial<UserSession>) => void;
  resetSession: () => void;
  savePackage: (packageId: string) => void;
  unsavePackage: (packageId: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  userSession: {
    step: 1,
    lang: 'en',
    cityCode: 'seoul',
    visitForm: 'DAY_TRIP',
    interests: [],
    transportMode: 'TRANSIT',
  },
  savedPackages: [],
  setSession: (session) =>
    set((state) => ({
      userSession: { ...state.userSession, ...session },
    })),
  resetSession: () =>
    set(() => ({
      userSession: {
        step: 1,
        lang: 'en',
        cityCode: 'seoul',
        visitForm: 'DAY_TRIP',
        interests: [],
        transportMode: 'TRANSIT',
      },
    })),
  savePackage: (packageId) =>
    set((state) => ({
      savedPackages: state.savedPackages.includes(packageId)
        ? state.savedPackages
        : [...state.savedPackages, packageId],
    })),
  unsavePackage: (packageId) =>
    set((state) => ({
      savedPackages: state.savedPackages.filter((id) => id !== packageId),
    })),
}));
