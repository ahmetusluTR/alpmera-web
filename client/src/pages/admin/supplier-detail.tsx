import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
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
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Supplier } from "@shared/schema";

export default function AdminSupplierDetail() {
    const [, params] = useRoute("/admin/suppliers/:id");
    const [, setLocation] = useLocation();
    const isNew = params?.id === "new" || !params?.id;
    const supplierId = params?.id !== "new" ? params?.id : null;
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [region, setRegion] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("ACTIVE");

    const { data: supplier, isLoading: isLoadingSupplier, refetch } = useQuery<Supplier>({
        queryKey: [`/api/admin/suppliers/${supplierId}`],
        enabled: !isNew && !!supplierId,
    });

    useEffect(() => {
        if (supplier) {
            setName(supplier.name);
            setContactName(supplier.contactName || "");
            setContactEmail(supplier.contactEmail || "");
            setPhone(supplier.phone || "");
            setWebsite(supplier.website || "");
            setRegion(supplier.region || "");
            setNotes(supplier.notes || "");
            setStatus(supplier.status);
        }
    }, [supplier]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const data = {
                name,
                contactName,
                contactEmail,
                phone,
                website,
                region,
                notes,
                status // Allow status update for edits logic if needed, but schema usually defaults status via separate actions.
                // Actually my updateSupplierSchema is partial of insertSupplier which omits status default but I added status to type.
                // Let's rely on backend ignoring status if not in schema, OR include it if we want to allow reactivating.
                // Update schema allows partials.
            };

            let res;
            if (isNew) {
                res = await apiRequest("POST", "/api/admin/suppliers", data);
            } else {
                res = await apiRequest("PATCH", `/api/admin/suppliers/${supplierId}`, data);
            }
            return await res.json();
        },
        onSuccess: async (data: Supplier) => {
            toast({
                title: isNew ? "Supplier Created" : "Supplier Updated",
                description: `Supplier ${data.name} has been saved successfully.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
            if (isNew) {
                setLocation(`/admin/suppliers/${data.id}`);
            } else {
                await queryClient.invalidateQueries({ queryKey: [`/api/admin/suppliers/${supplierId}`] });
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
            const res = await apiRequest("DELETE", `/api/admin/suppliers/${supplierId}`);
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "Supplier Archived", description: "The supplier has been archived." });
            queryClient.invalidateQueries({ queryKey: [`/api/admin/suppliers/${supplierId}`] });
            setStatus("ARCHIVED");
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    if (isLoadingSupplier) {
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
                    <Link href="/admin/suppliers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isNew ? "Create Supplier" : `Edit Supplier: ${name}`}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {isNew ? "Add a new sourcing partner" : "Manage supplier details"}
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
                            Save Supplier
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between">
                                    <CardTitle>Company Information</CardTitle>
                                    {!isNew && (
                                        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                                            {status}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company Name *</Label>
                                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Official Business Name" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="region">Region</Label>
                                        <Input id="region" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. China - Shenzhen" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Person</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">Contact Name</Label>
                                    <Input id="contactName" value={contactName} onChange={e => setContactName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contact@supplier.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone / WhatsApp</Label>
                                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Notes</CardTitle>
                                <CardDescription>Private administrative notes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={6}
                                    placeholder="Bank details, lead times, communication preferences..."
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
                                {isNew && <p className="text-xs text-muted-foreground mt-2">New suppliers are created as Active by default.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
