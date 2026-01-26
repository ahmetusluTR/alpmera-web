import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ProductRequest {
  id: string;
  productName: string;
  category: string | null;
  inputSku: string | null;
  derivedSku: string | null;
  canonicalProductId: string | null;
  referenceUrl: string;
  reason: string | null;
  submitterEmail: string | null;
  submitterCity: string | null;
  submitterState: string | null;
  notifyOnCampaign: boolean | null;
  voteCount: number;
  status: string;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  statusChangeReason: string | null;
  verificationStatus: string;
  verificationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductRequestsResponse {
  items: ProductRequest[];
  total: number;
  limit: number;
  offset: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "not_reviewed", label: "Open" },
  { value: "in_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "failed_in_campaign", label: "Failed in Campaign" },
  { value: "successful_in_campaign", label: "Successful in Campaign" },
];

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  not_reviewed: { label: "Open", variant: "secondary" },
  in_review: { label: "Under Review", variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  failed_in_campaign: { label: "Failed", variant: "destructive" },
  successful_in_campaign: { label: "Successful", variant: "default" },
};

const VERIFICATION_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  verified: { label: "Verified", variant: "default" },
  unverified: { label: "Unverified", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
};

export default function AdminProductRequests() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ProductRequestsResponse>({
    queryKey: ["admin-product-requests", statusFilter, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("sort", sort);
      params.set("limit", pageSize.toString());
      params.set("offset", ((page - 1) * pageSize).toString());

      const response = await fetch(`/api/admin/product-requests?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch product requests");
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const response = await fetch(`/api/admin/product-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reason }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-requests"] });
      setStatusDialogOpen(false);
      setSelectedRequest(null);
      setNewStatus("");
      setStatusReason("");
      toast({
        title: "Status updated",
        description: "Product request status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openStatusDialog = (request: ProductRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setStatusReason("");
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedRequest || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      reason: statusReason || undefined,
    });
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Requests</h1>
          <p className="text-muted-foreground">Community-submitted product suggestions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="votes">Most Votes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[300px]">Product</TableHead>
                  <TableHead className="w-[120px]">SKU</TableHead>
                  <TableHead className="w-[80px]">Votes</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px]">Verification</TableHead>
                  <TableHead className="w-[100px]">Submitted</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-red-500">
                      Error loading data
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No product requests found
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="max-w-[400px]">
                      <div className="font-medium break-words">{request.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.category || "No category"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {request.derivedSku || request.inputSku || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{request.voteCount}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGES[request.status]?.variant || "secondary"}>
                        {STATUS_BADGES[request.status]?.label || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={VERIFICATION_BADGES[request.verificationStatus]?.variant || "secondary"}>
                        {VERIFICATION_BADGES[request.verificationStatus]?.label || request.verificationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={request.referenceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(request)}
                        >
                          Update
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.total || 0)} of {data?.total || 0}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
            <DialogDescription>
              Change the status of "{selectedRequest?.productName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter(o => o.value !== "ALL").map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for status change..."
                rows={3}
              />
            </div>
            {selectedRequest && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Submitter:</span>{" "}
                  {selectedRequest.submitterEmail || "Anonymous"}
                </div>
                {selectedRequest.reason && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">User reason:</span>{" "}
                    {selectedRequest.reason}
                  </div>
                )}
                {selectedRequest.verificationReason && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Verification:</span>{" "}
                    {selectedRequest.verificationReason}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!newStatus || newStatus === selectedRequest?.status || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
