import { useParams, Link } from "react-router-dom";
import { usePatientJournal } from "@/hooks/dietitian/usePatientJournal";
import { useDietitianChat } from "@/hooks/dietitian/useDietitianChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState, useRef, useEffect } from "react";

export default function DietitianPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { meals, symptoms, healthTracking, goals, intakeProfile, isLoading } = usePatientJournal(id);
  const { messages, sendMessage } = useDietitianChat(id);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    sendMessage.mutate(chatInput.trim());
    setChatInput("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const concern = intakeProfile.data?.unified_concern_category || intakeProfile.data?.primary_concern_category;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/dietitian/patients">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Patient {id?.slice(0, 8)}</h1>
          {concern && <Badge variant="secondary" className="mt-1">{concern}</Badge>}
        </div>
      </div>

      {/* Nutrition goals */}
      {goals.data && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Näringsmål</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><p className="text-lg font-bold">{goals.data.calories_goal}</p><p className="text-xs text-muted-foreground">kcal</p></div>
              <div><p className="text-lg font-bold">{goals.data.protein_goal}g</p><p className="text-xs text-muted-foreground">Protein</p></div>
              <div><p className="text-lg font-bold">{goals.data.carbs_goal}g</p><p className="text-xs text-muted-foreground">Kolhydrater</p></div>
              <div><p className="text-lg font-bold">{goals.data.fat_goal}g</p><p className="text-xs text-muted-foreground">Fett</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="meals">
        <TabsList>
          <TabsTrigger value="meals">Måltider</TabsTrigger>
          <TabsTrigger value="symptoms">Symtom</TabsTrigger>
          <TabsTrigger value="health">Hälsovärden</TabsTrigger>
          <TabsTrigger value="chat">Chatt</TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-3 mt-4">
          {!meals.data?.length ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Inga måltider loggade ännu.</p>
          ) : (
            meals.data.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{m.meal_name || "Måltid"}</p>
                      <p className="text-xs text-muted-foreground">{m.meal_type} · {format(new Date(m.entry_date), "d MMM", { locale: sv })}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{m.calories} kcal</p>
                      <p>P {m.protein}g · K {m.carbs}g · F {m.fat}g</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-3 mt-4">
          {!symptoms.data?.length ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Inga symtom rapporterade.</p>
          ) : (
            symptoms.data.map((s) => (
              <Card key={s.id}>
                <CardContent className="py-3">
                  <p className="text-sm">{s.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(s.entry_date), "d MMM", { locale: sv })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-3 mt-4">
          {!healthTracking.data?.length ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Inga hälsovärden loggade.</p>
          ) : (
            healthTracking.data.map((h) => (
              <Card key={h.id}>
                <CardContent className="py-3 flex justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">{h.metric_type}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(h.entry_date), "d MMM", { locale: sv })}</p>
                  </div>
                  <p className="text-sm font-semibold">{h.value} {h.unit}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card className="h-[400px] flex flex-col">
            <CardContent className="flex-1 overflow-auto py-4 space-y-3">
              {messages.data?.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "dietitian" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    m.sender === "dietitian"
                      ? "bg-primary text-primary-foreground"
                      : m.sender === "ai"
                      ? "bg-muted text-muted-foreground italic"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </CardContent>
            <div className="p-3 border-t flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Skriv ett meddelande..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
