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
            if (key === "Name") key = "name";
            if (key === "Status") key = "status";
            if (key === "Contact Name") key = "contactName";
            if (key === "Contact Email") key = "contactEmail";
            if (key === "Phone") key = "phone";
            if (key === "Website") key = "website";
            if (key === "Notes") key = "notes";

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

export default function AdminSupplierBulk() {
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
                    toast({
                        title: "Error parsing CSV",
                        description: "Please check your CSV format and try again.",
                        variant: "destructive",
                    });
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            "Name", "Status", "Contact Name", "Contact Email", "Phone", "Website", "Notes"
        ];
        const example = [
            "ABC Manufacturing", "ACTIVE", "John Doe", "john@abc.com", "+1-555-0123", "https://abc.com", "Reliable supplier"
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + example.map(v => `"${v.replace(/"/g, '""')}"`).join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "supplier_upload_template.csv");
        document.body.appendChild(link);
        link.click();
    };

    const handleUpload = async () => {
        if (!parsedData.length) return;

        setIsUploading(true);
        try {
            const res = await apiRequest("POST", "/api/admin/suppliers/bulk", parsedData);
            const result = await res.json();
            setUploadResult(result);
            toast({
                title: "Bulk import completed",
                description: `Processed ${result.total} suppliers.`,
            });
        } catch (error: any) {
            toast({
                title: "Upload failed",
                description: error.message || "An error occurred during upload.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <Link href="/admin/suppliers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">Bulk Import Suppliers</h1>
                        <p className="text-muted-foreground text-sm">
                            Upload multiple suppliers at once using a CSV file
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload CSV File</CardTitle>
                        <CardDescription>
                            Select a CSV file to upload. Ensure headers match the template.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={downloadTemplate}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Template
                            </Button>
                            <div className="flex-1">
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="csv-file"
                                />
                                <label htmlFor="csv-file">
                                    <Button variant="outline" className="w-full" asChild>
                                        <span>
                                            <FileUp className="h-4 w-4 mr-2" />
                                            {file ? file.name : "Choose CSV File"}
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        </div>

                        {parsedData.length > 0 && (
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>CSV Parsed Successfully</AlertTitle>
                                <AlertDescription>
                                    Found {parsedData.length} supplier rows ready for upload.
                                </AlertDescription>
                            </Alert>
                        )}

                        {uploadResult && (
                            <Alert variant={uploadResult.errors > 0 ? "destructive" : "default"}>
                                {uploadResult.errors > 0 ? (
                                    <AlertTriangle className="h-4 w-4" />
                                ) : (
                                    <CheckCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>
                                    Upload {uploadResult.errors > 0 ? "Completed with Errors" : "Successful"}
                                </AlertTitle>
                                <AlertDescription>
                                    {uploadResult.successful} suppliers created successfully.
                                    {uploadResult.errors > 0 && ` ${uploadResult.errors} failed.`}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            onClick={handleUpload}
                            disabled={!parsedData.length || isUploading}
                            className="w-full"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Suppliers
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {parsedData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview ({parsedData.length} suppliers)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border max-h-96 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Contact Name</TableHead>
                                            <TableHead>Contact Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Website</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((row, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{row.name}</TableCell>
                                                <TableCell>{row.status}</TableCell>
                                                <TableCell>{row.contactName}</TableCell>
                                                <TableCell>{row.contactEmail}</TableCell>
                                                <TableCell>{row.phone}</TableCell>
                                                <TableCell>{row.website}</TableCell>
                                                <TableCell>{row.notes}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {uploadResult?.details && uploadResult.details.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border max-h-96 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Row</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Result</TableHead>
                                            <TableHead>Error</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {uploadResult.details.map((detail: any, index: number) => (
                                            <TableRow key={index}>
                                                <TableCell>{detail.row}</TableCell>
                                                <TableCell>{detail.name}</TableCell>
                                                <TableCell>{detail.status}</TableCell>
                                                <TableCell>
                                                    {detail.success ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-red-600">{detail.error}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}