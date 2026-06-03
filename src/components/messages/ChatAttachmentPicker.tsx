import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Image, FileText, Video, BookOpen, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RecipeLinkPicker } from "./RecipeLinkPicker";
import { toast } from "@/hooks/use-toast";

export interface ChatAttachment {
  type: "image" | "video" | "document" | "recipe_link" | "recipe_suggestions_link";
  url: string;
  name: string;
  mimeType?: string;
  recipeId?: string;
  count?: number;
}

interface ChatAttachmentPickerProps {
  /** The user_id folder to upload into */
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttach: (attachment: ChatAttachment) => void;
}

export function ChatAttachmentPicker({ patientId, open, onOpenChange, onAttach }: ChatAttachmentPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, type: ChatAttachment["type"]) => {
    setUploading(true);
    try {
      const filePath = `${patientId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("chat-attachments").upload(filePath, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);
      // Since bucket is private, we need signed URL
      const { data: signedData } = await supabase.storage.from("chat-attachments").createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      onAttach({
        type,
        url: signedData?.signedUrl || urlData.publicUrl,
        name: file.name,
        mimeType: file.type,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Kunde inte ladda upp filen",
        description: err?.message || "Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (type: ChatAttachment["type"]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, type);
    e.target.value = "";
  };

  if (showRecipePicker) {
    return (
      <RecipeLinkPicker
        open={open}
        onOpenChange={(v) => {
          if (!v) setShowRecipePicker(false);
          onOpenChange(v);
        }}
        onSelect={(recipe) => {
          onAttach({
            type: "recipe_link",
            url: `/recipes`, // in-app link
            name: recipe.title,
            recipeId: recipe.id,
          });
          setShowRecipePicker(false);
          onOpenChange(false);
        }}
      />
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[50vh]">
        <SheetHeader>
          <SheetTitle>Bifoga</SheetTitle>
        </SheetHeader>
        {uploading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Laddar upp...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-4">
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Bild</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Video</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => docInputRef.current?.click()}
            >
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Dokument</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => setShowRecipePicker(true)}
            >
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Recept</span>
            </button>
          </div>
        )}
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange("image")} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange("video")} />
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.xls" className="hidden" onChange={handleFileChange("document")} />
      </SheetContent>
    </Sheet>
  );
}

/** Small preview chip shown below the input before sending */
export function AttachmentPreview({ attachment, onRemove }: { attachment: ChatAttachment; onRemove: () => void }) {
  const iconMap = {
    image: Image,
    video: Video,
    document: FileText,
    recipe_link: BookOpen,
  };
  const Icon = iconMap[attachment.type];

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs max-w-[200px]">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="truncate">{attachment.name}</span>
      <button onClick={onRemove} className="shrink-0 hover:text-destructive">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
