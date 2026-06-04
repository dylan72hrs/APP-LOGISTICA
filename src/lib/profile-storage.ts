const PROFILE_NICKNAME_STORAGE_PREFIX = 'app-logistica:profile-nickname:';

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function getNicknameStorageKey(email: string) {
  return `${PROFILE_NICKNAME_STORAGE_PREFIX}${email.toLowerCase()}`;
}

export function loadProfileNickname(email: string) {
  if (!canUseLocalStorage()) return '';

  try {
    return window.localStorage.getItem(getNicknameStorageKey(email)) || '';
  } catch {
    return '';
  }
}

export function saveProfileNickname(email: string, nickname: string) {
  if (!canUseLocalStorage()) return;

  try {
    const key = getNicknameStorageKey(email);
    const trimmedNickname = nickname.trim();

    if (trimmedNickname) {
      window.localStorage.setItem(key, trimmedNickname);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Visual-only profile preferences must never block navigation.
  }
}
