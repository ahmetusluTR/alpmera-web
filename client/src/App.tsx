import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CampaignDetail from "@/pages/campaign-detail";
import CommitmentWizard from "@/pages/commitment-wizard";
import StatusPage from "@/pages/status";
import HowItWorks from "@/pages/how-it-works";
import AdminConsole from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/campaign/:id" component={CampaignDetail} />
      <Route path="/campaign/:id/commit" component={CommitmentWizard} />
      <Route path="/status" component={StatusPage} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/admin" component={AdminConsole} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
