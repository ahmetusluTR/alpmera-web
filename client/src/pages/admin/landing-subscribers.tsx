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
import { Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface LandingSubscriber {
  id: string;
  email: string;
  status: string;
  source: string;
  interestTags: string[] | null;
  notes: string | null;
  recommendationOptIn: boolean;
  createdAt: string;
  unsubscribedAt: string | null;
  lastSubmittedAt: string;
}

// Interest tag options from backend
const INTEREST_TAGS = [
  "Electronics",
  "Kitchen Appliances",
  "Home Appliances",
  "Office",
  "Tools",
  "Outdoor",
  "Other",
];

export default function LandingSubscribersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagsFilter, setTagsFilter] = useState<string>("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For controlled input

  // Dialog state
  const [selectedSubscriber, setSelectedSubscriber] = useState<LandingSubscriber | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // Fetch subscribers
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-landing-subscribers", page, pageSize, statusFilter, tagsFilter, searchEmail],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (tagsFilter && tagsFilter !== "all") {
        params.append("tags", tagsFilter);
      }
      if (searchEmail) {
        params.append("search", searchEmail);
      }

      const res = await fetch(`/api/admin/landing-subscribers?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      const result = await res.json();
      return {
        items: result.rows as LandingSubscriber[],
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      };
    },
  });

  // Update subscriber mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/admin/landing-subscribers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update subscriber");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-landing-subscribers"] });
      toast({
        title: "Success",
        description: "Subscriber updated successfully",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update subscriber",
        variant: "destructive",
      });
    },
  });

  // Open edit dialog
  const openEditDialog = (subscriber: LandingSubscriber) => {
    setSelectedSubscriber(subscriber);
    setNotes(subscriber.notes || "");
    setNewStatus(subscriber.status);
    setDialogOpen(true);
  };

  // Save changes
  const handleSave = () => {
    if (!selectedSubscriber) return;

    const updates: any = {};
    if (notes !== selectedSubscriber.notes) {
      updates.notes = notes;
    }
    if (newStatus !== selectedSubscriber.status) {
      updates.status = newStatus;
    }

    if (Object.keys(updates).length === 0) {
      setDialogOpen(false);
      return;
    }

    updateMutation.mutate({ id: selectedSubscriber.id, updates });
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (tagsFilter && tagsFilter !== "all") {
        params.append("tags", tagsFilter);
      }

      const res = await fetch(`/api/admin/landing-subscribers/export/csv?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `landing-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Subscribers exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export subscribers",
        variant: "destructive",
      });
    }
  };

  // Handle search
  const handleSearch = () => {
    setSearchEmail(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Landing Subscribers</h1>
            <p className="text-muted-foreground mt-1">
              Manage early access list subscribers
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email search */}
              <div className="space-y-2">
                <Label>Search Email</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interest tags filter */}
              <div className="space-y-2">
                <Label>Interest Tags</Label>
                <Select
                  value={tagsFilter}
                  onValueChange={(value) => {
                    setTagsFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {INTEREST_TAGS.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Subscribers ({data?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Email</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[200px]">Interest Tags</TableHead>
                    <TableHead className="w-[100px]">Rec Opt-In</TableHead>
                    <TableHead className="w-[100px]">Source</TableHead>
                    <TableHead className="w-[150px]">Notes</TableHead>
                    <TableHead className="w-[120px]">Submitted</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {error && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-red-500">
                        Error loading data
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.items.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No subscribers found
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.items.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-mono text-sm break-all">
                        {subscriber.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                          {subscriber.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subscriber.interestTags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          )) || (
                            <span className="text-sm text-muted-foreground italic">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscriber.recommendationOptIn ? "default" : "outline"}>
                          {subscriber.recommendationOptIn ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{subscriber.source}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {subscriber.notes ? (
                          <span className="line-clamp-2">{subscriber.notes}</span>
                        ) : (
                          <span className="italic">No notes</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(subscriber.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(subscriber)}
                        >
                          Edit
                        </Button>
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Subscriber</DialogTitle>
            <DialogDescription>
              Update subscriber status and notes
            </DialogDescription>
          </DialogHeader>

          {selectedSubscriber && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                  {selectedSubscriber.email}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this subscriber..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Interest Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSubscriber.interestTags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    )) || <span className="text-sm italic">None</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recommendation Opt-In</p>
                  <Badge className="mt-1" variant={selectedSubscriber.recommendationOptIn ? "default" : "outline"}>
                    {selectedSubscriber.recommendationOptIn ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(selectedSubscriber.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                {selectedSubscriber.unsubscribedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Unsubscribed</p>
                    <p className="text-sm font-medium mt-1">
                      {format(new Date(selectedSubscriber.unsubscribedAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
