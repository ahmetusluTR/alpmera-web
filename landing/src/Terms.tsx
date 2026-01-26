import Layout from "./components/Layout";

const sections = [
  {
    title: "Pre-Launch Status",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">
          Alpmera is currently in pre-launch. Campaigns are not yet active.
        </p>
        <p>
          These Terms of Participation describe how Alpmera will operate once campaigns launch. By joining the early list, you are expressing interest in future campaign participation — you are not committing to any campaign or financial obligation.
        </p>
        <p>
          Campaign operations described below represent planned practices. When campaigns become available, you will have the opportunity to review final terms before joining any campaign.
        </p>
      </div>
    ),
  },
  {
    title: "Platform Purpose (Planned)",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera will operate collective buying campaigns with explicit rules and escrow protection. Alpmera is not a store, marketplace, or deal site.
        </p>
        <p>
          When you participate in campaigns, you will join a coordination platform where participants commit funds to escrow, campaigns either complete or close, and responsibilities are explicitly defined.
        </p>
        <p>
          These terms will govern your relationship with Alpmera and your participation in campaigns once they launch.
        </p>
      </div>
    ),
  },
  {
    title: "Planned Campaign Participation Rules",
    content: (
      <div className="space-y-3">
        <p>When campaigns launch and you choose to join a campaign:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You will commit funds to escrow under that campaign's specific rules</li>
          <li>Funds will remain in escrow until the campaign completes or closes</li>
          <li>Campaign rules will define target quantities, timelines, and conditions</li>
          <li>You will be able to review all campaign rules before committing</li>
        </ul>
        <p className="font-semibold mt-4">Participants will not purchase products directly.</p>
        <p>
          Instead, participants will join campaigns operated by Alpmera. If a campaign completes, Alpmera will coordinate procurement and fulfillment. If a campaign closes without completing, refunds will follow the campaign rules.
        </p>
      </div>
    ),
  },
  {
    title: "Planned Escrow & Refund Terms",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">Planned Escrow Protection:</p>
        <p>
          When campaigns launch, all campaign commitments will be held in escrow until the campaign reaches completion conditions or closes. Funds will not be released to Alpmera or suppliers until campaigns complete.
        </p>
        <p>
          Specific escrow providers will be disclosed before campaigns launch.
        </p>
        <p className="font-semibold mt-4">Planned Refund Conditions:</p>
        <p>If a campaign does not complete, participants will receive refunds according to that campaign's rules, which may include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Full refund if target quantity is not reached</li>
          <li>Refund processing timeline as specified in campaign rules</li>
          <li>Any escrow service fees (if applicable and disclosed upfront)</li>
        </ul>
        <p>
          Refund timelines will be conditional and depend on campaign-specific factors. All refund conditions will be disclosed before participants commit.
        </p>
      </div>
    ),
  },
  {
    title: "Planned Campaign Operator Responsibilities",
    content: (
      <div className="space-y-3">
        <p>When campaigns launch, Alpmera's planned responsibilities as campaign operator will include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Setting and communicating explicit campaign rules</li>
          <li>Coordinating with suppliers when campaigns complete</li>
          <li>Managing fulfillment to participants</li>
          <li>Handling refunds if campaigns close without completing</li>
          <li>Communicating status changes explicitly</li>
        </ul>
        <p className="font-semibold mt-4">Alpmera will not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Guarantee campaign completion</li>
          <li>Control supplier manufacturing or delivery timelines</li>
          <li>Act as a seller or retailer</li>
        </ul>
        <p>
          Alpmera will operate campaigns end-to-end but completion will depend on reaching target quantities and supplier acceptance.
        </p>
      </div>
    ),
  },
  {
    title: "Planned Participant Responsibilities",
    content: (
      <div className="space-y-3">
        <p>When you join a campaign, you will agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review campaign rules before committing funds</li>
          <li>Provide accurate information for fulfillment (if campaign completes)</li>
          <li>Understand that campaigns may not complete</li>
          <li>Accept refunds if campaigns close per the published rules</li>
          <li>Communicate any issues or disputes in a timely manner</li>
        </ul>
        <p>
          Participants will acknowledge that collective buying campaigns involve coordination and timelines that differ from traditional retail.
        </p>
      </div>
    ),
  },
  {
    title: "Planned Campaign Failure Conditions",
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
          If a campaign closes, participants will receive refunds according to the campaign rules. No penalties will apply to participants for campaign closure.
        </p>
        <p>
          Alpmera will reserve the right to close campaigns if completing them would violate our trust-first principles.
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
          <a href="mailto:hello@alpmera.com" className="underline hover:text-alpmera-primary">
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
    title: "Planned Limitation of Liability",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera will operate campaigns with care but cannot guarantee outcomes. Campaign completion will depend on collective participation, supplier acceptance, and external factors.
        </p>
        <p>
          Alpmera will not be liable for delays, supplier failures, or circumstances beyond reasonable control. Liability will be limited to refunding escrowed commitments according to campaign rules.
        </p>
        <p>
          Participants will join campaigns understanding the collective nature of the model and accept that individual outcomes depend on campaign completion.
        </p>
      </div>
    ),
  },
  {
    title: "Changes to Terms",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera may update these Terms of Participation as we move from pre-launch to active operations and as the platform evolves. Changes will be posted on this page with an updated "Last updated" date.
        </p>
        <p>
          When campaigns launch, early list members will be notified of finalized terms. Once campaigns are active, material changes will be communicated to participants with active campaign commitments.
        </p>
        <p>
          Individual campaign rules will remain fixed once a campaign opens and cannot be changed retroactively.
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
          <a href="mailto:hello@alpmera.com" className="underline hover:text-alpmera-primary">
            hello@alpmera.com
          </a>
        </p>
        <p>
          Alpmera will operate trust-first collective buying campaigns in the Seattle metropolitan area with explicit rules and escrow protection.
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
          <p className="text-alpmera-text-light mb-2 text-sm">Last updated: January 23, 2026</p>
          <p className="text-lg text-alpmera-text-light mb-4">
            Planned rules for joining Alpmera campaigns
          </p>
          <div className="mb-12 rounded-lg border-2 border-alpmera-accent/30 bg-alpmera-secondary/50 p-4">
            <p className="text-sm text-alpmera-text font-semibold">
              ⓘ Pre-Launch Notice: Campaigns are not yet active. These terms describe planned operations. Joining the early list does not create any financial obligation.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="rounded-lg border border-card-border bg-card p-8 shadow-soft card-texture">
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <div className="text-alpmera-text-light prose prose-sm max-w-none">
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
