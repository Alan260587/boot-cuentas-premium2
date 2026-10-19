export const ADMIN_PASSWORD = '1987';
const STORAGE_KEY = 'sdp_admin_auth_1987';

export function isOwnerAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function verifyOwnerPassword(inputPassword: string): boolean {
  if (inputPassword.trim() === ADMIN_PASSWORD) {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      window.dispatchEvent(new Event('admin_auth_state_changed'));
    } catch (e) {
      console.error(e);
    }
    return true;
  }
  return false;
}

export function logoutOwner(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('admin_auth_state_changed'));
  } catch (e) {
    console.error(e);
  }
}
