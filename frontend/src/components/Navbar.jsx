import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Scale, Settings, Sun, User, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/dataService";
import { socket } from "@/lib/socketClient";

const getPrimaryNavLinks = (role) => {
  if (role === "lawyer") {
    return [
      { to: "/lawyer/dashboard", label: "Dashboard" },
      { to: "/messages", label: "Messages" },
      { to: "/bookings", label: "Requests" },
    ];
  }

  if (role === "admin") {
    return [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/dashboard#bookings", label: "Bookings" },
      { to: "/admin/dashboard#users", label: "Users" },
    ];
  }

  return [
    { to: "/lawyers", label: "Find Lawyers" },
    { to: "/messages", label: "Messages" },
  ];
};

const NotificationBell = ({
  currentUser,
  notifications,
  unreadCount,
  handleMarkAllRead,
  handleNotifClick,
}) => {
  if (!currentUser) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full bg-red-600" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-0 text-xs text-primary">
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotifClick(notification)}
                className={`block w-full border-b px-4 py-3 text-left hover:bg-muted/50 ${
                  !notification.read ? "bg-muted/20" : ""
                }`}
              >
                <div className="text-sm font-medium">{notification.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{notification.body}</div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const canGoBack = location.pathname !== "/";
  const primaryLinks = getPrimaryNavLinks(currentUser?.role);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications();
        setNotifications(data?.notifications || []);
        setUnreadCount(data?.unreadCount || 0);
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    loadNotifications();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join", currentUser.id);

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      // Ignore minor notification sync failures in navbar.
    }
  };

  const handleNotifClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        );
      } catch {
        // Ignore minor notification sync failures in navbar.
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 z-[60] rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            {canGoBack ? (
              <Button variant="ghost" size="icon" aria-label="Go back" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}

            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-primary">LAWCONNECT</span>
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {primaryLinks.map((link) => (
              <Link
                key={`${link.to}-${link.label}`}
                to={link.to}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <NotificationBell
              currentUser={currentUser}
              notifications={notifications}
              unreadCount={unreadCount}
              handleMarkAllRead={handleMarkAllRead}
              handleNotifClick={handleNotifClick}
            />

            {currentUser ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <NotificationBell
              currentUser={currentUser}
              notifications={notifications}
              unreadCount={unreadCount}
              handleMarkAllRead={handleMarkAllRead}
              handleNotifClick={handleNotifClick}
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="mt-8 flex flex-col gap-3">
                  {canGoBack ? (
                    <Button variant="ghost" className="justify-start" onClick={handleBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : null}

                  {primaryLinks.map((link) => (
                    <Link key={`${link.to}-${link.label}`} to={link.to}>
                      <Button variant="ghost" className="w-full justify-start">
                        {link.label}
                      </Button>
                    </Link>
                  ))}

                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  >
                    {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </Button>

                  {currentUser ? (
                    <>
                      <Link to="/profile">
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link to="/settings">
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login">
                        <Button variant="ghost" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button variant="default" className="w-full">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export { Navbar };
