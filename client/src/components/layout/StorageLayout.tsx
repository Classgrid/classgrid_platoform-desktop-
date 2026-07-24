import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Database, FileBarChart, HardDrive, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StorageLayout() {
  const navItems = [
    { name: 'Files', path: '/superadmin/storage/files', icon: HardDrive },
    { name: 'Analytics', path: '/superadmin/storage/analytics', icon: FileBarChart },
    { name: 'S3 Configuration', path: '/superadmin/storage/s3', icon: Settings },
  ];

  return (
    <div className="flex w-full h-[calc(100vh-64px)]">
      {/* Secondary Sidebar (The Middle Pane) */}
      <aside className="w-64 border-r border-border bg-background p-4 flex flex-col hidden md:flex">
        <div className="mb-6 px-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Storage
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Manage AWS S3 Bucket Files & Assets</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area (The Right Pane) */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-background/50">
        <Outlet />
      </main>
    </div>
  );
}
