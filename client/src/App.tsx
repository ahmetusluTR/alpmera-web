import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Campaigns from "@/pages/campaigns";
import CampaignDetail from "@/pages/campaign-detail";
import CommitmentWizard from "@/pages/commitment-wizard";
import StatusPage from "@/pages/status";
import HowItWorks from "@/pages/how-it-works";
import AdminConsole from "@/pages/admin";
import AdminControlRoom from "@/pages/admin/control-room";
import AdminCampaigns from "@/pages/admin/campaigns";
import AdminCampaignDetail from "@/pages/admin/campaign-detail";
import AdminFulfillment from "@/pages/admin/fulfillment";
import AdminClearing from "@/pages/admin/clearing";
import AdminLedger from "@/pages/admin/ledger";
import AdminRefunds from "@/pages/admin/refunds";
import AdminRefundPlans from "@/pages/admin/refund-plans";
import AdminRefundPlanDetail from "@/pages/admin/refund-plan-detail";
import AdminDeliveries from "@/pages/admin/deliveries";
import { SuppliersPage, ExceptionsPage, AuditPage } from "@/pages/admin/placeholder";
import SignIn from "@/pages/signin";
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
      <Route path="/" component={Home} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaign/:id" component={CampaignDetail} />
      <Route path="/campaign/:id/commit" component={CommitmentWizard} />
      <Route path="/status" component={StatusPage} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/admin" component={AdminControlRoom} />
      <Route path="/admin/control-room" component={AdminControlRoom} />
      <Route path="/admin/campaigns" component={AdminCampaigns} />
      <Route path="/admin/campaigns/:id" component={AdminCampaignDetail} />
      <Route path="/admin/campaigns/:id/fulfillment" component={AdminFulfillment} />
      <Route path="/admin/clearing" component={AdminClearing} />
      <Route path="/admin/clearing/ledger" component={AdminLedger} />
      <Route path="/admin/refunds" component={AdminRefunds} />
      <Route path="/admin/refund-plans" component={AdminRefundPlans} />
      <Route path="/admin/refund-plans/:id" component={AdminRefundPlanDetail} />
      <Route path="/admin/deliveries" component={AdminDeliveries} />
      <Route path="/admin/suppliers" component={SuppliersPage} />
      <Route path="/admin/exceptions" component={ExceptionsPage} />
      <Route path="/admin/audit" component={AuditPage} />
      <Route path="/signin" component={SignIn} />
      <Route path="/account" component={AccountIndex} />
      <Route path="/account/profile" component={AccountProfile} />
      <Route path="/account/commitments" component={AccountCommitments} />
      <Route path="/account/commitments/:code" component={AccountCommitmentDetail} />
      <Route path="/account/payments" component={AccountPayments} />
      <Route path="/account/escrow" component={AccountPayments} />
      <Route path="/account/escrow/:id" component={AccountEscrowDetail} />
      <Route path="/account/refunds" component={AccountRefunds} />
      <Route path="/account/refunds/:id" component={AccountRefundDetail} />
      <Route path="/account/security" component={AccountSecurity} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
