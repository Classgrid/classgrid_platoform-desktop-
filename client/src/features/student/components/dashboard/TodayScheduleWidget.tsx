import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { TimetableSlot } from "../../queries/useStudentDashboard";
import { Clock, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/marketing_ui/badge";

export function TodayScheduleWidget({ schedule, day }: { schedule?: TimetableSlot[], day?: string }) {
  if (!schedule) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Today's Schedule</span>
          <Badge variant="outline" className="font-normal text-xs uppercase tracking-wider">
            {day || "Today"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {schedule.length === 0 
            ? "No classes scheduled for today." 
            : `You have ${schedule.length} classes today.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2 max-h-[400px]">
        {schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground opacity-70">
            <Sparkles className="w-12 h-12 mb-4 text-primary/40" />
            <p>Enjoy your free day!</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {schedule.map((slot, i) => (
              <div key={slot.id || slot._id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                
                {/* Card content */}
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border bg-card shadow-sm group-hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-primary flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </span>
                    {slot.is_extra && (
                      <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
                        Extra
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-bold text-base mb-1">{slot.subject}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="font-medium">{slot.teacher_name}</span>
                    {slot.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {slot.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
