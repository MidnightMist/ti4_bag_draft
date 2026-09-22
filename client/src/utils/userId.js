// Helper to get or initialize persistent user ID for claim logic
export function getOrCreateUserId() {
  // 1. Support ?user= query param (e.g. ?user=p1 or ?user=p2) for multi-tab debugging
  try {
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get('user');
    if (urlUser && urlUser.trim()) {
      return 'user_debug_' + urlUser.trim();
    }
  } catch {
    // ignore
  }

  // 2. Check session override (for Seat Switcher in the same tab)
  const sessionUser = sessionStorage.getItem('ti4_active_user_override');
  if (sessionUser) {
    return sessionUser;
  }

  // 3. Fallback to persistent localStorage
  const STORAGE_KEY = 'ti4_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

export function setActiveUserOverride(overrideId) {
  if (!overrideId) {
    sessionStorage.removeItem('ti4_active_user_override');
  } else {
    sessionStorage.setItem('ti4_active_user_override', overrideId);
  }
}

export function getUserDisplayName() {
  const STORAGE_KEY = 'ti4_user_display_name';
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setUserDisplayName(name) {
  const STORAGE_KEY = 'ti4_user_display_name';
  localStorage.setItem(STORAGE_KEY, name);
}
