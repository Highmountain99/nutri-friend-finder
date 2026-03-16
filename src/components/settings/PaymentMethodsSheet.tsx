import { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, Trash2, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface PaymentMethodsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  unknown: "Kort",
};

export function PaymentMethodsSheet({ open, onOpenChange }: PaymentMethodsSheetProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-payment-methods", {
        body: { action: "list" },
      });
      if (error) throw error;
      setMethods(data.payment_methods || []);
    } catch (err) {
      console.error("Failed to load payment methods:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadMethods();
  }, [open, loadMethods]);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-payment-methods", {
        body: { action: "add" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Kunde inte lägga till kort", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.functions.invoke("manage-payment-methods", {
        body: { action: "delete", payment_method_id: id },
      });
      if (error) throw error;
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Kort borttaget" });
    } catch (err) {
      toast({ title: "Kunde inte ta bort kortet", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Betalningsmetoder
          </SheetTitle>
          <SheetDescription>
            Hantera dina sparade kort för betalningar
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Inga kort sparade</p>
                <p className="text-xs text-muted-foreground">Lägg till ett kort för att betala för bokningar</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((method) => (
                <Card key={method.id} className="shadow-soft">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {BRAND_LABELS[method.brand] || method.brand} •••• {method.last4}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Utgår {String(method.exp_month).padStart(2, "0")}/{method.exp_year}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(method.id)}
                      disabled={deletingId === method.id}
                    >
                      {deletingId === method.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button className="w-full gap-2" onClick={handleAdd} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Lägg till kort
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
