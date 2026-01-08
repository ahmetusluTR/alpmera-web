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
