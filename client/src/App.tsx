import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { AuthGuard, AdminGuard, PublicOnlyGuard } from "@/components/route-guards";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Campaigns from "@/pages/campaigns";
import CampaignDetail from "@/pages/campaign-detail";
import CommitmentWizard from "@/pages/commitment-wizard";
import StatusPage from "@/pages/status";
import HowItWorks from "@/pages/how-it-works";
import FAQ from "@/pages/faq";

import SignInPage from "@/pages/auth/sign-in";
import VerifyPage from "@/pages/auth/verify";
import SignIn from "@/pages/signin";

import AdminSignInPage from "@/pages/admin/sign-in";
import AdminControlRoom from "@/pages/admin/control-room";
import AdminCampaigns from "@/pages/admin/campaigns";
import AdminCampaignNew from "@/pages/admin/campaign-new";
import AdminCampaignDetail from "@/pages/admin/campaign-detail";
import AdminFulfillment from "@/pages/admin/fulfillment";
import AdminClearing from "@/pages/admin/clearing";
import AdminLedger from "@/pages/admin/ledger";
import AdminRefunds from "@/pages/admin/refunds";
import AdminRefundPlans from "@/pages/admin/refund-plans";
import AdminRefundPlanDetail from "@/pages/admin/refund-plan-detail";
import AdminDeliveries from "@/pages/admin/deliveries";
import {
  SuppliersPage,
  ExceptionsPage,
  AuditPage,
  AdminUsersPage,
  AdminUserDetailPage,
  AdminSupplierDetailPage,
  AdminConsolidationPointsPage,
  AdminConsolidationPointDetailPage,
  AdminPaymentsEscrowPage,
  AdminReleasesPage,
  AdminDisputesPage,
  AdminDisputeDetailPage,
  AdminConfigurationPage,
  AdminCampaignRulesPage,
  AdminPlatformLimitsPage,
  AdminReferenceTablesPage,
  AdminSecurityPage,
  AdminRolesPage,
  AdminAccessLogsPage,
  AdminSystemAuditPage,
} from "@/pages/admin/placeholder";

import AccountIndex from "@/pages/account/index";
import AccountProfile from "@/pages/account/profile";
import AccountCommitments from "@/pages/account/commitments";
import AccountCommitmentDetail from "@/pages/account/commitment-detail";
import AccountPayments from "@/pages/account/payments";
import AccountEscrowDetail from "@/pages/account/escrow-detail";
import AccountRefunds from "@/pages/account/refunds";
import AccountRefundDetail from "@/pages/account/refund-detail";
import AccountSecurity from "@/pages/account/security";

