import { useState } from "react";
import { useOrgUsage } from "../queries/useOrgAdminBilling";
import {
  Card,
  Metric,
  Text,
  Flex,
  Grid,
  BarChart,
  Select,
  SelectItem,
  Title,
  Subtitle,
  Divider,
} from "@tremor/react";
import { format, subMonths } from "date-fns";
import { Mail, MessageSquare, Database, Server, Sparkles, Video, Users, User, Briefcase } from "lucide-react";

export function UsagePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState("emails");

  const month = selectedDate.getMonth() + 1; // 1-12
  const year = selectedDate.getFullYear();

  const { data: usageData, isLoading, isError } = useOrgUsage(month, year);

  if (isLoading) {
    return (
      <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !usageData) {
    return (
      <div className="p-6 sm:p-10 max-w-7xl mx-auto">
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <Text className="text-red-800 dark:text-red-200">Failed to load usage data.</Text>
        </Card>
      </div>
    );
  }

  const { summary, dailySeries, studentBreakdown, facultyBreakdown, deptAdminBreakdown } = usageData;

  const metricOptions = [
    { value: "emails", label: "Emails Sent", color: "blue" },
    { value: "sms", label: "SMS Sent", color: "indigo" },
    { value: "activeStudents", label: "Active Students", color: "emerald" },
    { value: "liveMinutes", label: "Live Class Minutes", color: "violet" },
  ];

  const selectedMetricObj = metricOptions.find((m) => m.value === selectedMetric) || metricOptions[0];

  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: format(d, "MMMM yyyy"),
      date: d,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Usage Analytics</Title>
          <Text>Monitor your organization's resource consumption and active seats.</Text>
        </div>
        
        <div className="w-full sm:w-64">
          <Select
            value={`${year}-${month}`}
            onValueChange={(val) => {
              const opt = monthOptions.find((o) => o.value === val);
              if (opt) setSelectedDate(opt.date);
            }}
          >
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
        <Card decoration="top" decorationColor="blue">
          <Flex alignItems="start">
            <div>
              <Text>Emails Sent</Text>
              <Metric>{summary.emailsSent.thisMonth.toLocaleString()}</Metric>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">{summary.emailsSent.total.toLocaleString()} all-time</Text>
        </Card>

        <Card decoration="top" decorationColor="indigo">
          <Flex alignItems="start">
            <div>
              <Text>SMS Sent</Text>
              <Metric>{summary.smsSent.thisMonth.toLocaleString()}</Metric>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">{summary.smsSent.total.toLocaleString()} all-time</Text>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Flex alignItems="start">
            <div>
              <Text>Storage Used</Text>
              <Metric>{(summary.storageUsedGb ?? 0).toFixed(2)} GB</Metric>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">
            {summary.storageLimitGb ? `Limit: ${summary.storageLimitGb} GB` : "Pay-as-you-go"}
          </Text>
        </Card>

        <Card decoration="top" decorationColor="emerald">
          <Flex alignItems="start">
            <div>
              <Text>Active Students</Text>
              <Metric>{summary.students.active.toLocaleString()}</Metric>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">
            {summary.students.limit ? `Limit: ${summary.students.limit}` : "Unlimited"}
          </Text>
        </Card>

        <Card decoration="top" decorationColor="fuchsia">
          <Flex alignItems="start">
            <div>
              <Text>Active Faculty</Text>
              <Metric>{summary.faculty.active.toLocaleString()}</Metric>
            </div>
            <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg text-fuchsia-600 dark:text-fuchsia-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">
            {summary.faculty.limit ? `Limit: ${summary.faculty.limit}` : "Unlimited"}
          </Text>
        </Card>

        <Card decoration="top" decorationColor="violet">
          <Flex alignItems="start">
            <div>
              <Text>Live Class Minutes</Text>
              <Metric>{summary.liveClassMinutes.thisMonth.toLocaleString()}</Metric>
            </div>
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
              <Video className="w-5 h-5" />
            </div>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">This month</Text>
        </Card>
      </Grid>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <Title>Daily Usage Trends</Title>
            <Subtitle>Breakdown for {format(selectedDate, "MMMM yyyy")}</Subtitle>
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              {metricOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
        
        <BarChart
          className="h-80 mt-4"
          data={dailySeries}
          index="date"
          categories={[selectedMetric]}
          colors={[selectedMetricObj.color as any]}
          yAxisWidth={48}
          showAnimation={true}
          valueFormatter={(val) => val.toLocaleString()}
        />
      </Card>
      
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        <Card>
          <Title>Student Breakdown by Department</Title>
          <div className="mt-4 space-y-2">
            {studentBreakdown.byDepartment.map((dept, i) => (
              <Flex key={i} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <Text>{dept.name || "Unassigned"}</Text>
                <Text className="font-medium">{dept.count.toLocaleString()}</Text>
              </Flex>
            ))}
            {studentBreakdown.byDepartment.length === 0 && (
              <Text className="text-gray-500 italic">No department data available</Text>
            )}
          </div>
        </Card>
        
        <Card>
          <Title>Department Admin Roles</Title>
          <div className="mt-4 space-y-2">
            {deptAdminBreakdown.map((admin, i) => (
              <Flex key={i} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <Text className="capitalize">{admin.role?.replace(/_/g, ' ') || "Unknown"}</Text>
                <Text className="font-medium">{admin.count.toLocaleString()}</Text>
              </Flex>
            ))}
            {deptAdminBreakdown.length === 0 && (
              <Text className="text-gray-500 italic">No department admins found</Text>
            )}
          </div>
        </Card>
      </Grid>
    </div>
  );
}
