import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Construction className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Coming Soon</p>
            <p className="text-muted-foreground">This section is under development.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export function SuppliersPage() {
  return <PlaceholderPage title="Suppliers" description="Manage supplier relationships and contacts" />;
}

export function ExceptionsPage() {
  return <PlaceholderPage title="Exceptions" description="Handle edge cases and manual interventions" />;
}

export function AuditPage() {
  return <PlaceholderPage title="Audit Log" description="Complete audit trail of admin actions" />;
}

// Users Management
export function AdminUsersPage() {
  return <PlaceholderPage title="Users" description="View and manage platform users" />;
}

export function AdminUserDetailPage() {
  return <PlaceholderPage title="User Detail" description="Individual user profile and activity" />;
}

// Suppliers Management
export function AdminSupplierDetailPage() {
  return <PlaceholderPage title="Supplier Detail" description="Supplier profile and campaign history" />;
}

// Consolidation Points
export function AdminConsolidationPointsPage() {
  return <PlaceholderPage title="Consolidation Points" description="Manage delivery consolidation locations" />;
}

export function AdminConsolidationPointDetailPage() {
  return <PlaceholderPage title="Consolidation Point Detail" description="Consolidation point settings" />;
}

// Payments & Escrow
export function AdminPaymentsEscrowPage() {
  return <PlaceholderPage title="Payments & Escrow" description="Overview of all escrow transactions" />;
}

export function AdminReleasesPage() {
  return <PlaceholderPage title="Releases" description="Fund releases to suppliers" />;
}

// Disputes
export function AdminDisputesPage() {
  return <PlaceholderPage title="Disputes" description="Manage participant disputes and resolutions" />;
}

export function AdminDisputeDetailPage() {
  return <PlaceholderPage title="Dispute Detail" description="Individual dispute investigation" />;
}

// Configuration
export function AdminConfigurationPage() {
  return <PlaceholderPage title="Configuration" description="Platform configuration settings" />;
}

export function AdminCampaignRulesPage() {
  return <PlaceholderPage title="Campaign Rules" description="Default campaign rule templates" />;
}

export function AdminPlatformLimitsPage() {
  return <PlaceholderPage title="Platform Limits" description="System-wide limits and thresholds" />;
}

export function AdminReferenceTablesPage() {
  return <PlaceholderPage title="Reference Tables" description="Lookup tables and reference data" />;
}

// Security
export function AdminSecurityPage() {
  return <PlaceholderPage title="Security" description="Admin security and access controls" />;
}

export function AdminRolesPage() {
  return <PlaceholderPage title="Admin Roles" description="Role definitions and permissions" />;
}

export function AdminAccessLogsPage() {
  return <PlaceholderPage title="Access Logs" description="Admin login and access history" />;
}

export function AdminSystemAuditPage() {
  return <PlaceholderPage title="System Audit Trail" description="Complete system-wide audit log" />;
}
