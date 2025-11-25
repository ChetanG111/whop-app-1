import { CheckInType, MuscleGroup } from '@prisma/client';

// Types matching API responses
export interface UserData {
  id: string;
  whopUserId: string;
  username: string | null;
  role: 'MEMBER' | 'COACH';
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  photoCount: number;
  lastPhotoDate: string | null;
}

export interface CheckinData {
  id: string;
  type: CheckInType;
  checkInDate: string;
  muscleGroup: MuscleGroup | null;
  note: string | null;
  isPublicNote: boolean;
  photo: {
    url: string;
    isPublic: boolean;
  } | null;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  type: CheckInType;
  checkInDate: string;
  muscleGroup: MuscleGroup | null;
  note: string | null;
  isPublicNote: boolean;
  photo: {
    url: string;
    isPublic: boolean;
  } | null;
  createdAt: string;
  user: {
    whopUserId: string;
    username: string | null;
  };
}

export interface CommunityStats {
  totalMembers: number;
  activeToday: number;
  workoutCheckIns: number;
  restCheckIns: number;
  reflectionCheckIns: number;
}

export interface ApiError {
  code: string;
  message: string;
}

// Helper for making authenticated requests
async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-whop-user-token': token,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      // Response is not JSON (might be HTML error page)
      const text = await response.text();
      throw {
        status: response.status,
        error: { 
          code: 'INVALID_RESPONSE', 
          message: `Server returned ${response.status}: ${response.statusText}` 
        },
      };
    }

    throw {
      status: response.status,
      error: errorData.error || errorData || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' },
    };
  }

  const data = await response.json();
  return data;
}

export const apiClient = {
  // User
  initUser: async (token: string): Promise<{ user: UserData }> => {
    return fetchWithAuth('/api/init-user', token, { method: 'POST' });
  },

  // Check-ins
  getTodayCheckin: async (token: string): Promise<{ checkin: CheckinData | null }> => {
    return fetchWithAuth('/api/checkin', token);
  },

  createCheckin: async (
    token: string,
    data: {
      type: CheckInType;
      muscleGroup?: MuscleGroup;
      note?: string;
      isPublicNote?: boolean;
      photoUrl?: string;
      isPublicPhoto?: boolean;
    }
  ): Promise<{ checkin: CheckinData }> => {
    return fetchWithAuth('/api/checkin', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHistory: async (token: string): Promise<{ checkins: CheckinData[] }> => {
    return fetchWithAuth('/api/checkin/history', token);
  },

  // Feed & Stats
  getFeed: async (token: string, offset = 0): Promise<{ feed: FeedItem[] }> => {
    return fetchWithAuth(`/api/feed?offset=${offset}`, token);
  },

  getCommunityStats: async (token: string): Promise<{ stats: CommunityStats }> => {
    return fetchWithAuth('/api/community-stats', token);
  },

  // Dev only - clear user data
  clearUserData: async (token: string): Promise<{ success: boolean; message: string }> => {
    return fetchWithAuth('/api/clear-data', token, { method: 'DELETE' });
  },
};
