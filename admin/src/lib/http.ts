import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1',
  timeout: 15000,
  withCredentials: true,
});

// Front e API ficam em domínios *.vercel.app diferentes (cada subdomínio conta
// como um "site" à parte para cookies cross-site), e navegadores modernos
// recusam esse cookie de sessão mesmo com SameSite=None. Por isso guardamos o
// token aqui e mandamos via Authorization: Bearer, que não depende do
// navegador aceitar cookie de terceiro — o cookie HttpOnly continua sendo
// setado e funciona normalmente se um dia front e API ficarem no mesmo site.
const TOKEN_STORAGE_KEY = 'genesis_admin_token';
let token: string | null = null;
try {
  token = localStorage.getItem(TOKEN_STORAGE_KEY);
} catch {
  token = null;
}

export const setAuthToken = (value: string | null): void => {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_STORAGE_KEY, value);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage indisponível (modo privado etc.): segue só com o token em memória.
  }
};

http.interceptors.request.use((config) => {
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

const AUTH_PATHS = ['/admin/auth/login', '/admin/auth/me', '/admin/auth/logout'];

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && !AUTH_PATHS.some((path) => error.config?.url?.endsWith(path))) {
      setAuthToken(null);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);
