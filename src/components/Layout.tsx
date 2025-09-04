import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { motion } from "framer-motion";
import { Bell, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ARIA_LABELS, prefersReducedMotion } from "../utils/accessibility";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading, signOut } = useAuth();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading state with accessibility
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background"
        role="status"
        aria-live="polite"
        aria-label={ARIA_LABELS.loading}
      >
        <div className="animate-pulse text-lg text-muted-foreground">
          <span className="sr-only">{ARIA_LABELS.loading}</span>
          Loading...
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  // Motion settings based on user preferences
  const motionSettings = reducedMotion ? 
    { initial: {}, animate: {}, transition: { duration: 0 } } :
    { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  return (
    <>
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link focus:ring-accessible"
      >
        Skip to main content
      </a>
      
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <motion.header
              {...motionSettings}
              className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/50 bg-card/30 backdrop-blur-sm"
              role="banner"
            >
              <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <SidebarTrigger 
                  className="hover:bg-secondary/50 transition-colors duration-200 focus:ring-accessible min-h-[44px] min-w-[44px]"
                  aria-label={ARIA_LABELS.sidebarToggle}
                />
                <div className="flex-1 max-w-md">
                  <SearchBar />
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-secondary/50 transition-colors duration-200 focus:ring-accessible min-h-[44px] min-w-[44px]"
                  aria-label={`Notifications (${notificationCount} unread)`}
                  aria-describedby="notification-count"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {notificationCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                      id="notification-count"
                      aria-label={`${notificationCount} unread notifications`}
                    >
                      <span className="text-xs text-destructive-foreground font-bold">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-secondary/50 transition-colors duration-200 focus:ring-accessible min-h-[44px] min-w-[44px]"
                      aria-label="User menu"
                    >
                      <User className="w-5 h-5" aria-hidden="true" />
                      <span className="sr-only">Open user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56"
                    role="menu"
                    aria-label="User account options"
                  >
                    <DropdownMenuItem 
                      disabled 
                      className="flex flex-col items-start"
                      role="menuitem"
                    >
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-muted-foreground">Signed in as</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="text-red-600 focus:ring-accessible"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.header>

            {/* Main Content */}
            <main 
              id="main-content"
              className="flex-1 overflow-auto scrollbar-thin"
              role="main"
              tabIndex={-1}
            >
              <motion.div
                {...(reducedMotion ? 
                  { initial: {}, animate: {}, transition: { duration: 0 } } :
                  { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.1 } }
                )}
                className="p-4 sm:p-6"
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}