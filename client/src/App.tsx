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
import AdminProducts from "@/pages/admin/products";
import AdminProductDetail from "@/pages/admin/product-detail";
import AdminProductBulk from "@/pages/admin/product-bulk";
import AdminCampaignNew from "@/pages/admin/campaign-new";
import AdminCampaignDetail from "@/pages/admin/campaign-detail";
import AdminFulfillment from "@/pages/admin/fulfillment";
import AdminClearing from "@/pages/admin/clearing";
import AdminLedger from "@/pages/admin/ledger";
import AdminRefunds from "@/pages/admin/refunds";
import AdminRefundPlans from "@/pages/admin/refund-plans";
import AdminRefundPlanDetail from "@/pages/admin/refund-plan-detail";
import AdminDeliveries from "@/pages/admin/deliveries";
import AdminSuppliers from "@/pages/admin/suppliers";
import AdminSupplierDetail from "@/pages/admin/supplier-detail";
import AdminSupplierBulk from "@/pages/admin/supplier-bulk";
import AdminProductRequests from "@/pages/admin/product-requests";
import AdminLandingSubscribers from "@/pages/admin/landing-subscribers";
import AdminConsolidationPoints from "@/pages/admin/consolidation-points";
import AdminConsolidationDetail from "@/pages/admin/consolidation-detail";
import AdminCredits from "@/pages/admin/credits";
import AdminCreditDetail from "@/pages/admin/credit-detail";
import AdminParticipantCredits from "@/pages/admin/participant-credits";
import AdminParticipants from "@/pages/admin/participants";
import AdminParticipantDetail from "@/pages/admin/participant-detail";
import AdminCommitments from "@/pages/admin/commitments";
import AdminCommitmentDetail from "@/pages/admin/commitment-detail";
import AdminAudit from "@/pages/admin/audit";
import AdminExceptions from "@/pages/admin/exceptions";
import {
  AdminUsersPage,
  AdminUserDetailPage,
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
      <Route path="/admin/login" component={AdminSignInPage} />
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

      {/* Admin Products */}
      <Route path="/admin/products">
        <AdminGuard>
          <AdminProducts />
        </AdminGuard>
      </Route>
      <Route path="/admin/products/bulk">
        <AdminGuard>
          <AdminProductBulk />
        </AdminGuard>
      </Route>
      <Route path="/admin/products/:id">
        {(params) => (
          <AdminGuard>
            <AdminProductDetail />
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

      {/* Admin Participants */}
      <Route path="/admin/participants">
        <AdminGuard>
          <AdminParticipants />
        </AdminGuard>
      </Route>
      <Route path="/admin/participants/:id">
        {(params) => (
          <AdminGuard>
            <AdminParticipantDetail />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/commitments">
        <AdminGuard>
          <AdminCommitments />
        </AdminGuard>
      </Route>
      <Route path="/admin/commitments/:id">
        {(params) => (
          <AdminGuard>
            <AdminCommitmentDetail />
          </AdminGuard>
        )}
      </Route>

      {/* Admin Suppliers */}
      <Route path="/admin/suppliers">
        <AdminGuard>
          <AdminSuppliers />
        </AdminGuard>
      </Route>
      <Route path="/admin/suppliers/bulk">
        <AdminGuard>
          <AdminSupplierBulk />
        </AdminGuard>
      </Route>
      <Route path="/admin/suppliers/:id">
        {(params) => (
          <AdminGuard>
            <AdminSupplierDetail />
          </AdminGuard>
        )}
      </Route>

      {/* Admin Product Requests */}
      <Route path="/admin/product-requests">
        <AdminGuard>
          <AdminProductRequests />
        </AdminGuard>
      </Route>

      {/* Admin Landing Subscribers */}
      <Route path="/admin/landing-subscribers">
        <AdminGuard>
          <AdminLandingSubscribers />
        </AdminGuard>
      </Route>

      {/* Admin Consolidation Points */}
      <Route path="/admin/consolidation">
        <AdminGuard>
          <AdminConsolidationPoints />
        </AdminGuard>
      </Route>
      <Route path="/admin/consolidation/:id">
        {(params) => (
          <AdminGuard>
            <AdminConsolidationDetail />
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
      <Route path="/admin/credits">
        <AdminGuard>
          <AdminCredits />
        </AdminGuard>
      </Route>
      <Route path="/admin/credits/:id">
        {(params) => (
          <AdminGuard>
            <AdminCreditDetail />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/participants/:id/credits">
        {(params) => (
          <AdminGuard>
            <AdminParticipantCredits />
          </AdminGuard>
        )}
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
          <AdminExceptions />
        </AdminGuard>
      </Route>
      <Route path="/admin/audit">
        <AdminGuard>
          <AdminAudit />
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
