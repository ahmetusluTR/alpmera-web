import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, User, CreditCard, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Participant {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  createdAt: string;
}

interface ParticipantsResponse {
  participants: Participant[];
  total: number;
  limit: number;
  offset: number;
}

export default function ParticipantsPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, error } = useQuery<ParticipantsResponse>({
    queryKey: ["/api/admin/participants", search],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
      });
      if (search) {
        params.append("search", search);
      }
      const res = await fetch(`/api/admin/participants?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view participant accounts
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by participant ID or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              {search && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              Participants
              {data && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({data.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading participants...
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">
                  ⚠️ Error loading participants
                </p>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Failed to load participants"}
                </p>
              </div>
            )}

            {data && data.participants.length === 0 && (
              <div className="text-center py-8">
                <p className="text-lg font-medium mb-2">No participants found</p>
                <p className="text-muted-foreground">
                  {search
                    ? `No participants match "${search}"`
                    : "No participants in the system"}
                </p>
              </div>
            )}

            {data && data.participants.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-mono text-sm">
                          {participant.id}
                        </TableCell>
                        <TableCell>
                          {participant.fullName || (
                            <span className="text-muted-foreground italic">
                              No name
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>
                          {participant.phoneNumber || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(participant.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/participants/${participant.id}`}>
                              <Button variant="outline" size="sm">
                                <User className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            <Link
                              href={`/admin/participants/${participant.id}/credits`}
                            >
                              <Button variant="outline" size="sm">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Credits
                              </Button>
                            </Link>
                            <Link href={`/admin/participants/${participant.id}`}>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2" />
                                Commitments
                              </Button>
                            </Link>
                            <Link href={`/admin/participants/${participant.id}`}>
                              <Button variant="outline" size="sm">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Refunds
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
