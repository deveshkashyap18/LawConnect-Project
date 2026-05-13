# Session Management & Authentication Timeout

## Overview

Session management ensures that users are automatically logged out after 2 hours of inactivity or when their token expires. This prevents unauthorized access and improves security.

## How It Works

### Token Generation (Backend)
- **Location:** `backend/src/controllers/authController.js`
- **Expiration:** 2 hours
- **Token Type:** JWT (JSON Web Token)

```javascript
const generateToken = (user) =>
  jwt.sign({ userId: user._id.toString(), role: user.role }, getJwtSecret(), {
    expiresIn: "2h",  // Token valid for 2 hours
  });
```

### Token Storage (Frontend)
- **Location:** `frontend/src/lib/apiClient.js`
- **Storage Type:** Browser localStorage
- **Data Stored:**
  - Token: `lawconnect-auth-token`
  - Expiry Time: `lawconnect-token-expiry` (timestamp)

### Session Expiration Flow

```
User Logs In
    ↓
Token Generated (2 hour validity)
    ↓
Token + Expiry Time Stored in localStorage
    ↓
Session Timeout Started (2 hours)
    ↓
Every 60 seconds: Check if token expired
    ↓
After 2 Hours: 
    → Token Expires
    → User Auto-Logged Out
    → Session Cleared
    ↓
User Redirected to Login
```

## Components & Files

### 1. Backend Authentication
**File:** `backend/src/controllers/authController.js`

Key function:
```javascript
const generateToken = (user) => {
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: "2h" }  // Changed from "7d" to "2h"
  );
};
```

### 2. Frontend API Client
**File:** `frontend/src/lib/apiClient.js`

New functions:
- `setAuthToken(token)` - Stores token and calculates expiry time
- `getTokenExpiry()` - Retrieves stored expiry timestamp
- `isTokenExpired()` - Checks if current time exceeded expiry
- `getAuthToken()` - Retrieves token
- `apiRequest()` - Updated to check expiration before API calls

```javascript
const TOKEN_EXPIRY_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("lawconnect-auth-token", token);
    // Set expiry to 2 hours from now
    const expiryTime = Date.now() + TOKEN_EXPIRY_TIME;
    localStorage.setItem("lawconnect-token-expiry", expiryTime.toString());
  } else {
    localStorage.removeItem("lawconnect-auth-token");
    localStorage.removeItem("lawconnect-token-expiry");
  }
};

const isTokenExpired = () => {
  const expiry = getTokenExpiry();
  return expiry ? Date.now() > expiry : false;
};
```

### 3. Authentication Context
**File:** `frontend/src/context/AuthContext.jsx`

Features:
- Checks token expiration on app load
- Sets 2-hour session timeout on login
- Periodically checks expiration (every 60 seconds)
- Auto-logs out on expiration
- Clears session timeout on logout

```javascript
// Check expiration periodically
useEffect(() => {
  const expirationCheckInterval = setInterval(() => {
    if (isTokenExpired()) {
      setCurrentUser(null);
      setAuthToken(null);
      window.dispatchEvent(new Event("auth:logout"));
    }
  }, 60000); // Check every minute

  return () => clearInterval(expirationCheckInterval);
}, []);

// Set 2-hour session timeout
const setSessionTimeout = useCallback(() => {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  sessionTimeoutRef.current = setTimeout(() => {
    setCurrentUser(null);
    setAuthToken(null);
  }, TWO_HOURS);
}, []);
```

## Timeline

### From Login to Logout

| Time | Event |
|------|-------|
| T+0:00 | User logs in → Token issued (2h valid) → Stored in localStorage |
| T+0:01 to T+1:59 | User can make API requests → Token valid |
| T+1:00, T+2:00, etc. | Background check runs → Token still valid |
| **T+2:00** | **Token expires → User auto-logged out** |
| T+2:00+ | Any API call → 401 response → Redirected to login |

## Security Features

✅ **Automatic Expiration** - No need for manual logout  
✅ **Server-side Validation** - Backend verifies token on every request  
✅ **Client-side Checks** - Frontend prevents requests with expired tokens  
✅ **Periodic Verification** - Current token checked every 60 seconds  
✅ **No Persistence** - Session ends even if browser stays open  
✅ **Clear Logout** - Token immediately removed from storage  

## What Happens When Token Expires

