import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { User, Package, Loader2 } from "lucide-react";
import { format } from "date-fns";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  zip: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Commitment {
  id: string;
  referenceNumber: string;
  userId: string | null;
  quantity: number;
  amount: string;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    state: string;
  };
}

function getCommitmentStatus(campaignState: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (campaignState) {
    case "AGGREGATION":
    case "SUCCESS":
    case "FULFILLMENT":
      return { label: "LOCKED", variant: "default" };
    case "FAILED":
      return { label: "REFUNDED", variant: "secondary" };
    case "RELEASED":
      return { label: "RELEASED", variant: "outline" };
    default:
      return { label: campaignState, variant: "secondary" };
  }
}

export default function Account() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/signin?next=/account");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  useEffect(() => {
    if (user?.profile) {
      form.reset({
        fullName: user.profile.fullName || "",
        phone: user.profile.phone || "",
        addressLine1: user.profile.addressLine1 || "",
        addressLine2: user.profile.addressLine2 || "",
        city: user.profile.city || "",
        state: user.profile.state || "",
        zip: user.profile.zip || "",
        country: user.profile.country || "",
      });
    }
  }, [user?.profile, form]);

  const { data: commitments, isLoading: commitmentsLoading } = useQuery<Commitment[]>({
    queryKey: ["/api/account/commitments"],
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", "/api/me/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Profile updated",
        description: "Your delivery profile has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mb-2" data-testid="text-account-heading">Account</h1>
        <p className="text-muted-foreground mb-8">{user?.email}</p>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Delivery Profile</CardTitle>
              </div>
              <CardDescription>
                Required for fulfillment of your commitments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-fullname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address line 1</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address line 2 (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save profile"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">My Commitments</CardTitle>
              </div>
              <CardDescription>
                Your campaign commitments and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commitmentsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : commitments && commitments.length > 0 ? (
                <div className="space-y-3">
                  {commitments.map((commitment) => {
                    const status = getCommitmentStatus(commitment.campaign.state);
                    return (
                      <div
                        key={commitment.id}
                        className="p-3 rounded-md border border-border"
                        data-testid={`commitment-item-${commitment.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-sm line-clamp-1">
                            {commitment.campaign.title}
                          </span>
                          <Badge variant={status.variant} className="shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-mono" data-testid={`text-reference-${commitment.id}`}>
                            {commitment.referenceNumber}
                          </span>
                          <span>Qty: {commitment.quantity}</span>
                          <span>{format(new Date(commitment.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No commitments yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
