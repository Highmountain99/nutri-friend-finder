import { FileText, BookOpen, ExternalLink, Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { ChatAttachment } from "./ChatAttachmentPicker";

interface ChatAttachmentDisplayProps {
  attachments: ChatAttachment[];
}

function RecipeCard({ recipeId }: { recipeId: string }) {
  const { data: recipe } = useQuery({
    queryKey: ["recipe-mini", recipeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, image_url, time_minutes, calories_per_serving")
        .eq("id", recipeId)
        .single();
      return data;
    },
  });

  if (!recipe) return null;

  return (
    <div className="flex items-center gap-2 bg-background/80 rounded-lg p-2 border border-border/50 max-w-[220px]">
      {recipe.image_url ? (
        <img src={recipe.image_url} alt={recipe.title} className="h-10 w-10 rounded object-cover shrink-0" />
      ) : (
        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{recipe.title}</p>
        <div className="flex gap-2 text-[10px] text-muted-foreground">
          {recipe.time_minutes && <span>{recipe.time_minutes} min</span>}
          {recipe.calories_per_serving && <span>{recipe.calories_per_serving} kcal</span>}
        </div>
      </div>
    </div>
  );
}

export function ChatAttachmentDisplay({ attachments }: ChatAttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-1">
      {attachments.map((att, idx) => {
        if (att.type === "image") {
          return (
            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer">
              <img
                src={att.url}
                alt={att.name}
                className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            </a>
          );
        }

        if (att.type === "video") {
          return (
            <video
              key={idx}
              src={att.url}
              controls
              className="max-w-[240px] rounded-lg"
            />
          );
        }

        if (att.type === "recipe_suggestions_link") {
          const count = att.count ?? 1;
          return (
            <Link
              key={idx}
              to="/recipes"
              className="flex items-center gap-3 bg-primary/10 hover:bg-primary/15 transition-colors rounded-xl p-3 border border-primary/20 max-w-[260px] group"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Föreslagna recept</p>
                <p className="text-[11px] text-muted-foreground">
                  {count} {count === 1 ? "nytt recept" : "nya recept"} att utforska
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
          );
        }

        if (att.type === "recipe_link" && att.recipeId) {
          return <RecipeCard key={idx} recipeId={att.recipeId} />;
        }

        // Document fallback
        return (
          <a
            key={idx}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-background/80 rounded-lg p-2 border border-border/50 max-w-[220px] hover:bg-muted transition-colors"
          >
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs truncate flex-1">{att.name}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
