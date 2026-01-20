import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Clipboard,
  Menu,
  Building2,
  Network,
  User,
  Bot,
  BrainCircuit,
} from "lucide-react";
import { Button } from "../shadcn/button";
import { cn } from "@/lib/utils";
import { ChatListSidebar } from "./ChatListSidebar";
import UserDropdown from "../user/UserDropdown";
import CompanyAreaDropdown from "../user/CompanyAreaDropdown";
import { useMenuItems } from "../../hooks/useMenuItems";
import type { LucideIcon } from "lucide-react";
import { useQueryAuthContext } from "@/contexts/QueryAuthContext";

// Icon mapping: convierte strings a componentes de Lucide React
const iconMap: Record<string, LucideIcon> = {
  MessageCircle,
  Clipboard,
  Building2,
  Network,
  User,
  Bot,
  BrainCircuit,
};

interface SidebarProps {
  isStreaming?: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Sidebar = ({
  isStreaming = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) => {
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = sessionStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    sessionStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  // Fetch menu items from backend
  const { menuItems, isLoading } = useMenuItems();

  // Transform backend data to navigation items format
  // Transform backend data to navigation items format
  // Filtrar items que tengan PATH y LABEL (ignorar info de usuario)
  const navigationItems = menuItems
    .filter((item) => item.PATH && item.LABEL)
    .map((item) => ({
      path: item.PATH,
      label: item.LABEL,
      icon: iconMap[item.ICON] || MessageCircle,
      order: item.NUM2,
    }));

  const isActive = (path: string) => location.pathname === path;

  // Show loading state while fetching menu items
  if (isLoading) {
    return (
      <aside
        className={cn(
          "bg-muted border-r border-border flex items-center justify-center",
          "fixed md:static inset-y-0 left-0 z-40",
          "w-60",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          isCollapsed ? "md:w-14" : "md:w-60",
        )}
      >
        <div className="text-sm text-muted-foreground">Cargando menú...</div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "bg-muted border-r border-border flex flex-col transition-all duration-300",
        "fixed md:static inset-y-0 left-0 z-40", // Mobile: fixed overlay; Desktop: static
        "w-60", // Fixed width for mobile and expanded desktop
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full", // Mobile slide in/out
        "md:translate-x-0", // Desktop always visible
        isCollapsed ? "md:w-14" : "md:w-60", // Desktop collapse
      )}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Collapse/Expand Button - Desktop only */}
        <div
          className={cn(
            "border-b border-border p-1.5 flex-shrink-0 transition-all duration-300 hidden md:flex",
            isCollapsed ? "justify-center" : "justify-end",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir" : "Contraer"}
          >
            <Menu className="h-3.5 w-3.5" />
          </Button>
        </div>

        <nav className="p-1.5 space-y-0.5 flex flex-col flex-shrink-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "transition-all duration-300 h-8 w-full justify-start gap-2 px-2",
                  isCollapsed && "md:justify-center md:px-1.5",
                )}
                onClick={() => handleNavigate(item.path)}
                disabled={isStreaming}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className={cn("text-xs", isCollapsed && "md:hidden")}>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="border-t border-border flex-shrink-0"></div>

        {/* Chat List - Only on /rag route */}
        {location.pathname === "/rag" && (
          <ChatListSidebar
            isStreaming={isStreaming}
            isCollapsed={isCollapsed}
          />
        )}
      </div>
      {/* === FOOTER DE CRÉDITOS === */}
      {actualCompanyArea?.EMPRESA === "Norma" && (
        <div
          className={cn(
            "px-4 py-3 border-t border-border/40 transition-all duration-300 flex-shrink-0 pb-4",
            // Se oculta en desktop si está colapsado
            isCollapsed ? "md:hidden" : "block",
          )}
        >
          <p className="text-xs text-foreground/60 font-normal leading-tight text-left">
            Aporte de Arq. Javier Zavaleta y Arq. Alejandro Oré
          </p>
        </div>
      )}
      {/* Mobile-only footer for user/company controls */}
      <div className="p-2 border-t md:hidden">
        <div className="space-y-2">
          <CompanyAreaDropdown isDisabled={isStreaming} />
          <UserDropdown />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
