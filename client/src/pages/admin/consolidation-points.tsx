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
import { Search, Plus, MapPin, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { type ConsolidationPoint } from "@shared/schema";

export default function AdminConsolidationPoints() {
    const [, setLocation] = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const { data: points, isLoading } = useQuery<ConsolidationPoint[]>({
        queryKey: ["/api/admin/consolidation-points"],
    });

    const filteredPoints = points?.filter(point => {
        const matchesSearch =
            point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (point.city && point.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (point.state && point.state.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "ALL" || point.status === statusFilter;

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
                    <h1 className="text-3xl font-bold tracking-tight">Consolidation Points</h1>
                    <p className="text-muted-foreground">Manage fulfillment hubs and delivery locations</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/consolidation/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Point
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>All Locations</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or city..."
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
                                    <TableHead>Location Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>City/State</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                <span className="ml-2 text-muted-foreground">Loading locations...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPoints?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <MapPin className="h-8 w-8 mb-2 opacity-20" />
                                                <p>No consolidation points found</p>
                                                {searchTerm && <p className="text-sm">Try adjusting your search filters</p>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPoints?.map((point) => (
                                        <TableRow key={point.id}>
                                            <TableCell className="font-medium">
                                                {point.name}
                                            </TableCell>
                                            <TableCell>
                                                {point.addressLine1 ? (
                                                    <div className="text-sm">
                                                        <div>{point.addressLine1}</div>
                                                        {point.addressLine2 && <div className="text-xs text-muted-foreground">{point.addressLine2}</div>}
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {point.city ? `${point.city}, ${point.state || ""}` : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(point.status) as any}>
                                                    {point.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(point.updatedAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/consolidation/${point.id}`}>
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
