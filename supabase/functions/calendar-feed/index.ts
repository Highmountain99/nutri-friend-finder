import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeIcal(text: string): string {
  return text.replace(/[\\;,\n]/g, (match) => {
    if (match === "\n") return "\\n";
    return `\\${match}`;
  });
}

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 401 });
    }

    // Validate token format — must be a 64-char hex string (not a UUID)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return new Response("Invalid token", { status: 403 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up dietitian by their secure calendar token
    const { data: profile, error: profileError } = await supabase
      .from("dietitian_profiles")
      .select("id, first_name, last_name, user_id")
      .eq("calendar_token", token)
      .single();

    if (profileError || !profile) {
      return new Response("Invalid token", { status: 403 });
    }

    // Fetch appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("*, profiles!appointments_user_id_fkey(first_name, last_name)")
      .eq("dietitian_id", profile.id)
      .eq("status", "booked")
      .gte("appointment_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("appointment_date", { ascending: true });

    // Fetch availability
    const { data: avail } = await supabase
      .from("dietitian_availability")
      .select("*")
      .eq("dietitian_id", profile.id)
      .gte("available_date", new Date().toISOString().split("T")[0])
      .order("available_date", { ascending: true });

    // Build iCal
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GutFeeling//Dietist Kalender//SV",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:Gut Feeling – ${profile.first_name} ${profile.last_name}`,
      "X-WR-TIMEZONE:Europe/Stockholm",
    ];

    // Add appointments as events
    for (const appt of appointments ?? []) {
      const start = new Date(appt.appointment_date);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      let patientName = "Patient";
      const profileData = (appt as any).profiles;
      if (profileData && profileData.first_name) {
        patientName = `${profileData.first_name} ${profileData.last_name}`;
      }

      const typeLabel = appt.appointment_type === "initial" ? "Nybesök" : "Uppföljning";

      lines.push(
        "BEGIN:VEVENT",
        `UID:appt-${appt.id}@gutfeeling.se`,
        `DTSTART:${formatIcalDate(start)}`,
        `DTEND:${formatIcalDate(end)}`,
        `SUMMARY:${escapeIcal(`${typeLabel} – ${patientName}`)}`,
        `DESCRIPTION:${escapeIcal(`Bokningstyp: ${typeLabel}`)}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }

    // Add availability blocks
    for (const a of avail ?? []) {
      const slots = (a.time_slots as string[]) ?? [];
      if (slots.length === 0) continue;

      const sorted = [...slots].sort();
      let blockStart = sorted[0];
      let prevSlot = sorted[0];

      for (let i = 1; i <= sorted.length; i++) {
        const current = sorted[i];
        const isConsecutive = current && (() => {
          const [ph, pm] = prevSlot.split(":").map(Number);
          const [ch, cm] = current.split(":").map(Number);
          const prevMin = ph * 60 + pm;
          const currMin = ch * 60 + cm;
          return currMin - prevMin === 30;
        })();

        if (!isConsecutive) {
          const startDate = new Date(`${a.available_date}T${blockStart}:00`);
          const endDate = new Date(`${a.available_date}T${prevSlot}:00`);
          endDate.setMinutes(endDate.getMinutes() + 30);

          lines.push(
            "BEGIN:VEVENT",
            `UID:avail-${a.id}-${blockStart}@eatsuite.se`,
            `DTSTART:${formatIcalDate(startDate)}`,
            `DTEND:${formatIcalDate(endDate)}`,
            `SUMMARY:${escapeIcal("Ledig tid – EatSuite")}`,
            "STATUS:TENTATIVE",
            "TRANSP:TRANSPARENT",
            "END:VEVENT"
          );
          blockStart = current;
        }
        prevSlot = current;
      }
    }

    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="eatsuite-kalender.ics"`,
      },
    });
  } catch (error) {
    console.error("Calendar feed error:", error);
    return new Response("Internal error", { status: 500 });
  }
});
