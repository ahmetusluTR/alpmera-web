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
import { Plus, Edit, Upload } from "lucide-react";
import { format } from "date-fns";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";

export default function AdminSuppliers() {
    const [, setLocation] = useLocation();

    const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<SupplierRow>({
        endpoint: "/api/admin/suppliers",
        initialPageSize: 25,
        initialStatus: "ALL",
        initialSort: "created_desc",
    });

    const STATUS_OPTIONS = [
        { value: "ALL", label: "All statuses" },
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "ARCHIVED", label: "Archived" },
    ];

    const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
        ACTIVE: { label: "Active", variant: "default" },
        INACTIVE: { label: "Inactive", variant: "secondary" },
        ARCHIVED: { label: "Archived", variant: "outline" },
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">Manage your sourcing partners</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/suppliers/bulk">
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Bulk Import
                        </Button>
                    </Link>
                    <Link href="/admin/suppliers/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Supplier
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <ListToolbar
                            searchValue={controls.searchInput}
                            onSearchChange={controls.setSearchInput}
                            searchPlaceholder="Search suppliers"
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
                                    <TableHead className="w-[25%]">Supplier Name</TableHead>
                                    <TableHead className="w-[20%]">Contact</TableHead>
                                    <TableHead className="w-[15%]">Region</TableHead>
                                    <TableHead className="w-[10%]">Status</TableHead>
                                    <TableHead className="w-[15%]">Created At</TableHead>
                                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <ListSkeleton rows={6} columns={6} />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {error && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="text-muted-foreground">Unable to load suppliers.</div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading && !error && rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="p-4">
                                            <ListMismatchBanner total={total} />
                                            <ListEmptyState title="No suppliers found" />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading && !error && rows.length > 0 && (
                                    rows.map((supplier) => (
                                        <TableRow
                                            key={supplier.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setLocation(`/admin/suppliers/${supplier.id}`)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="truncate">{supplier.name}</div>
                                                {supplier.website && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {supplier.website}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {supplier.contactName || supplier.contactEmail || supplier.phone ? (
                                                    <div className="text-sm">
                                                        {supplier.contactName && <div className="truncate font-medium">{supplier.contactName}</div>}
                                                        {supplier.contactEmail && <div className="truncate text-muted-foreground">{supplier.contactEmail}</div>}
                                                        {supplier.phone && <div className="text-xs text-muted-foreground truncate">{supplier.phone}</div>}
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="truncate">{supplier.region || "-"}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={supplier.status} mapping={STATUS_BADGES} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(supplier.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
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

interface SupplierRow {
    id: string;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    phone: string | null;
    website: string | null;
    region: string | null;
    status: string;
    createdAt: string;
}
