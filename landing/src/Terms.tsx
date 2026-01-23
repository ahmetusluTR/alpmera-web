import Layout from "./components/Layout";

const sections = [
  {
    title: "Platform Purpose",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera operates collective buying campaigns with explicit rules and escrow protection. Alpmera is not a store, marketplace, or deal site.
        </p>
        <p>
          By participating in campaigns, you join a coordination platform where participants commit funds to escrow, campaigns either complete or close, and responsibilities are explicitly defined.
        </p>
        <p>
          These Terms of Participation govern your relationship with Alpmera and your participation in campaigns.
        </p>
      </div>
    ),
  },
  {
    title: "Campaign Participation Rules",
    content: (
      <div className="space-y-3">
        <p>When you join a campaign:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You commit funds to escrow under the campaign's specific rules</li>
          <li>Funds remain in escrow until the campaign completes or closes</li>
          <li>Campaign rules define target quantities, timelines, and conditions</li>
          <li>You may review all campaign rules before committing</li>
        </ul>
        <p className="font-semibold mt-4">Participants do not purchase products directly.</p>
        <p>
          Instead, participants join campaigns operated by Alpmera. If a campaign completes, Alpmera coordinates procurement and fulfillment. If a campaign closes without completing, refunds follow the campaign rules.
        </p>
      </div>
    ),
  },
  {
    title: "Escrow & Refund Terms",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">Escrow Protection:</p>
        <p>
          All campaign commitments are held in escrow until the campaign reaches completion conditions or closes. Funds are not released to Alpmera or suppliers until campaigns complete.
        </p>
        <p className="font-semibold mt-4">Refund Conditions:</p>
        <p>If a campaign does not complete, participants receive refunds according to the campaign rules, which may include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Full refund if target quantity is not reached</li>
          <li>Refund processing timeline as specified in campaign rules</li>
          <li>Any escrow service fees (if applicable and disclosed)</li>
        </ul>
        <p>
          Refund timelines are conditional and depend on campaign-specific factors. All refund conditions are disclosed before participants commit.
        </p>
      </div>
    ),
  },
  {
    title: "Campaign Operator Responsibilities",
    content: (
      <div className="space-y-3">
        <p>Alpmera's responsibilities as campaign operator include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Setting and communicating explicit campaign rules</li>
          <li>Coordinating with suppliers when campaigns complete</li>
          <li>Processing fulfillment to participants</li>
          <li>Handling refunds if campaigns close without completing</li>
          <li>Communicating status changes explicitly</li>
        </ul>
        <p className="font-semibold mt-4">Alpmera does not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Guarantee campaign completion</li>
          <li>Control supplier manufacturing or delivery timelines</li>
          <li>Act as a seller or retailer</li>
        </ul>
        <p>
          Alpmera operates campaigns end-to-end but completion depends on reaching target quantities and supplier acceptance.
        </p>
      </div>
    ),
  },
  {
    title: "Participant Responsibilities",
    content: (
      <div className="space-y-3">
        <p>As a campaign participant, you agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review campaign rules before committing funds</li>
          <li>Provide accurate information for fulfillment (if campaign completes)</li>
          <li>Understand that campaigns may not complete</li>
          <li>Accept refunds if campaigns close per the published rules</li>
          <li>Communicate any issues or disputes in a timely manner</li>
        </ul>
        <p>
          Participants acknowledge that collective buying campaigns involve coordination and timelines that differ from traditional retail.
        </p>
      </div>
    ),
  },
  {
    title: "Campaign Failure Conditions",
    content: (
      <div className="space-y-3">
        <p>Campaigns may close without completing if:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Target quantity is not reached within the campaign timeline</li>
          <li>Supplier declines to accept the campaign</li>
          <li>Operational or safety concerns prevent fulfillment</li>
          <li>Alpmera determines the campaign cannot proceed responsibly</li>
        </ul>
        <p>
          If a campaign closes, participants receive refunds according to the campaign rules. No penalties apply to participants for campaign closure.
        </p>
        <p>
          Alpmera reserves the right to close campaigns at its discretion if completing them would violate our trust-first principles.
        </p>
      </div>
    ),
  },
  {
    title: "Dispute Resolution",
    content: (
      <div className="space-y-3">
        <p>
          If you have concerns about a campaign, commitment, or fulfillment, contact Alpmera at{" "}
          <a href="mailto:hello@alpmera.com" className="underline hover:text-brand-sapphire">
            hello@alpmera.com
          </a>
          .
        </p>
        <p>
          We address disputes through transparent review of campaign rules and records. Participants have the right to escalate unresolved disputes through appropriate legal channels.
        </p>
        <p>
          Alpmera operates in good faith to honor commitments and follow explicit campaign rules.
        </p>
      </div>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera operates campaigns with care but cannot guarantee outcomes. Campaign completion depends on collective participation, supplier acceptance, and external factors.
        </p>
        <p>
          Alpmera is not liable for delays, supplier failures, or circumstances beyond reasonable control. Liability is limited to refunding escrowed commitments according to campaign rules.
        </p>
        <p>
          Participants join campaigns understanding the collective nature of the model and accept that individual outcomes depend on campaign completion.
        </p>
      </div>
    ),
  },
  {
    title: "Changes to Terms",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera may update these Terms of Participation as the platform evolves. Changes will be posted on this page with an updated "Last updated" date.
        </p>
        <p>
          Material changes will be communicated to participants with active campaign commitments. Continued participation after changes take effect constitutes acceptance of updated terms.
        </p>
        <p>
          Individual campaign rules remain fixed once a campaign opens and cannot be changed retroactively.
        </p>
      </div>
    ),
  },
  {
    title: "Contact Information",
    content: (
      <div className="space-y-3">
        <p>Questions about these Terms of Participation can be directed to:</p>
        <p className="font-semibold">
          Email:{" "}
          <a href="mailto:hello@alpmera.com" className="underline hover:text-brand-sapphire">
            hello@alpmera.com
          </a>
        </p>
        <p>
          Alpmera operates trust-first collective buying campaigns in the Seattle metropolitan area with explicit rules and escrow protection.
        </p>
      </div>
    ),
  },
];

export default function Terms() {
  return (
    <Layout>
      <div className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-4">Terms of Participation</h1>
          <p className="text-brand-slate mb-2 text-sm">Last updated: January 21, 2026</p>
          <p className="text-lg text-brand-slate mb-12">
            Rules for joining Alpmera campaigns
          </p>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="rounded-lg border border-card-border bg-card p-8 shadow-soft card-texture">
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <div className="text-brand-slate prose prose-sm max-w-none">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
