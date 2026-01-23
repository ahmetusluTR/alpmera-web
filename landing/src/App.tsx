import { Route, Router } from "wouter";
import LandingHome from "./LandingHome";
import Demand from "./Demand";
import Privacy from "./Privacy";
import Terms from "./Terms";
import StructuredData from "./components/SEO/StructuredData";

// FAQ data for structured data
const faqs = [
  {
    q: "Who holds the funds?",
    a: "Committed funds are held in escrow under each campaign's rules. Alpmera coordinates the escrow process but does not access funds until conditions are met.",
  },
  {
    q: "What happens if a campaign doesn't complete?",
    a: "Participants receive a full refund from escrow. No penalties, no fees deducted.",
  },
  {
    q: "Is there urgency or limited-time pressure?",
    a: "No. Campaigns have explicit timelines, but Alpmera does not use countdown timers, artificial scarcity, or pressure tactics.",
  },
  {
    q: "Is Alpmera a store?",
    a: "No. Alpmera operates campaigns where participants pool demand. We coordinate fulfillment but do not hold inventory or function as a retailer.",
  },
  {
    q: "When will the web app open?",
    a: "We're launching in phases. Early participants will be notified as campaigns become available in their area.",
  },
];

export default function App() {
  return (
    <>
      <StructuredData faqs={faqs} />
      <Router>
        <Route path="/" component={LandingHome} />
        <Route path="/demand" component={Demand} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
      </Router>
    </>
  );
}
