import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export interface ListToolbarOption {
  value: string;
  label: string;
}

interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: ListToolbarOption[];
  createdFrom?: string;
  createdTo?: string;
  onCreatedFromChange?: (value: string) => void;
  onCreatedToChange?: (value: string) => void;
  pageSize?: number;
  onPageSizeChange?: (value: number) => void;
  pageSizeOptions?: number[];
  onClearFilters?: () => void;
  extraFilters?: ReactNode;
}

export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusValue,
  onStatusChange,
  statusOptions,
  createdFrom,
  createdTo,
  onCreatedFromChange,
  onCreatedToChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  onClearFilters,
  extraFilters,
}: ListToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        {statusOptions && onStatusChange && (
          <div>
            <Select value={statusValue} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {extraFilters}
        {onCreatedFromChange && (
          <div>
            <Input
              type="date"
              value={createdFrom || ""}
              onChange={(e) => onCreatedFromChange(e.target.value)}
            />
          </div>
        )}
        {onCreatedToChange && (
          <div>
            <Input
              type="date"
              value={createdTo || ""}
              onChange={(e) => onCreatedToChange(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {pageSize !== undefined && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page size</span>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
