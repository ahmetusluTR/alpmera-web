import { useLocation, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Plus, Upload, Edit } from "lucide-react";
import { format } from "date-fns";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";

export default function AdminProducts() {
    const [, setLocation] = useLocation();

    const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<ProductRow>({
        endpoint: "/api/admin/products",
        initialPageSize: 25,
        initialStatus: "ALL",
        initialSort: "created_desc",
    });

    const STATUS_OPTIONS = [
        { value: "ALL", label: "All statuses" },
        { value: "ACTIVE", label: "Active" },
        { value: "ARCHIVED", label: "Archived" },
    ];

    const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
        ACTIVE: { label: "Active", variant: "default" },
        ARCHIVED: { label: "Archived", variant: "secondary" },
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage your product catalog</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/products/bulk">
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Bulk Upload
                        </Button>
                    </Link>
                    <Link href="/admin/products/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Product
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <ListToolbar
                            searchValue={controls.searchInput}
                            onSearchChange={controls.setSearchInput}
                            searchPlaceholder="Search products"
                            statusValue={controls.status}
                            onStatusChange={controls.setStatus}
                            statusOptions={STATUS_OPTIONS}
                            pageSize={controls.pageSize}
                            onPageSizeChange={controls.setPageSize}
                            onClearFilters={controls.resetFilters}
                        />
                    </div>
                    <div className="rounded-md border">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">SKU</TableHead>
                                    <TableHead className="w-[260px]">Name</TableHead>
                                    <TableHead className="w-[160px]">Brand</TableHead>
                                    <TableHead className="w-[160px]">Category</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[160px]">Created At</TableHead>
                                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <ListSkeleton rows={6} columns={7} />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {error && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="text-muted-foreground">Unable to load products.</div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading && !error && rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-4">
                                            <ListMismatchBanner total={total} />
                                            <ListEmptyState title="No products found" />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading && !error && rows.length > 0 && (
                                    rows.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            className="cursor-pointer"
                                            role="link"
                                            tabIndex={0}
                                            onClick={() => setLocation(`/admin/products/${product.id}`)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    setLocation(`/admin/products/${product.id}`);
                                                }
                                            }}
                                        >
                                            <TableCell className="font-mono text-xs truncate">{product.sku}</TableCell>
                                            <TableCell className="font-medium truncate">{product.name}</TableCell>
                                            <TableCell className="truncate">{product.brand || "-"}</TableCell>
                                            <TableCell className="truncate">{product.category || "-"}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={product.status} mapping={STATUS_BADGES} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(product.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {!isLoading && !error && rows.length > 0 && (
                        <div className="mt-4">
                            <ListPagination
                                page={page}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={controls.setPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}

interface ProductRow {
    id: string;
    sku: string;
    name: string;
    brand: string | null;
    category: string | null;
    status: string;
    createdAt: string;
}
