import React, { useState } from "react";
import { 
  User as UserIcon, Phone, Users, GraduationCap, Landmark, 
  FileUp, Briefcase, Trophy, Activity, Globe, CreditCard, 
  HeartPulse, Sparkles, ShieldCheck, School, Clock, Wallet, UploadCloud, CalendarIcon
} from "lucide-react";
import { getResolvedProfileStrategy } from "../lib/profile-strategy-selector";
import { ScrollArea } from "@/components/marketing_ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { Button } from "@/components/marketing_ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import indiaLocations from "@/data/india-locations.json";
import { Spinner } from "@/components/marketing_ui/spinner";
import { toast } from "sonner";

// ── SUB-COMPONENT FOR DATE FIELD TO HANDLE LOCAL STATE ──
function DateField({ field, value, onChange, disabled }: { field: any, value: string, onChange: (val: string) => void, disabled?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined);

  return (
    <Popover open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "h-11 w-full rounded-lg px-3 text-left font-normal outline-none transition-all flex items-center gap-2",
            disabled ? "bg-muted/30 border border-input text-foreground cursor-not-allowed opacity-70" : "border border-input bg-background focus:border-primary",
            !value && !disabled ? "text-muted-foreground" : ""
          )}
          onClick={(e) => { 
            if (disabled) { e.preventDefault(); return; }
            setTempDate(value ? new Date(value) : undefined); 
            setIsOpen(true); 
          }}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? format(new Date(value), "PPP") : (disabled ? "Not specified" : "Select date")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 shadow-2xl rounded-xl border border-border animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95" align="start">
        <Calendar
          mode="single"
          selected={tempDate}
          onSelect={setTempDate}
          initialFocus
          fixedWeeks
          className="p-0 border-none"
        />
        <div className="p-2 border-t border-border mt-1">
          <button
            type="button"
            onClick={() => { 
              if (tempDate) onChange(tempDate.toISOString()); 
              setIsOpen(false); 
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-transparent text-foreground hover:bg-muted rounded-md transition-all border border-transparent hover:border-border hover:scale-[0.98]"
          >
            Apply <span className="opacity-50 text-[10px]">↵</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Map string icon names from strategy to actual Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  User: UserIcon,
  Phone: Phone,
  Users: Users,
  GraduationCap: GraduationCap,
  Landmark: Landmark,
  FileUp: FileUp,
  Briefcase: Briefcase,
  Trophy: Trophy,
  Activity: Activity,
  Globe: Globe,
  CreditCard: CreditCard,
  HeartPulse: HeartPulse,
  Sparkles: Sparkles,
  ShieldCheck: ShieldCheck,
  School: School,
  Clock: Clock,
  Wallet: Wallet,
};

interface ContextualProfileProps {
  targetRole: string;
  viewerRole: string;
  orgType: string;
  structureType: string;
  isSelfView: boolean;
  profileData?: any;
}

export function ContextualProfile({
  targetRole,
  viewerRole,
  orgType,
  structureType,
  isSelfView,
  profileData,
}: ContextualProfileProps) {
  // 1. Get the resolved strategy from our data engine
  const strategy = getResolvedProfileStrategy({
    targetRole,
    viewerRole,
    orgType,
    structureType,
    isSelfView,
  });

  const [activeSection, setActiveSection] = useState(strategy.sections[0]?.key || "");
  
  // Initialize from actual profile data, flattening root props and metadata
  const [formData, setFormData] = useState<Record<string, any>>({
    ...(profileData || {}),
    ...(profileData?.metadata || {})
  });

  // Sync form data if profileData arrives asynchronously
  React.useEffect(() => {
    if (profileData) {
      setFormData(prev => ({
        ...prev,
        ...profileData,
        ...(profileData.metadata || {})
      }));
    }
  }, [profileData]);
  // Loading & Edit States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, you might want to use react-query useMutation
      // but for direct API calls we can use apiClient here
      const { apiClient } = await import("@/lib/apiClient");
      await apiClient.put("/api/user/update", { ...formData, metadata: formData });
      
      // Update global context/cache if needed here or rely on the parent page
      toast.success("Profile details updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile details");
    } finally {
      setIsSaving(true);
      // Let it spin a tiny bit more for UX, then disable
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  // 2. Render Vertical Stepper (Sidebar)
  const renderSidebar = () => {
    return (
      <div className="w-64 border-r bg-background/50 flex flex-col h-full relative">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Profile Sections
            </h3>
            
            <div className="relative border-l-2 border-muted ml-4 space-y-8">
              {strategy.sections.map((section, index) => {
                const Icon = ICON_MAP[section.icon] || UserIcon;
                const isActive = activeSection === section.key;

                return (
                  <div key={section.key} className="relative">
                    {/* Stepper Circle */}
                    <div 
                      className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                        isActive 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-muted bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                      onClick={() => { setActiveSection(section.key); setIsEditing(false); }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Stepper Label */}
                    <div 
                      className={`ml-8 cursor-pointer py-1.5 transition-colors ${
                        isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => { setActiveSection(section.key); setIsEditing(false); }}
                    >
                      {section.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  // 3. Render Form / Content Area
  const renderContent = () => {
    const section = strategy.sections.find(s => s.key === activeSection);
    if (!section) return null;

    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {React.createElement(ICON_MAP[section.icon] || UserIcon, { className: "w-6 h-6 text-primary" })}
              {section.label}
            </h2>
            
            {/* Edit / Save Toggle */}
            {strategy.permissions.can_edit && (
              isEditing ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="w-4 h-4" />
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Details
                </Button>
              )
            )}
          </div>

          {/* Anti-Ragging Special Banner */}
          {section.key === "anti_ragging" && (
            <div className="mb-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-[15px] text-blue-600 dark:text-blue-400">Anti-Ragging Undertaking Form</h4>
                <p className="text-sm text-muted-foreground mt-1">Click the link to fill the Anti Ragging Undertaking form on the official website, then paste your Undertaking Number below.</p>
              </div>
              <a href="https://www.antiragging.in/" target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Button variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:text-blue-700">
                  Open antiragging.in <span className="ml-2">↗</span>
                </Button>
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.fields.map(field => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </label>
                
                {/* Form Input Renderer */}
                {(() => {
                  // India Locations Cascading Logic
                  if (field.key === "permanent_state" || field.key === "current_state") {
                    const states = Object.keys(indiaLocations.states);
                    return (
                      <>
                      <Select 
                        value={formData[field.key] || ""} 
                        onValueChange={(val) => handleInputChange(field.key, val)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={cn("w-full transition-all", isEditing ? "bg-background border-input" : "bg-muted/30 border-input text-foreground cursor-not-allowed opacity-70")}>
                          <SelectValue placeholder="Select State..." />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                          <SelectItem value="Other (Please specify)">Other (Please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData[field.key] === "Other (Please specify)" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                          <input 
                            type="text" 
                            placeholder={isEditing ? `ENTER YOUR ${field.label.toUpperCase()}` : ""}
                            className={cn("w-full p-2.5 rounded-md text-sm outline-none transition-all", isEditing ? "border border-input bg-background focus:ring-2 focus:ring-primary/50" : "border border-input bg-muted/30 text-foreground cursor-not-allowed opacity-70")}
                            value={formData[field.key + "_other"] || ""}
                            onChange={(e) => isEditing && handleInputChange(field.key + "_other", e.target.value)}
                            readOnly={!isEditing}
                          />
                        </div>
                      )}
                    </>
                  );
                }
                  if (field.key === "permanent_district" || field.key === "current_district") {
                    const stateKey = field.key === "permanent_district" ? "permanent_state" : "current_state";
                    const selectedState = formData[stateKey];
                    // @ts-ignore
                    const districts = selectedState ? Object.keys(indiaLocations.states[selectedState] || {}) : [];
                    return (
                      <>
                        <Select 
                        value={formData[field.key] || ""} 
                        onValueChange={(val) => handleInputChange(field.key, val)}
                        disabled={!selectedState || !isEditing}
                      >
                        <SelectTrigger className={cn("w-full transition-all", isEditing ? "bg-background border-input" : "bg-muted/30 border-input text-foreground cursor-not-allowed opacity-70")}>
                          <SelectValue placeholder="Select District..." />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          <SelectItem value="Other (Please specify)">Other (Please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData[field.key] === "Other (Please specify)" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                          <input 
                            type="text" 
                            placeholder={isEditing ? `ENTER YOUR ${field.label.toUpperCase()}` : ""}
                            className={cn("w-full p-2.5 rounded-md text-sm outline-none transition-all", isEditing ? "border border-input bg-background focus:ring-2 focus:ring-primary/50" : "border border-input bg-muted/30 text-foreground cursor-not-allowed opacity-70")}
                            value={formData[field.key + "_other"] || ""}
                            onChange={(e) => isEditing && handleInputChange(field.key + "_other", e.target.value)}
                            readOnly={!isEditing}
                          />
                        </div>
                      )}
                    </>
                  );
                }

                if (field.type === "dropdown") {
                  return (
                    <>
                      <Select 
                        value={formData[field.key] || ""} 
                        onValueChange={(val) => handleInputChange(field.key, val)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={cn("w-full transition-all", isEditing ? "bg-background border-input" : "bg-muted/30 border-input text-foreground cursor-not-allowed opacity-70")}>
                          <SelectValue placeholder={`Select ${field.label}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt: string) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                          <SelectItem value="Other (Please specify)">Other (Please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData[field.key] === "Other (Please specify)" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                          <input 
                            type="text" 
                            placeholder={isEditing ? `ENTER YOUR ${field.label.toUpperCase()}` : ""}
                            className={cn("w-full p-2.5 rounded-md text-sm outline-none transition-all", isEditing ? "border border-input bg-background focus:ring-2 focus:ring-primary/50" : "border border-input bg-muted/30 text-foreground cursor-not-allowed opacity-70")}
                            value={formData[field.key + "_other"] || ""}
                            onChange={(e) => isEditing && handleInputChange(field.key + "_other", e.target.value)}
                            readOnly={!isEditing}
                          />
                        </div>
                      )}
                    </>
                  );
                }
                  
                  if (field.type === "date") {
                    return (
                      <DateField 
                        field={field} 
                        value={formData[field.key] || ""} 
                        onChange={(val) => handleInputChange(field.key, val)}
                        disabled={!isEditing}
                      />
                    );
                  }
                  
                  if (field.type === "boolean") {
                    return (
                      <div className={cn("flex items-center gap-4 mt-2 transition-all", !isEditing && "opacity-70 cursor-not-allowed pointer-events-none")}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name={field.key} value="yes" className="accent-primary w-4 h-4" disabled={!isEditing} /> Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name={field.key} value="no" className="accent-primary w-4 h-4" defaultChecked disabled={!isEditing} /> No
                        </label>
                      </div>
                    );
                  }
                  
                  if (field.type === "file_list" || field.type === "image") {
                    return (
                      <div className={cn("w-full p-4 border-2 border-dashed rounded-md bg-muted/20 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 transition-colors", isEditing ? "cursor-pointer hover:bg-muted/50 hover:border-primary/50" : "opacity-70 cursor-not-allowed pointer-events-none bg-muted/30 border-input")}>
                        <UploadCloud className="w-6 h-6 text-primary/70" />
                        <span className="font-medium text-foreground">{isEditing ? `Upload ${field.label}` : 'No file uploaded'}</span>
                        {isEditing && <span className="text-xs">PDF, JPG, PNG up to 5MB</span>}
                      </div>
                    );
                  }
                  
                  return (
                    <input 
                      type={field.type === "number" ? "number" : "text"}
                      placeholder={isEditing ? `Enter ${field.label}...` : ""}
                      className={cn(
                        "w-full p-2.5 rounded-md text-sm outline-none transition-all",
                        isEditing 
                          ? "border border-input bg-background focus:ring-2 focus:ring-primary/50" 
                          : "border border-input bg-muted/30 text-foreground cursor-not-allowed opacity-70"
                      )}
                      value={formData[field.key] || ""}
                      onChange={(e) => isEditing && handleInputChange(field.key, e.target.value)}
                      readOnly={!isEditing}
                    />
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[600px] border rounded-xl overflow-hidden shadow-sm bg-card">
      {renderSidebar()}
      {renderContent()}
    </div>
  );
}
