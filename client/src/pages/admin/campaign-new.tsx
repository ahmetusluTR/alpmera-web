import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CampaignNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState("");

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/admin/campaigns", {
        title: name,
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      toast({ title: "Draft Created", description: "Campaign draft created. You can now edit the details." });
      if (result?.id) {
        setLocation(`/admin/campaigns/${result.id}`);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Create", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast({ title: "Validation Error", description: "Campaign name is required.", variant: "destructive" });
      return;
    }
    createMutation.mutate(campaignName.trim());
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/admin/campaigns">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-heading">Create Campaign</h1>
            <p className="text-sm text-muted-foreground">Start a new campaign draft</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Enter the campaign name to create a draft. You can edit all other details after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Spring Solar Panel Group"
                  autoFocus
                  data-testid="input-campaign-name"
                />
                <p className="text-xs text-muted-foreground">
                  This is the main title displayed to participants.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !campaignName.trim()}
                  data-testid="button-create-draft"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Draft
                </Button>
                <Link href="/admin/campaigns">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
