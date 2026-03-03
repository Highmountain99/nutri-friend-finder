import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { useDietitianSchedule } from "@/hooks/dietitian/useDietitianSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, TrendingUp, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

const concernLabels: Record<string, string> = {
  weight_loss: "Viktnedgång",
  diabetes: "Diabetes",
  gut_health: "Maghälsa",
  general_health: "Allmän hälsa",
  womens_health: "Kvinnohälsa",
  emotional_eating: "Emotionellt ätande",
  eating_disorder: "Ätstörning",
  heart_health: "Hjärthälsa",
};

const PIE_COLORS = [
  "hsl(150, 35%, 45%)",
  "hsl(15, 75%, 60%)",
  "hsl(35, 80%, 55%)",
  "hsl(200, 60%, 50%)",
  "hsl(280, 50%, 55%)",
  "hsl(0, 65%, 55%)",
  "hsl(45, 93%, 58%)",
  "hsl(170, 50%, 45%)",
];

export default function DietitianStatistics() {
  const { data: patients } = useAssignedPatients();
  const { appointments } = useDietitianSchedule();

  const totalPatients = patients?.length ?? 0;
  const completedAppointments = (appointments.data ?? []).filter((a) => a.status === "completed").length;
  const bookedAppointments = (appointments.data ?? []).filter((a) => a.status === "booked").length;

  // Focus area distribution
  const focusDistribution = (patients ?? []).reduce<Record<string, number>>((acc, p) => {
    const key = p.intake_profile?.primary_concern_category ?? "other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(focusDistribution).map(([key, value]) => ({
    name: concernLabels[key] ?? key,
    value,
  }));

  // Mock weekly data (since we don't have historical aggregation yet)
  const weeklyData = [
    { week: "V1", bookings: 12 },
    { week: "V2", bookings: 15 },
    { week: "V3", bookings: 10 },
    { week: "V4", bookings: 18 },
  ];

  const growthData = [
    { month: "Jan", patients: 2 },
    { month: "Feb", patients: 4 },
    { month: "Mar", patients: 6 },
    { month: "Apr", patients: totalPatients },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistik</h1>
        <p className="text-muted-foreground">Översikt av din verksamhet.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totala patienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPatients}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Genomförda besök</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{completedAppointments}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kommande bokningar</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{bookedAppointments}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktiva denna månad</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPatients}</div></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings per week */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Bokningar per vecka</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 25%, 88%)" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(150, 35%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Focus area distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Fördelning fokusområden</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Patient growth */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Patienttillväxt</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 25%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="hsl(150, 35%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
