import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  getSessionUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "@/lib/authService";
import { isTokenExpired, setAuthToken } from "@/lib/apiClient";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const sessionTimeoutRef = useRef(null);

  // Check token expiration
  const checkTokenExpiration = useCallback(() => {
    if (isTokenExpired()) {
      console.log("Token expired, logging out...");
      setCurrentUser(null);
      setAuthToken(null);
      window.dispatchEvent(new Event("auth:logout"));
    }
  }, []);

  // Set up session timeout (2 hours)
  const setSessionTimeout = useCallback(() => {
    // Clear existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    // Set new timeout for 2 hours of inactivity
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    sessionTimeoutRef.current = setTimeout(() => {
      console.log("Session timeout reached, logging out...");
      setCurrentUser(null);
      setAuthToken(null);
      window.dispatchEvent(new Event("auth:logout"));
    }, TWO_HOURS);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        // Check if token is expired first
        if (isTokenExpired()) {
          console.log("Token already expired, skipping session load");
          setAuthToken(null);
          setCurrentUser(null);
        } else {
          const user = await getSessionUser();
          if (isMounted) {
            setCurrentUser(user);
            if (user) {
              setSessionTimeout();
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    // Auto-logout when apiClient fires auth:logout (401 response or token expired)
    const handleAutoLogout = () => {
      if (isMounted) {
        setCurrentUser(null);
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };

    window.addEventListener("auth:logout", handleAutoLogout);
    loadSession();

    // Check token expiration periodically (every minute)
    const expirationCheckInterval = setInterval(() => {
      checkTokenExpiration();
    }, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:logout", handleAutoLogout);
      clearInterval(expirationCheckInterval);
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [checkTokenExpiration, setSessionTimeout]);


  const signup = useCallback(async (payload) => {
    const user = await registerUser(payload);
    setCurrentUser(user);
    setSessionTimeout();
    return user;
  }, [setSessionTimeout]);

  const signin = useCallback(async (payload) => {
    const user = await loginUser(payload);
    setCurrentUser(user);
    setSessionTimeout();
    return user;
  }, [setSessionTimeout]);

  const logout = useCallback(async () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    await logoutUser();
    setCurrentUser(null);
  }, []);

  const saveProfile = useCallback(async (updates) => {
    if (!currentUser) {
      throw new Error("No logged in user.");
    }

    const updatedUser = await updateUser(updates);
    setCurrentUser(updatedUser);
    return updatedUser;
  }, [currentUser]);

  const updateCredentials = useCallback(
    async ({ email, currentPassword, newPassword }) => {
      if (!currentUser) {
        throw new Error("No logged in user.");
      }

      const updatedUser = await updateUser({
        email,
        currentPassword,
        newPassword,
      });
      setCurrentUser(updatedUser);
      return updatedUser;
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser) && !isAuthLoading,
      isAuthLoading,
      signup,
      signin,
      saveProfile,
      updateCredentials,
      logout,
    }),
    [
      currentUser,
      isAuthLoading,
      logout,
      saveProfile,
      signin,
      signup,
      updateCredentials,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export { AuthProvider, useAuth };
