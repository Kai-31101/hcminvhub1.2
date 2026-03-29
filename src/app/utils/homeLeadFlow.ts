export type PendingHomeActionType = 'fast_track' | 'support';

export interface FastTrackDraft {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  sector: string;
  locationNeed: string;
  investmentSize: string;
  investmentType: string;
  notes: string;
}

export interface SupportDraft {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  projectId: string;
  topic: string;
  message: string;
  urgent: boolean;
}

export type PendingHomeAction =
  | {
      type: 'fast_track';
      payload: FastTrackDraft;
      createdAt: string;
    }
  | {
      type: 'support';
      payload: SupportDraft;
      createdAt: string;
    };

const HOME_PENDING_ACTION_KEY = 'hcminvhub-home-pending-action';

export function savePendingHomeAction(action: PendingHomeAction) {
  window.localStorage.setItem(HOME_PENDING_ACTION_KEY, JSON.stringify(action));
}

export function readPendingHomeAction(): PendingHomeAction | null {
  const raw = window.localStorage.getItem(HOME_PENDING_ACTION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingHomeAction;
    if (!parsed?.type || !parsed?.payload) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingHomeAction() {
  window.localStorage.removeItem(HOME_PENDING_ACTION_KEY);
}
