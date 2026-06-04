import type { ReactNode } from "react";
import { Search } from "lucide-react";

type CgFilterToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * CgFilterToolbar — Search input + filter dropdowns + actions.
 *
 * Usage:
 *   <CgFilterToolbar
 *     searchValue={search}
 *     onSearchChange={setSearch}
 *     filters={<CgSelect ... />}
 *     actions={<button>Add New</button>}
 *   />
 */
export function CgFilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
  className = "",
}: CgFilterToolbarProps) {
  return (
    <div className={`cg-toolbar ${className}`.trim()}>
      <div className="cg-toolbar__left">
        {onSearchChange && (
          <div className="cg-toolbar__search">
            <Search size={14} className="cg-toolbar__search-icon" />
            <input
              type="text"
              className="cg-toolbar__search-input"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        {filters && <div className="cg-toolbar__filters">{filters}</div>}
      </div>
      {actions && <div className="cg-toolbar__right">{actions}</div>}
    </div>
  );
}
