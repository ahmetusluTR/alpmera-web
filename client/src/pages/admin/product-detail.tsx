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
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { ArrowLeft, Save, Trash2, Plus, Loader2, Image as ImageIcon, ExternalLink, Archive } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@shared/schema";

interface ProductSpec {
    key: string;
    value: string;
}

interface ReferencePrice {
    amount: number;
    currency: string;
    sourceType: "MSRP" | "RETAILER_LISTING" | "SUPPLIER_QUOTE" | "OTHER";
    sourceNameOrUrl?: string;
    capturedAt: string;
    capturedBy: string;
    note?: string;
}

export default function AdminProductDetail() {
    const [, params] = useRoute("/admin/products/:id");
    const [, setLocation] = useLocation();
    const isNew = params?.id === "new" || !params?.id;
    const productId = params?.id !== "new" ? params?.id : null;
    const { toast } = useToast();

    const [sku, setSku] = useState("");
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [modelNumber, setModelNumber] = useState("");
    const [variant, setVariant] = useState("");
    const [category, setCategory] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [specs, setSpecs] = useState<ProductSpec[]>([]);
    const [primaryImageUrl, setPrimaryImageUrl] = useState("");
    const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
    const [status, setStatus] = useState<string>("ACTIVE");
    const [internalNotes, setInternalNotes] = useState("");

    // Reference Prices
    const [referencePrices, setReferencePrices] = useState<ReferencePrice[]>([]);

    // New Reference Price Form
    const [newRefPriceAmount, setNewRefPriceAmount] = useState("");
    const [newRefPriceSource, setNewRefPriceSource] = useState<string>("RETAILER_LISTING");
    const [newRefPriceUrl, setNewRefPriceUrl] = useState("");
    const [newRefPriceNote, setNewRefPriceNote] = useState("");

    const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
        queryKey: [`/api/admin/products/${productId}`],
        enabled: !isNew && !!productId,
    });

    useEffect(() => {
        if (product) {
            setSku(product.sku);
            setName(product.name);
            setBrand(product.brand || "");
            setModelNumber(product.modelNumber || "");
            setVariant(product.variant || "");
            setCategory(product.category || "");
            setShortDescription(product.shortDescription || "");
            setPrimaryImageUrl(product.primaryImageUrl || "");
            setStatus(product.status || "ACTIVE");
            setInternalNotes(product.internalNotes || "");

            try {
                setSpecs(product.specs ? JSON.parse(product.specs) : []);
            } catch (e) { setSpecs([]); }

            try {
                setGalleryImageUrls(product.galleryImageUrls ? JSON.parse(product.galleryImageUrls) : []);
            } catch (e) { setGalleryImageUrls([]); }

            try {
                setReferencePrices(product.referencePrices ? JSON.parse(product.referencePrices) : []);
            } catch (e) { setReferencePrices([]); }
        }
    }, [product]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const data: any = {
                sku,
                name,
                brand,
                modelNumber,
                variant,
                category,
                shortDescription,
                specs: specs.length ? JSON.stringify(specs) : null,
                primaryImageUrl,
                galleryImageUrls: galleryImageUrls.length ? JSON.stringify(galleryImageUrls) : null,
                status,
                internalNotes,
                referencePrices: referencePrices.length ? JSON.stringify(referencePrices) : null
            };

            // If user filled in the "Add New" form, append it to the data
            if (newRefPriceAmount) {
                const newPrice = {
                    amount: parseFloat(newRefPriceAmount),
                    currency: "USD",
                    sourceType: newRefPriceSource,
                    sourceNameOrUrl: newRefPriceUrl,
                    note: newRefPriceNote,
                    capturedAt: new Date().toISOString(),
                    capturedBy: "admin"
                };

                if (isNew) {
                    // For new products, we just include it in the initial array
                    const currentPrices = [...referencePrices, newPrice];
                    data.referencePrices = JSON.stringify(currentPrices);
                } else {
                    // For existing products, we use the special newReferencePrice endpoint logic or just send the full array
                    // Since we updated the backend to support full override, we follow the override path
                    const currentPrices = [...referencePrices, newPrice];
                    data.referencePrices = JSON.stringify(currentPrices);
                }
            }

            let res;
            if (isNew) {
                res = await apiRequest("POST", "/api/admin/products", data);
            } else {
                res = await apiRequest("PATCH", `/api/admin/products/${productId}`, data);
            }
            return await res.json();
        },
        onSuccess: (data: Product) => {
            toast({
                title: isNew ? "Product Created" : "Product Updated",
                description: `${name} has been saved successfully.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
            if (isNew) {
                setLocation(`/admin/products/${data.id}`);
            } else {
                queryClient.invalidateQueries({ queryKey: [`/api/admin/products/${productId}`] });
                // Reset "Add New" form
                setNewRefPriceAmount("");
                setNewRefPriceSource("RETAILER_LISTING");
                setNewRefPriceUrl("");
                setNewRefPriceNote("");
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
            const res = await apiRequest("DELETE", `/api/admin/products/${productId}`);
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "Product Archived", description: "The product has been archived." });
            queryClient.invalidateQueries({ queryKey: [`/api/admin/products/${productId}`] });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const addSpec = () => {
        setSpecs([...specs, { key: "", value: "" }]);
    };

    const removeSpec = (index: number) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    const updateSpec = (index: number, field: "key" | "value", newValue: string) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = newValue;
        setSpecs(newSpecs);
    };

    const addGalleryImage = () => {
        setGalleryImageUrls([...galleryImageUrls, ""]);
    };

    const removeGalleryImage = (index: number) => {
        setGalleryImageUrls(galleryImageUrls.filter((_, i) => i !== index));
    };

    const updateGalleryImage = (index: number, newValue: string) => {
        const newUrls = [...galleryImageUrls];
        newUrls[index] = newValue;
        setGalleryImageUrls(newUrls);
    };

    if (isLoadingProduct) {
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
            <div className="max-w-5xl mx-auto space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isNew ? "Create Product" : `Edit Product: ${sku}`}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {isNew ? "Add a new product to the catalog" : "Manage product details and settings"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isNew && product?.status === "ACTIVE" && (
                            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => archiveMutation.mutate()}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                            </Button>
                        )}
                        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Save Product
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Product Identity */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between">
                                    <CardTitle>Identity</CardTitle>
                                    {!isNew && (
                                        <Badge variant={product?.status === "ACTIVE" ? "default" : "secondary"}>
                                            {product?.status}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku">SKU *</Label>
                                        <Input id="sku" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. A123-BLK" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Basics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Brand</Label>
                                        <Input id="brand" value={brand} onChange={e => setBrand(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Input id="category" value={category} onChange={e => setCategory(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="model">Model / MPN</Label>
                                        <Input id="model" value={modelNumber} onChange={e => setModelNumber(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="variant">Variant</Label>
                                        <Input id="variant" value={variant} onChange={e => setVariant(e.target.value)} placeholder="e.g. Midnight Black" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shortDesc">Short Description</Label>
                                    <Textarea id="shortDesc" value={shortDescription} onChange={e => setShortDescription(e.target.value)} rows={3} maxLength={500} />
                                    <p className="text-xs text-muted-foreground text-right">{shortDescription.length}/500</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Images</CardTitle>
                                <CardDescription>Enter URLs for product images</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Primary Image URL</Label>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 space-y-2">
                                            <Input value={primaryImageUrl} onChange={e => setPrimaryImageUrl(e.target.value)} placeholder="https://..." />
                                        </div>
                                        {primaryImageUrl && (
                                            <div className="w-20 h-20 border rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                <img src={primaryImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>Gallery Images</Label>
                                        <Button variant="outline" size="sm" onClick={addGalleryImage}><Plus className="h-3 w-3 mr-1" /> Add URL</Button>
                                    </div>
                                    <div className="space-y-2">
                                        {galleryImageUrls.map((url, idx) => (
                                            <div key={idx} className="flex gap-4 items-start">
                                                <div className="flex-1">
                                                    <Input value={url} onChange={e => updateGalleryImage(idx, e.target.value)} placeholder="https://..." />
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeGalleryImage(idx)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                {url && (
                                                    <div className="w-10 h-10 border rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                        <img src={url} alt="Gallery" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {galleryImageUrls.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic">No gallery images added.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Specifications */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Specifications</CardTitle>
                                <Button variant="outline" size="sm" onClick={addSpec}>
                                    <Plus className="h-4 w-4 mr-2" /> Match Spec
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {specs.map((spec, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <Input
                                                placeholder="Key (e.g. Weight)"
                                                value={spec.key}
                                                onChange={e => updateSpec(idx, "key", e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input
                                                placeholder="Value (e.g. 1.5 kg)"
                                                value={spec.value}
                                                onChange={e => updateSpec(idx, "value", e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeSpec(idx)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    ))}
                                    {specs.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">No specifications added.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Reference Prices */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Reference Price</CardTitle>
                                <CardDescription className="text-xs">Transparency Only. Captured from institutional sources.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!isNew && (
                                    <div className="space-y-3 p-3 bg-muted/50 rounded-md border">
                                        <p className="text-sm font-medium">Add New Reference Price</p>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Amount ($)</Label>
                                            <Input type="number" step="0.01" value={newRefPriceAmount} onChange={e => setNewRefPriceAmount(e.target.value)} placeholder="0.00" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Source Type</Label>
                                            <Select value={newRefPriceSource} onValueChange={setNewRefPriceSource}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MSRP">MSRP</SelectItem>
                                                    <SelectItem value="RETAILER_LISTING">Retailer Listing</SelectItem>
                                                    <SelectItem value="SUPPLIER_QUOTE">Supplier Quote</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Source URL / Name</Label>
                                            <Input value={newRefPriceUrl} onChange={e => setNewRefPriceUrl(e.target.value)} placeholder="https://..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Note</Label>
                                            <Input value={newRefPriceNote} onChange={e => setNewRefPriceNote(e.target.value)} placeholder="Optional note" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Click "Save Product" to commit this price.</p>
                                    </div>
                                )}

                                <Separator />

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">History (Editable)</h4>
                                    {referencePrices && referencePrices.length > 0 ? (
                                        <div className="space-y-4">
                                            {referencePrices.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()).map((price, idx) => (
                                                <div key={idx} className="p-3 border rounded-md space-y-2 relative">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 text-destructive"
                                                        onClick={() => {
                                                            const next = referencePrices.filter((_, i) => i !== idx);
                                                            setReferencePrices(next);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px]">Amount</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={price.amount}
                                                                onChange={(e) => {
                                                                    const next = [...referencePrices];
                                                                    next[idx] = { ...next[idx], amount: parseFloat(e.target.value) };
                                                                    setReferencePrices(next);
                                                                }}
                                                                className="h-7 text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px]">Source</Label>
                                                            <Select
                                                                value={price.sourceType}
                                                                onValueChange={(v) => {
                                                                    const next = [...referencePrices];
                                                                    next[idx] = { ...next[idx], sourceType: v as any };
                                                                    setReferencePrices(next);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="MSRP">MSRP</SelectItem>
                                                                    <SelectItem value="RETAILER_LISTING">Retailer</SelectItem>
                                                                    <SelectItem value="SUPPLIER_QUOTE">Supplier</SelectItem>
                                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">URL / Link</Label>
                                                        <Input
                                                            value={price.sourceNameOrUrl || ""}
                                                            onChange={(e) => {
                                                                const next = [...referencePrices];
                                                                next[idx] = { ...next[idx], sourceNameOrUrl: e.target.value };
                                                                setReferencePrices(next);
                                                            }}
                                                            className="h-7 text-xs"
                                                            placeholder="Source URL"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">No reference prices recorded.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Internal Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Notes</CardTitle>
                                <CardDescription>Admin only</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={internalNotes}
                                    onChange={e => setInternalNotes(e.target.value)}
                                    rows={6}
                                    placeholder="Private notes about this product..."
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
