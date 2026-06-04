import { useState } from "react";
import { ChevronDown, PanelLeft } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import type { DashboardConfig } from "@/layouts/types";
import { useUiStore } from "@/lib/stores/uiStore";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { getLoginPathForPath, getRoleLabel } from "@/features/auth/auth-helpers";
import { apiClient } from "@/lib/apiClient";

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
  const cardTitle = user ? `${user.name} (${userRoleLabel})` : (config.identity.cardTitle ?? config.identity.name);
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
    <aside className="cg-sidebar">
      <div className="cg-sidebar__content">
        <div className="cg-sidebar__brand">
          <div className={`cg-sidebar__brand-mark ${isSidebarCollapsed ? 'cg-sidebar__brand-mark--collapsed' : ''}`} onClick={() => isSidebarCollapsed && toggleSidebar()}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {BrandIcon ? (
                <span className="cg-sidebar__brand-icon">
                  <BrandIcon size={16} />
                </span>
              ) : null}
              <div className="cg-sidebar__brand-text">
                <p className="cg-sidebar__logo">{config.logo}</p>
                {config.subtitle ? <p className="cg-sidebar__subtitle">{config.subtitle}</p> : null}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              className="cg-sidebar__collapse-btn"
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

        {config.switcher ? (
          <div className="cg-sidebar__switcher">
            <button
              aria-expanded={isSwitcherOpen}
              className="cg-user-card cg-user-card--switcher"
              onClick={() => {
                setIsMenuOpen(false);
                setIsSwitcherOpen((prev) => !prev);
              }}
              type="button"
            >
              <span className="cg-user-card__body">
                <span className="cg-user-card__avatar cg-user-card__avatar--icon">
                  {SwitcherIcon ? <SwitcherIcon size={14} /> : config.switcher.current.label[0]}
                </span>
                <span className="cg-user-card__meta">
                  <strong>{config.switcher.current.label}</strong>
                  <small>{config.switcher.current.id}</small>
                </span>
              </span>
              <ChevronDown className="cg-user-card__chevron" size={14} />
            </button>

            {config.switcher.subtext ? (
              <p className="cg-sidebar__switcher-hint">{config.switcher.subtext}</p>
            ) : null}

            {isSwitcherOpen ? (
              <div className="cg-user-menu cg-user-menu--top">
                {config.switcher.items.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <button
                      key={item.id}
                      className="cg-user-menu__button"
                      onClick={() => setIsSwitcherOpen(false)}
                      type="button"
                    >
                      {ItemIcon ? <ItemIcon size={14} /> : null}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="cg-sidebar__sections">
          {visibleSections.map((section, sectionIndex) => (
            <section key={`${section.label}-${sectionIndex}`} className="cg-sidebar__section">
              {section.label ? <p className="cg-sidebar__section-label">{section.label}</p> : null}
              <div className="cg-sidebar__section-items">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      className={({ isActive }) =>
                        `cg-sidebar__item${isActive ? " cg-sidebar__item--active" : ""}`
                      }
                      to={item.to}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              layoutId="active-sidebar-nav"
                              className="cg-sidebar__item-bg"
                              initial={false}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <div className="cg-sidebar__item-content">
                            {ItemIcon ? <ItemIcon size={16} /> : null}
                            <span>{item.label}</span>
                            {item.badge ? <span className="cg-sidebar__badge">{item.badge}</span> : null}
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

      <div className="cg-user-card-wrap">
        <button
          aria-expanded={isMenuOpen}
          className="cg-user-card"
          onClick={() => {
            setIsSwitcherOpen(false);
            setIsMenuOpen((prev) => !prev);
          }}
          type="button"
        >
          <span className="cg-user-card__body">
            <span className="cg-user-card__avatar">{user?.name?.[0] ?? config.identity.name[0]}</span>
            <span className="cg-user-card__meta">
              <strong>{cardTitle}</strong>
              <small>{cardSubtitle}</small>
            </span>
          </span>
          <ChevronDown className="cg-user-card__chevron" size={14} />
        </button>

        {isMenuOpen ? (
          <div className="cg-user-menu">
            {menuItems.map((item) => {
              const ItemIcon = item.icon;

              if (item.to) {
                return (
                  <div key={item.label}>
                    {item.dividerBefore ? <div className="cg-user-menu__divider" /> : null}
                    <NavLink onClick={() => setIsMenuOpen(false)} to={item.to}>
                      <ItemIcon size={14} />
                      <span>{item.label}</span>
                    </NavLink>
                  </div>
                );
              }

              return (
                <div key={item.label}>
                  {item.dividerBefore ? <div className="cg-user-menu__divider" /> : null}
                  <button onClick={() => {
                    if (item.label === "Log out") {
                      void handleLogout();
                      return;
                    }
                  }} type="button">
                    <ItemIcon size={14} />
                    <span>{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
