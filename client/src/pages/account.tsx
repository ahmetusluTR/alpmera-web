import { useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { User, Package, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

// US States with USPS abbreviations (50 states + DC)
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const;

const US_STATE_CODES = US_STATES.map(s => s.value);

// Use the exact field names from the database schema
// State must be a valid USPS abbreviation, country is always "USA"
const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  defaultAddressLine1: z.string().min(1, "Address is required"),
  defaultAddressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required").refine(
    (val) => US_STATE_CODES.includes(val as typeof US_STATE_CODES[number]),
    { message: "Please select a valid US state" }
  ),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.literal("USA"),
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
  const searchString = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading, refetch: refetchAuth } = useAuth();

  // Parse returnTo from query string for redirect after profile save
  const returnTo = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("returnTo");
  }, [searchString]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const nextUrl = returnTo ? `/account?returnTo=${encodeURIComponent(returnTo)}` : "/account";
      setLocation(`/signin?next=${encodeURIComponent(nextUrl)}`);
    }
  }, [authLoading, isAuthenticated, setLocation, returnTo]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      defaultAddressLine1: "",
      defaultAddressLine2: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
    },
  });

  useEffect(() => {
    if (user?.profile) {
      // Normalize existing state values to uppercase for matching
      const existingState = user.profile.state?.toUpperCase() || "";
      const validState = US_STATE_CODES.includes(existingState as typeof US_STATE_CODES[number]) 
        ? existingState 
        : "";
      
      form.reset({
        fullName: user.profile.fullName || "",
        phone: user.profile.phone || "",
        defaultAddressLine1: user.profile.defaultAddressLine1 || "",
        defaultAddressLine2: user.profile.defaultAddressLine2 || "",
        city: user.profile.city || "",
        state: validState,
        zip: user.profile.zip || "",
        country: "USA",
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
    onSuccess: async () => {
      // Invalidate and refetch to ensure auth context gets updated profile
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      await refetchAuth();
      
      toast({
        title: "Profile saved",
        description: returnTo 
          ? "Returning to your commitment..." 
          : "Your delivery profile has been saved.",
      });
      
      // Redirect back to returnTo if present (e.g., commitment wizard)
      if (returnTo) {
        setLocation(returnTo);
      }
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
        {returnTo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(returnTo)}
            className="mb-4"
            data-testid="button-back-to-wizard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to commitment
          </Button>
        )}
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
                    name="defaultAddressLine1"
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
                    name="defaultAddressLine2"
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
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <FormLabel>ZIP code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <div 
                        className="flex items-center h-9 px-3 rounded-md border border-input bg-muted text-muted-foreground text-sm"
                        data-testid="text-country"
                      >
                        United States (USA)
                      </div>
                    </FormItem>
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