function Router() {
  return (
    <Switch>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route path="/" component={Home} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/faq" component={FAQ} />
      <Route path="/status" component={StatusPage} />

      {/* Legacy route aliases - redirect to canonical paths */}
      <Route path="/campaign/:id">
        {(params) => <Redirect to={`/campaigns/${params.id}`} />}
      </Route>
      <Route path="/campaign/:id/commit">
        {(params) => <Redirect to={`/campaigns/${params.id}/commit`} />}
      </Route>

      {/* ========== AUTH ROUTES (Passwordless) ========== */}
      <Route path="/auth/sign-in">
        <PublicOnlyGuard>
          <SignInPage />
        </PublicOnlyGuard>
      </Route>
      <Route path="/auth/verify">
        <PublicOnlyGuard>
          <VerifyPage />
        </PublicOnlyGuard>
      </Route>
      {/* Legacy signin route alias */}
      <Route path="/signin">
        <PublicOnlyGuard>
          <SignIn />
        </PublicOnlyGuard>
      </Route>

      {/* ========== ACCOUNT ROUTES (Auth Required) ========== */}
      <Route path="/account">
        <AuthGuard>
          <AccountIndex />
        </AuthGuard>
      </Route>
      <Route path="/account/profile">
        <AuthGuard>
          <AccountProfile />
        </AuthGuard>
      </Route>
      <Route path="/account/commitments">
        <AuthGuard>
          <AccountCommitments />
        </AuthGuard>
      </Route>
      <Route path="/account/commitments/:code">
        {(params) => (
          <AuthGuard>
            <AccountCommitmentDetail />
          </AuthGuard>
        )}
      </Route>
      {/* Commitment wizard requires auth */}
      <Route path="/campaigns/:id/commit">
        {(params) => (
          <AuthGuard>
            <CommitmentWizard />
          </AuthGuard>
        )}
      </Route>
      <Route path="/account/payments-escrow">
        <AuthGuard>
          <AccountPayments />
        </AuthGuard>
      </Route>
      <Route path="/account/payments-escrow/:id">
        {(params) => (
          <AuthGuard>
            <AccountEscrowDetail />
          </AuthGuard>
        )}
      </Route>
      {/* Account alias routes - redirect to canonical paths */}
      <Route path="/account/payments">
        <Redirect to="/account/payments-escrow" />
      </Route>
      <Route path="/account/escrow">
        <Redirect to="/account/payments-escrow" />
      </Route>
      <Route path="/account/escrow/:id">
        {(params) => <Redirect to={`/account/payments-escrow/${params.id}`} />}
      </Route>
      <Route path="/account/refunds">
        <AuthGuard>
          <AccountRefunds />
        </AuthGuard>
      </Route>
      <Route path="/account/refunds/:id">
        {(params) => (
          <AuthGuard>
            <AccountRefundDetail />
          </AuthGuard>
        )}
      </Route>
      <Route path="/account/security">
        <AuthGuard>
          <AccountSecurity />
        </AuthGuard>
      </Route>

      {/* ========== ADMIN ROUTES (Admin Auth Required) ========== */}
      <Route path="/admin/sign-in" component={AdminSignInPage} />
      <Route path="/admin">
        <AdminGuard>
          <AdminControlRoom />
        </AdminGuard>
      </Route>
      <Route path="/admin/control-room">
        <AdminGuard>
          <AdminControlRoom />
        </AdminGuard>
      </Route>
      <Route path="/admin/campaigns">
        <AdminGuard>
          <AdminCampaigns />
        </AdminGuard>
      </Route>
      <Route path="/admin/campaigns/new">
        <AdminGuard>
          <AdminCampaignNew />
        </AdminGuard>
      </Route>
      <Route path="/admin/campaigns/:id">
        {(params) => (
          <AdminGuard>
            <AdminCampaignDetail />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/campaigns/:id/fulfillment">
        {(params) => (
          <AdminGuard>
            <AdminFulfillment />
          </AdminGuard>
        )}
      </Route>

      {/* Admin Users */}
      <Route path="/admin/users">
        <AdminGuard>
          <AdminUsersPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/users/:id">
        {(params) => (
          <AdminGuard>
            <AdminUserDetailPage />
          </AdminGuard>
        )}
      </Route>

      {/* Admin Suppliers */}
      <Route path="/admin/suppliers">
        <AdminGuard>
          <SuppliersPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/suppliers/:id">
        {(params) => (
          <AdminGuard>
            <AdminSupplierDetailPage />
          </AdminGuard>
        )}
      </Route>

      {/* Admin Consolidation Points */}
      <Route path="/admin/consolidation-points">
        <AdminGuard>
          <AdminConsolidationPointsPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/consolidation-points/:id">
        {(params) => (
          <AdminGuard>
            <AdminConsolidationPointDetailPage />
          </AdminGuard>
        )}
      </Route>

      {/* Admin Payments & Escrow */}
      <Route path="/admin/payments-escrow">
        <AdminGuard>
          <AdminPaymentsEscrowPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/payments-escrow/releases">
        <AdminGuard>
          <AdminReleasesPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/payments-escrow/refunds">
        <AdminGuard>
          <AdminRefunds />
        </AdminGuard>
      </Route>
      <Route path="/admin/clearing">
        <AdminGuard>
          <AdminClearing />
        </AdminGuard>
      </Route>
      <Route path="/admin/clearing/ledger">
        <AdminGuard>
          <AdminLedger />
        </AdminGuard>
      </Route>
      <Route path="/admin/refunds">
        <AdminGuard>
          <AdminRefunds />
        </AdminGuard>
      </Route>
      <Route path="/admin/refund-plans">
        <AdminGuard>
          <AdminRefundPlans />
        </AdminGuard>
      </Route>
      <Route path="/admin/refund-plans/:id">
        {(params) => (
          <AdminGuard>
            <AdminRefundPlanDetail />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/deliveries">
        <AdminGuard>
          <AdminDeliveries />
        </AdminGuard>
      </Route>

      {/* Admin Disputes */}
      <Route path="/admin/disputes">
        <AdminGuard>
          <AdminDisputesPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/disputes/:id">
        {(params) => (
          <AdminGuard>
            <AdminDisputeDetailPage />
          </AdminGuard>
        )}
      </Route>

      {/* Admin Configuration */}
      <Route path="/admin/configuration">
        <AdminGuard>
          <AdminConfigurationPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/configuration/campaign-rules">
        <AdminGuard>
          <AdminCampaignRulesPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/configuration/platform-limits">
        <AdminGuard>
          <AdminPlatformLimitsPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/configuration/reference-tables">
        <AdminGuard>
          <AdminReferenceTablesPage />
        </AdminGuard>
      </Route>

      {/* Admin Security */}
      <Route path="/admin/security">
        <AdminGuard>
          <AdminSecurityPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/security/admin-roles">
        <AdminGuard>
          <AdminRolesPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/security/access-logs">
        <AdminGuard>
          <AdminAccessLogsPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/security/system-audit-trail">
        <AdminGuard>
          <AdminSystemAuditPage />
        </AdminGuard>
      </Route>

      {/* Legacy admin routes */}
      <Route path="/admin/exceptions">
        <AdminGuard>
          <ExceptionsPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/audit">
        <AdminGuard>
          <AuditPage />
        </AdminGuard>
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
