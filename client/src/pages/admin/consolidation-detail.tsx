import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Archive, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type ConsolidationPoint } from "@shared/schema";

export default function AdminConsolidationDetail() {
    const [, params] = useRoute("/admin/consolidation/:id");
    const [, setLocation] = useLocation();
    const isNew = params?.id === "new" || !params?.id;
    const pointId = params?.id !== "new" ? params?.id : null;
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("ACTIVE");

    const { data: point, isLoading: isLoadingPoint, refetch } = useQuery<ConsolidationPoint>({
        queryKey: [`/api/admin/consolidation-points/${pointId}`],
        enabled: !isNew && !!pointId,
    });

    useEffect(() => {
        if (point) {
            setName(point.name);
            setAddressLine1(point.addressLine1 || "");
            setAddressLine2(point.addressLine2 || "");
            setCity(point.city || "");
            setState(point.state || "");
            setPostalCode(point.postalCode || "");
            setCountry(point.country || "");
            setNotes(point.notes || "");
            setStatus(point.status);
        }
    }, [point]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const data = {
                name,
                addressLine1,
                addressLine2,
                city,
                state,
                postalCode,
                country,
                notes,
                status
            };

            // Clean up empty strings
            if (!data.addressLine1) delete (data as any).addressLine1;
            if (!data.addressLine2) delete (data as any).addressLine2;

            let res;
            if (isNew) {
                res = await apiRequest("POST", "/api/admin/consolidation-points", data);
            } else {
                res = await apiRequest("PATCH", `/api/admin/consolidation-points/${pointId}`, data);
            }
            return await res.json();
        },
        onSuccess: async (data: ConsolidationPoint) => {
            toast({
                title: isNew ? "Location Created" : "Location Updated",
                description: `Consolidation point ${data.name} has been saved successfully.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/consolidation-points"] });
            if (isNew) {
                setLocation(`/admin/consolidation/${data.id}`);
            } else {
                await queryClient.invalidateQueries({ queryKey: [`/api/admin/consolidation-points/${pointId}`] });
                await refetch();
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const archiveMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("DELETE", `/api/admin/consolidation-points/${pointId}`);
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "Location Archived", description: "The consolidation point has been archived." });
            queryClient.invalidateQueries({ queryKey: [`/api/admin/consolidation-points/${pointId}`] });
            setStatus("ARCHIVED");
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    if (isLoadingPoint) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <Link href="/admin/consolidation">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isNew ? "Create Consolidation Point" : `Edit Location: ${name}`}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {isNew ? "Add a new fulfillment hub" : "Manage location details"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isNew && status !== "ARCHIVED" && (
                            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => archiveMutation.mutate()}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                            </Button>
                        )}
                        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Save Location
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between">
                                    <CardTitle>Location Details</CardTitle>
                                    {!isNew && (
                                        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                                            {status}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Location Name *</Label>
                                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bellevue Consolidation Hub" />
                                </div>
                                <div className="space-y-4 pt-4">
                                    <h3 className="font-medium text-sm">Physical Address</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="addr1">Address Line 1</Label>
                                        <Input id="addr1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="Street address" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="addr2">Address Line 2</Label>
                                        <Input id="addr2" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} placeholder="Suite, unit, building, etc." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State / Province</Label>
                                            <Input id="state" value={state} onChange={e => setState(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="postal">Postal Code</Label>
                                            <Input id="postal" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" value={country} onChange={e => setCountry(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Notes</CardTitle>
                                <CardDescription>Operational details, pickup instructions, etc.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Enter access codes, gate instructions, or contact numbers specifically for this location..."
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={status} onValueChange={setStatus} disabled={isNew}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
