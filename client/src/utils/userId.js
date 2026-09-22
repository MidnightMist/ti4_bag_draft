// Helper to get or initialize persistent user ID for claim logic
export function getOrCreateUserId() {
  const STORAGE_KEY = 'ti4_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

export function getUserDisplayName() {
  const STORAGE_KEY = 'ti4_user_display_name';
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setUserDisplayName(name) {
  const STORAGE_KEY = 'ti4_user_display_name';
  localStorage.setItem(STORAGE_KEY, name);
}
