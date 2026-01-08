import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CampaignDetail from "@/pages/campaign-detail";
import CommitmentWizard from "@/pages/commitment-wizard";
import StatusPage from "@/pages/status";
import HowItWorks from "@/pages/how-it-works";
import AdminConsole from "@/pages/admin";
import SignIn from "@/pages/signin";
import AccountIndex from "@/pages/account/index";
import AccountProfile from "@/pages/account/profile";
import AccountCommitments from "@/pages/account/commitments";
import AccountCommitmentDetail from "@/pages/account/commitment-detail";
import AccountPayments from "@/pages/account/payments";
import AccountEscrowDetail from "@/pages/account/escrow-detail";
import AccountRefunds from "@/pages/account/refunds";
import AccountSecurity from "@/pages/account/security";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/campaign/:id" component={CampaignDetail} />
      <Route path="/campaign/:id/commit" component={CommitmentWizard} />
      <Route path="/status" component={StatusPage} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/admin" component={AdminConsole} />
      <Route path="/signin" component={SignIn} />
      <Route path="/account" component={AccountIndex} />
      <Route path="/account/profile" component={AccountProfile} />
      <Route path="/account/commitments" component={AccountCommitments} />
      <Route path="/account/commitments/:code" component={AccountCommitmentDetail} />
      <Route path="/account/payments" component={AccountPayments} />
      <Route path="/account/escrow" component={AccountPayments} />
      <Route path="/account/escrow/:id" component={AccountEscrowDetail} />
      <Route path="/account/refunds" component={AccountRefunds} />
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
