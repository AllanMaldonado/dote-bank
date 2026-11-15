const CHAVE = 'dote:token';
let emMemoria = null;

export function getToken() {
  try {
    return localStorage.getItem(CHAVE) ?? emMemoria;
  } catch {
    return emMemoria;
  }
}

export function setToken(token) {
  emMemoria = token;
  try {
    localStorage.setItem(CHAVE, token);
  } catch {
  }
}

export function clearToken() {
  emMemoria = null;
  try {
    localStorage.removeItem(CHAVE);
  } catch {
  }
}
