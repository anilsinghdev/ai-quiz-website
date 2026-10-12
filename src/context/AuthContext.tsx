```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

interface DemoUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    username: string;
  };
}

interface DemoSession {
  user: DemoUser;
  access_token: string;
  token_type: string;
}

interface StoredAccount {
  user: DemoUser;
  profile: UserProfile;
  password: string;
}

interface AuthContextValue {
  session: DemoSession | null;
  user: DemoUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (params: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCOUNTS_KEY = 'demo_auth_accounts';
const SESSION_KEY = 'demo_auth_session';

function readAccounts(): StoredAccount[] {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    const parsed: unknown = JSON.parse(saved || '[]');
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const account = readAccounts().find(
      (item) => item.user.id === userId
    );
    setProfile(account?.profile ?? null);
  }, []);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);

      if (savedSession) {
        const parsed = JSON.parse(savedSession) as DemoSession;
        const account = readAccounts().find(
          (item) => item.user.id === parsed.user.id
        );

        if (account) {
          setSession(parsed);
          setUser(account.user);
          setProfile(account.profile);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ fullName, username, email, password }) => {
      const accounts = readAccounts();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim();

      if (
        !fullName.trim() ||
        !normalizedUsername ||
        !normalizedEmail ||
        !password
      ) {
        return { error: 'Please fill in all fields.' };
      }

      if (password.length < 8) {
        return { error: 'Password must be at least 8 characters.' };
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { error: 'Please enter a valid email address.' };
      }

      if (accounts.some((item) => item.user.email === normalizedEmail)) {
        return { error: 'An account with this email already exists.' };
      }

      if (
        accounts.some(
          (item) =>
            item.profile.username.toLowerCase() ===
            normalizedUsername.toLowerCase()
        )
      ) {
        return {
          error: 'This username is already taken. Please choose another.',
        };
      }

      const newUser: DemoUser = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        user_metadata: {
          full_name: fullName.trim(),
          username: normalizedUsername,
        },
      };

      const newProfile: UserProfile = {
        id: newUser.id,
        email: normalizedEmail,
        full_name: fullName.trim(),
        username: normalizedUsername,
        avatar_url: null,
        bio: null,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      accounts.push({
        user: newUser,
        profile: newProfile,
        password,
      });

      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

      return { error: null };
    },
    []
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      const normalizedEmail = email.trim().toLowerCase();
      const account = readAccounts().find(
        (item) => item.user.email === normalizedEmail
      );

      if (!account || account.password !== password) {
        return { error: 'Incorrect email or password.' };
      }

      const newSession: DemoSession = {
        user: account.user,
        access_token: crypto.randomUUID(),
        token_type: 'bearer',
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setUser(account.user);
      setProfile(account.profile);

      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        isAdmin,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuthHook() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}

export { useAuthHook as useAuth };
```
