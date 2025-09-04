import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { motion } from "framer-motion";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-card/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-secondary/50 transition-colors duration-200" />
              <SearchBar />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-secondary/50 transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-xs text-destructive-foreground font-bold">3</span>
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary/50 transition-colors duration-200"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto scrollbar-thin">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-6"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}