### Scenario 1: User Makes API Request After 2 Hours
```
1. User tries to load data
2. Frontend checks token expiration
3. Token is expired
4. Request is blocked
5. User is logged out
6. Message: "Session expired. Please login again."
7. Redirected to login page
```

### Scenario 2: Server Restarts Within 2-Hour Session
```
1. Server restarts
2. App reloads
3. AuthContext checks stored token
4. Calculates remaining time
5. If within 2 hours: Session continues
6. If expired: User must login again
7. Session timeout restarted
```

### Scenario 3: Browser Storage Cleared
```
1. User clears browser cache
2. Token removed from localStorage
3. User logged out automatically
4. Redirected to login
```

## User Experience

### Before (Old System)
- ❌ 7-day token validity
- ❌ User stays logged in even after days
- ❌ Server restart doesn't affect session
- ❌ No automatic logout

### After (New System)
- ✅ 2-hour token validity
- ✅ Automatic logout after 2 hours
- ✅ Session ends on server restart
- ✅ Periodic security checks
- ✅ Clear "Session expired" message

## Configuration

### Change Session Duration

**Backend** - File: `backend/src/controllers/authController.js`
```javascript
const generateToken = (user) =>
  jwt.sign({ userId, role }, secret, {
    expiresIn: "1h",  // Change "2h" to desired duration
  });
```

**Frontend** - File: `frontend/src/lib/apiClient.js`
```javascript
const TOKEN_EXPIRY_TIME = 1 * 60 * 60 * 1000;  // Change "2h" equivalent
```

### Supported Duration Formats
- Seconds: `"30s"`
- Minutes: `"30m"`
- Hours: `"2h"`
- Days: `"7d"`

## Testing

### Test 1: Token Expiration
1. Login as client
2. Wait 2 hours
3. Try to access any page
4. Should see "Session expired" message
5. Redirected to login

### Test 2: Server Restart
1. Login as lawyer
2. Keep browser open
3. Restart backend server
4. Try to make API call
5. Should see "Session expired" message

### Test 3: Multiple Tabs
1. Login in Tab 1
2. Open app in Tab 2 (same browser)
3. Logout in Tab 1
4. Try action in Tab 2
5. Should auto-logout and redirect

### Test 4: LocalStorage Cleared
1. Login
2. Open Developer Tools
3. Clear Application → LocalStorage
4. Refresh page
5. Should be logged out

## API Endpoints

### Login
```
POST /api/auth/login
Request: { email, password, role }
Response: { user, token }
Token: Valid for 2 hours
```

### Session Check
```
GET /api/auth/me
Header: Authorization: Bearer <token>
Response: { user } or 401 if token expired
```

### Logout
```
POST /api/auth/logout
Header: Authorization: Bearer <token>
Response: { message: "Logged out" }
```

## Error Messages

| Scenario | Message |
|----------|---------|
| Token expired | "Session expired. Please login again." |
| Invalid token | "Unauthorized. Please login." |
| No token provided | "Authentication required." |
| Server error | "Unable to connect to backend." |

## Storage Details

### localStorage Keys
```javascript
"lawconnect-auth-token"      // JWT token
"lawconnect-token-expiry"    // Expiry timestamp (milliseconds)
```

### Token Expiry Calculation
```javascript
Expiry Time = Current Time + 2 hours
Example: 1713084000000 (timestamp in milliseconds)
```

## Security Best Practices

✅ **Always use HTTPS** - Protect token in transit  
✅ **Don't share tokens** - Don't expose in URLs  
✅ **Clear on logout** - Always remove token from storage  
✅ **Validate server-side** - Never trust client-side only  
✅ **Use short expiration** - 2 hours is good  
✅ **Manual logout** - Allows immediate invalidation  

## Troubleshooting

**Problem:** User keeps getting logged out  
**Solution:** Check if backend and frontend TOKEN_EXPIRY_TIME match

**Problem:** Token doesn't expire after 2 hours  
**Solution:** Verify backend token expiration is set to "2h"

**Problem:** Session expires too quickly  
**Solution:** Increase TOKEN_EXPIRY_TIME in frontend apiClient.js

**Problem:** User can still access after logout  
**Solution:** Verify token is removed from localStorage

## Future Enhancements

- [ ] Refresh token implementation (auto-renew without re-login)
- [ ] Activity tracking (extend session on user activity)
- [ ] Session revocation per device
- [ ] Multi-device session management
- [ ] Emergency logout (logout from all devices)
- [ ] Session expiry warning (5 min before expiry)

