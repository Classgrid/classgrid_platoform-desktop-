import { useState } from "react";
import { ChevronDown, PanelLeft } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import type { DashboardConfig } from "@/layouts/types";
import { useUiStore } from "@/lib/stores/uiStore";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { getLoginPathForPath, getRoleLabel, getPortalLabel, getRedirectPath } from "@/features/auth/auth-helpers";
import { apiClient } from "@/lib/apiClient";
import { Building2, Briefcase, User, Layers } from "lucide-react";

type DashboardSidebarProps = {
  config: DashboardConfig;
};
export function DashboardSidebar({ config }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const { data: user } = useCurrentUser();

  const BrandIcon = config.brandIcon;
  const SwitcherIcon = config.switcher?.current.icon;
  const menuItems = config.identity.menuItems ?? [];
  const userRoleLabel = user ? getRoleLabel(user.role) : null;
  const cardTitle = user ? user.name : (config.identity.cardTitle ?? config.identity.name);
  const cardSubtitle = user ? (user.email ?? userRoleLabel) : (config.identity.cardSubtitle ?? config.identity.email ?? config.identity.subtitle);
  const normalizedUserEmail = (user?.email ?? "").trim().toLowerCase();
  const visibleSections = config.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.restrictedToEmail) return true;
        return item.restrictedToEmail.trim().toLowerCase() === normalizedUserEmail;
      }),
    }))
    .filter((section) => section.items.length > 0);

  // Determine user's roles
  const userRoles = Array.from(new Set([user?.role, ...(user?.additional_roles || [])].filter(Boolean)));
  const hasMultipleRoles = userRoles.length > 1;
  const currentRole = config.role;
  const currentRoleLabel = getPortalLabel(currentRole);

  const handleLogout = async () => {
    setIsMenuOpen(false);

    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Still clear local client state if the server session is already gone.
    }

    try {
      window.localStorage.removeItem("classgrid:last-auth-role");
    } catch {
      // Ignore localStorage failures.
    }

    queryClient.removeQueries({ queryKey: ["current-user"] });
    navigate(getLoginPathForPath(location.pathname), { replace: true });
  };

  return (
    <aside className="">
      <div className="">
        <div className="">
          <div className={` ${isSidebarCollapsed ? '' : ''}`} onClick={() => isSidebarCollapsed && toggleSidebar()}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {BrandIcon ? (
                <span className="">
                  <BrandIcon size={16} />
                </span>
              ) : null}
              <div className="">
                <p className="">{config.logo}</p>
                {config.subtitle ? <p className="">{config.subtitle}</p> : null}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              className=""
              title="Toggle Sidebar"
            >
              <PanelLeft
                size={18}
                strokeWidth={1.5}
                style={{
                  transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 200ms ease'
                }}
              />
            </button>
          </div>
        </div>

        {hasMultipleRoles ? (
          <div className="">
            <button
              aria-expanded={isSwitcherOpen}
              className=" "
              onClick={() => {
                setIsMenuOpen(false);
                setIsSwitcherOpen((prev) => !prev);
              }}
              type="button"
            >
              <span className="">
                <span className=" ">
                  <Layers size={14} />
                </span>
                <span className="">
                  <strong>{currentRoleLabel}</strong>
                  <small>Switch Role / Portal</small>
                </span>
              </span>
              <ChevronDown className="" size={14} />
            </button>

            {isSwitcherOpen ? (
              <div className=" ">
                {userRoles.map((roleId) => {
                  const roleName = getPortalLabel(roleId);
                  const isActive = roleId === currentRole;
                  
                  return (
                    <button
                      key={roleId}
                      className={` ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        if (!isActive) {
                          navigate(getRedirectPath(roleId));
                        }
                      }}
                      type="button"
                    >
                      <Building2 size={14} />
                      <span style={{ fontWeight: isActive ? 600 : 400 }}>{roleName}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="">
          {visibleSections.map((section, sectionIndex) => (
            <section key={`${section.label}-${sectionIndex}`} className="">
              {section.label ? <p className="">{section.label}</p> : null}
              <div className="">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      className={({ isActive }) =>
                        `${isActive ? " " : ""}`
                      }
                      to={item.to}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              layoutId="active-sidebar-nav"
                              className=""
                              initial={false}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <div className="">
                            {ItemIcon ? <ItemIcon size={16} /> : null}
                            <span>{item.label}</span>
                            {item.badge ? <span className="">{item.badge}</span> : null}
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="">
        <button
          aria-expanded={isMenuOpen}
          className=""
          onClick={() => {
            setIsSwitcherOpen(false);
            setIsMenuOpen((prev) => !prev);
          }}
          type="button"
        >
          <span className="">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={cardTitle} className="" style={{ padding: 0, border: 'none', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span className="">{user?.name?.[0] ?? config.identity.name[0]}</span>
            )}
            <span className="">
              <strong>{cardTitle}</strong>
              <small>{cardSubtitle}</small>
            </span>
          </span>
          <ChevronDown className="" size={14} />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className=" shadow-xl border border-white/10"
              style={{ transformOrigin: "bottom center" }}
            >
              {menuItems.map((item) => {
                const ItemIcon = item.icon;

                if (item.to) {
                  return (
                    <div key={item.label}>
                      {item.dividerBefore ? <div className="" /> : null}
                      <NavLink onClick={() => setIsMenuOpen(false)} to={item.to} className="hover:bg-white/5 transition-colors rounded-md">
                        <ItemIcon size={14} />
                        <span>{item.label}</span>
                      </NavLink>
                    </div>
                  );
                }

                return (
                  <div key={item.label}>
                    {item.dividerBefore ? <div className="" /> : null}
                    <button onClick={() => {
                      if (item.label === "Log out") {
                        void handleLogout();
                        return;
                      }
                    }} type="button" className="hover:bg-red-500/10 hover:text-red-400 transition-colors rounded-md w-full">
                      <ItemIcon size={14} />
                      <span>{item.label}</span>
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
