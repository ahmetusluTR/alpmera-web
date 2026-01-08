import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Search, RefreshCw, Plus, FileUp, Loader2, Download, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface RefundPlan {
  id: string;
  status: string;
  rowCount: number;
  totalAmount: number;
  campaignId: string | null;
  campaignName: string | null;
  createdAt: string;
}

interface ImportResult {
  success: boolean;
  planId: string;
  rowCount: number;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  EXECUTED: { label: "Executed", variant: "outline" },
  FAILED: { label: "Failed", variant: "destructive" },
};

const CSV_TEMPLATE = `commitment_code,amount,reason
ABC123,50.00,campaign_failed_refund
DEF456,75.50,campaign_failed_refund`;

export default function RefundPlansPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: plans, isLoading, error, refetch } = useQuery<RefundPlan[]>({
    queryKey: ["/api/admin/refund-plans"],
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/refund-plans/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Import failed");
      }
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      toast({
        title: "Refund Plan Created",
        description: `Draft plan created with ${result.rowCount} rows.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/refund-plans"] });
      setImportDialogOpen(false);
      setSelectedFile(null);
      setLocation(`/admin/refund-plans/${result.planId}`);
    },
    onError: (error: Error) => {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    },
  });

  const filteredPlans = plans
    ?.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (search && p.campaignName && !p.campaignName.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortBy === "rowCount") {
        cmp = a.rowCount - b.rowCount;
      } else if (sortBy === "totalAmount") {
        cmp = a.totalAmount - b.totalAmount;
      }
      return sortDir === "desc" ? -cmp : cmp;
    }) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleRowClick = (planId: string) => {
    setLocation(`/admin/refund-plans/${planId}`);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "refund_plan_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-refund-plans-heading">Refund Plans</h1>
            <p className="text-muted-foreground text-sm">Batch refund plans for failed campaigns</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} data-testid="button-download-template">
              <Download className="w-4 h-4 mr-2" />
              CSV Template
            </Button>
            <Button onClick={() => setImportDialogOpen(true)} data-testid="button-import-plan">
              <Plus className="w-4 h-4 mr-2" />
              Import Refund Plan
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-plans"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="EXECUTED">Executed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="rowCount">Rows</SelectItem>
              <SelectItem value="totalAmount">Amount</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleSortDir} data-testid="button-sort-dir">
            {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Unable to load refund plans.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredPlans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No refund plans found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan) => {
                      const statusBadge = STATUS_BADGES[plan.status] || { label: plan.status, variant: "outline" as const };
                      return (
                        <TableRow
                          key={plan.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handleRowClick(plan.id)}
                          data-testid={`plan-row-${plan.id}`}
                        >
                          <TableCell className="font-mono text-xs">{plan.id.slice(0, 8)}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{plan.rowCount}</TableCell>
                          <TableCell className="font-mono">${plan.totalAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(plan.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Refund Plan</DialogTitle>
            <DialogDescription>
              Upload a CSV file to create a DRAFT refund plan. This does not execute refunds until approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                data-testid="input-csv-file"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileUp className="w-4 h-4" />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              data-testid="button-confirm-import"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Create Draft Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
