import { useState, useRef, type ChangeEvent } from "react";
import { Link, useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, FileUp, AlertTriangle, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Helper to parse CSV
// Simple parser dealing with quoted fields
function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            let key = header.trim();
            // Basic normalization
            if (key === "SKU") key = "sku";
            if (key === "Name") key = "name";
            if (key === "Brand") key = "brand";
            if (key === "Model") key = "modelNumber";
            if (key === "Variant") key = "variant";
            if (key === "Category") key = "category";
            if (key === "Short Description") key = "shortDescription";
            if (key === "Specs") key = "specs";
            if (key === "Primary Image URL") key = "primaryImageUrl";
            if (key === "Gallery Image URLs") key = "galleryImageUrls";
            if (key === "Ref Price Amount") key = "referencePriceAmount";
            if (key === "Ref Price Source") key = "referencePriceSource";
            if (key === "Ref Price URL") key = "referencePriceUrl";
            if (key === "Ref Price Note") key = "referencePriceNote";

            row[key] = values[index] !== undefined ? values[index] : "";
        });
        rows.push(row);
    }
    return rows;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let start = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            result.push(cleanValue(line.substring(start, i)));
            start = i + 1;
        }
    }
    result.push(cleanValue(line.substring(start)));
    return result;
}

function cleanValue(val: string): string {
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
        val = val.replace(/""/g, '"');
    }
    return val;
}

export default function AdminProductBulk() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setUploadResult(null);

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                try {
                    const data = parseCSV(text);
                    setParsedData(data);
                } catch (err) {
                    toast({ title: "Error", description: "Failed to parse CSV file", variant: "destructive" });
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!parsedData.length) return;

        setIsUploading(true);
        try {
            const res = await apiRequest("POST", "/api/admin/products/bulk", { products: parsedData });
            const result = await res.json();
            setUploadResult(result);

            if (result.errors && result.errors.length === 0) {
                toast({ title: "Success", description: `Processed ${result.totalRows} rows successfully.` });
            } else {
                toast({ title: "Completed with issues", description: `Processed with ${result.errors.length} errors.`, variant: "default" });
            }
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            "SKU", "Name", "Brand", "Model", "Variant", "Category",
            "Short Description", "Specs", "Primary Image URL", "Gallery Image URLs",
            "Ref Price Amount", "Ref Price Source", "Ref Price URL", "Ref Price Note"
        ];
        const example = [
            "TEST-001", "Test Product", "BrandX", "M-100", "Red", "Electronics",
            "A great product", "Color:Red|Weight:5kg", "https://example.com/img.jpg", "https://example.com/1.jpg|https://example.com/2.jpg",
            "99.99", "MSRP", "https://brandx.com", "Official price"
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + example.map(v => `"${v.replace(/"/g, '""')}"`).join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "product_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                        <h1 className="text-2xl font-bold tracking-tight">Bulk Product Upload</h1>
                        <p className="text-muted-foreground text-sm">Upload products via CSV file</p>
                    </div>
                    <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload File</CardTitle>
                            <CardDescription>Select a CSV file to upload. Ensure headers match the template.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 items-center">
                                <Input
                                    type="file"
                                    accept=".csv"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="flex-1"
                                />
                                <Button onClick={handleUpload} disabled={!file || !parsedData.length || isUploading}>
                                    {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Data
                                </Button>
                            </div>

                            {parsedData.length > 0 && (
                                <div className="mt-4 p-4 bg-muted/30 rounded-md border">
                                    <p className="text-sm font-medium mb-2">Preview ({parsedData.length} records found)</p>
                                    <div className="overflow-auto max-h-60 rounded border bg-background">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>SKU</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Brand</TableHead>
                                                    <TableHead>Category</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {parsedData.slice(0, 5).map((row, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{row.sku}</TableCell>
                                                        <TableCell>{row.name}</TableCell>
                                                        <TableCell>{row.brand}</TableCell>
                                                        <TableCell>{row.category}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {parsedData.length > 5 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                            ... and {parsedData.length - 5} more
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {uploadResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {uploadResult.errors.length === 0 ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    )}
                                    Upload Results
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-muted p-4 rounded-md text-center">
                                        <div className="text-2xl font-bold">{uploadResult.created}</div>
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">Created</div>
                                    </div>
                                    <div className="bg-muted p-4 rounded-md text-center">
                                        <div className="text-2xl font-bold">{uploadResult.skipped}</div>
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">Skipped</div>
                                    </div>
                                    <div className="bg-muted p-4 rounded-md text-center">
                                        <div className="text-2xl font-bold">{uploadResult.totalRows}</div>
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">Total Rows</div>
                                    </div>
                                </div>

                                {uploadResult.errors.length > 0 && (
                                    <div className="border rounded-md">
                                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border-b text-sm font-medium text-red-600 dark:text-red-400">
                                            Errors ({uploadResult.errors.length})
                                        </div>
                                        <div className="max-h-60 overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-16">Row</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Error</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {uploadResult.errors.map((err: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{err.row}</TableCell>
                                                            <TableCell>{err.sku || "-"}</TableCell>
                                                            <TableCell className="text-destructive">{err.error}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
