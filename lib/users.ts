export interface User { id: string; name: string; group?: '智能科技班' | '偏理班'; grade?: '高一' | '高二' | '高三' }

const KEY_USERS = 'quiz_users';
const KEY_ACTIVE = 'quiz_active_user';

function safeParse(json: string | null): User[] { try { return json ? JSON.parse(json) : [] } catch { return [] } }

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(KEY_USERS));
}

export function addUser(name: string): User {
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const user: User = { id, name, group: undefined, grade: undefined };
  const list = getUsers();
  list.push(user);
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY_USERS, JSON.stringify(list));
  return user;
}

export function deleteUser(id: string) {
  const list = getUsers().filter(u => u.id !== id);
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY_USERS, JSON.stringify(list));
  const active = getActiveUserId();
  if (active === id) setActiveUserId(list[0]?.id || '');
}

export function setActiveUserId(id: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY_ACTIVE, id);
}

export function getActiveUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = window.localStorage.getItem(KEY_ACTIVE);
  return id && id.length > 0 ? id : null;
}

export function setUserGroup(id: string, group: '智能科技班' | '偏理班') {
  const list = getUsers();
  const idx = list.findIndex(u => u.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], group };
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY_USERS, JSON.stringify(list));
  }
}

export function setUserGrade(id: string, grade: '高一' | '高二' | '高三') {
  const list = getUsers();
  const idx = list.findIndex(u => u.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], grade };
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY_USERS, JSON.stringify(list));
  }
}


export function ensureDefaultUsers(names: string[]) {
  if (typeof window === 'undefined') return;
  const existing = getUsers();
  const existingNames = new Set(existing.map(u => u.name));
  let changed = false;
  names.forEach(n => {
    if (!existingNames.has(n)) { addUser(n); changed = true; }
  });
  if (changed) {
    const list = getUsers();
    const active = getActiveUserId();
    if (!active && list[0]) setActiveUserId(list[0].id);
  }
}
