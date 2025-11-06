import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Clipboard, Menu } from 'lucide-react';
import { Button } from '../shadcn/button';
import { cn } from '@/lib/utils';
import { ChatListSidebar } from './ChatListSidebar';

interface SidebarProps {
  isStreaming?: boolean;
}

const Sidebar = ({ isStreaming = false }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { path: '/rag', label: 'Chat', icon: MessageCircle },
    { path: '/upload', label: 'Documentos', icon: Clipboard },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={cn(
      "bg-muted/30 border-r border-border flex flex-col transition-all duration-300",
      isCollapsed ? "w-14" : "w-60"
    )}>
      {/* Collapse/Expand Button */}
      <div className="border-b border-border p-1.5 flex justify-center flex-shrink-0">
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
              variant={active ? 'default' : 'ghost'}
              className={cn(
                "transition-all duration-300 h-8",
                isCollapsed ? "w-full justify-center px-1.5" : "w-full justify-start gap-2 px-2"
              )}
              onClick={() => navigate(item.path)}
              disabled={isStreaming}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Separator */}
      <div className="border-t border-border flex-shrink-0"></div>

      {/* Chat List - Only on /rag route */}
      {location.pathname === '/rag' && (
        <ChatListSidebar isStreaming={isStreaming} isCollapsed={isCollapsed} />
      )}
    </aside>
  );
};

export default Sidebar;
