import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, Plus, Users, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { type Supplier } from "@shared/schema";

export default function AdminSuppliers() {
    const [, setLocation] = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const { data: suppliers, isLoading } = useQuery<Supplier[]>({
        queryKey: ["/api/admin/suppliers"],
    });

    const filteredSuppliers = suppliers?.filter(supplier => {
        const matchesSearch =
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supplier.contactName && supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (supplier.contactEmail && supplier.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "ALL" || supplier.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "ACTIVE": return "default";
            case "INACTIVE": return "secondary";
            case "ARCHIVED": return "outline";
            default: return "outline";
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">Manage your sourcing partners</p>
                </div>
                <div className="flex gap-2">
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
                    <div className="flex justify-between items-center">
                        <CardTitle>All Suppliers</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search suppliers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                <span className="ml-2 text-muted-foreground">Loading suppliers...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredSuppliers?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Users className="h-8 w-8 mb-2 opacity-20" />
                                                <p>No suppliers found</p>
                                                {searchTerm && <p className="text-sm">Try adjusting your search filters</p>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSuppliers?.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">
                                                {supplier.name}
                                                {supplier.website && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {supplier.website}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {supplier.contactName ? (
                                                    <div className="text-sm">
                                                        <div>{supplier.contactName}</div>
                                                        <div className="text-xs text-muted-foreground">{supplier.contactEmail}</div>
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>{supplier.region || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(supplier.status) as any}>
                                                    {supplier.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(supplier.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/suppliers/${supplier.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
