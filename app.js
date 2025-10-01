// Utilities de armazenamento
const Storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

// Hash SHA-256 da senha (didático; para produção real, use backend!)
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// AUTH: users = [{email, passwordHash, createdAt}]
const USERS_KEY = "users";
const SESSION_KEY = "sessionUser";

const Auth = {
  async signup(email, password) {
    if (!email || !password) throw new Error("Informe e-mail e senha.");
    if (password.length < 6) throw new Error("Senha precisa ter pelo menos 6 caracteres.");
    const users = Storage.get(USERS_KEY, []);
    if (users.some(u => u.email === email)) throw new Error("E-mail já cadastrado.");
    const passwordHash = await sha256(password);
    users.push({ email, passwordHash, createdAt: new Date().toISOString() });
    Storage.set(USERS_KEY, users);
    return true;
  },

  async login(email, password) {
    const users = Storage.get(USERS_KEY, []);
    const user = users.find(u => u.email === email);
    if (!user) throw new Error("Usuário não encontrado.");
    const passwordHash = await sha256(password);
    if (user.passwordHash !== passwordHash) throw new Error("Senha inválida.");
    Storage.set(SESSION_KEY, { email: user.email, loggedAt: Date.now() });
    return true;
  },

  getSession() {
    return Storage.get(SESSION_KEY, null);
  },

  logout() {
    Storage.remove(SESSION_KEY);
  }
};

// NOTES: por usuário, chave = `notes:<email>`
const Notes = {
  key(email) { return `notes:${email}`; },

  getAll(email) {
    return Storage.get(this.key(email), []);
  },

  add(email, text) {
    const list = this.getAll(email);
    list.unshift(text);
    Storage.set(this.key(email), list);
  },

  remove(email, index) {
    const list = this.getAll(email);
    list.splice(index, 1);
    Storage.set(this.key(email), list);
  }
};

window.Auth = Auth;
window.Notes = Notes;
