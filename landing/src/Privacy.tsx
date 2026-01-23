import Layout from "./components/Layout";

const sections = [
  {
    title: "Information We Collect",
    content: (
      <div className="space-y-3">
        <p>
          When you join the early list or participate in campaigns, we collect information necessary to operate campaigns safely and communicate with participants.
        </p>
        <p className="font-semibold">Information you provide:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Email address</li>
          <li>Campaign participation interests</li>
          <li>Communication preferences</li>
          <li>Optional notes you choose to share</li>
        </ul>
        <p className="font-semibold">Campaign participation records:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Campaign commitments and escrow transactions</li>
          <li>Campaign completion and fulfillment status</li>
          <li>Communication history related to campaigns</li>
        </ul>
        <p>We collect only what is necessary to operate campaigns with explicit rules and escrow protection.</p>
      </div>
    ),
  },
  {
    title: "How We Use Information",
    content: (
      <div className="space-y-3">
        <p>Alpmera uses participant information exclusively to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Operate and coordinate collective buying campaigns</li>
          <li>Send campaign updates and notifications</li>
          <li>Process escrow commitments and refunds</li>
          <li>Communicate status changes explicitly</li>
          <li>Fulfill campaign operator responsibilities</li>
        </ul>
        <p className="font-semibold mt-4">We do not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Sell or rent participant information to third parties</li>
          <li>Use data for advertising or marketing beyond campaign updates</li>
          <li>Share information except as required to fulfill campaigns</li>
        </ul>
        <p>Alpmera is an operator, not a data broker.</p>
      </div>
    ),
  },
  {
    title: "Campaign Participation Data",
    content: (
      <div className="space-y-3">
        <p>
          When you join a campaign, your participation records include commitment amounts, escrow status, and fulfillment outcomes. This information is used to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Track campaign progress toward completion targets</li>
          <li>Coordinate with suppliers for fulfillment</li>
          <li>Process refunds if campaigns close without completing</li>
          <li>Maintain transparent records of campaign operations</li>
        </ul>
        <p>
          Campaign data is retained as long as necessary to fulfill operator responsibilities and handle any potential disputes or refund processes.
        </p>
      </div>
    ),
  },
  {
    title: "Escrow & Financial Information",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera does not directly handle payment information. Financial transactions are processed through secure third-party payment processors and escrow services.
        </p>
        <p>
          We receive confirmation of escrow commitments and completion status, but do not store credit card numbers or banking details.
        </p>
        <p>Payment processors operate under their own privacy policies and security standards.</p>
      </div>
    ),
  },
  {
    title: "Communication Preferences",
    content: (
      <div className="space-y-3">
        <p>You control what campaign updates you receive:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Essential campaign communications (commitment confirmations, status changes, refunds) are sent to all participants</li>
          <li>Optional campaign recommendations can be enabled or disabled at any time</li>
          <li>Interest tag preferences help us notify you about relevant campaigns</li>
        </ul>
        <p>
          To update communication preferences or unsubscribe from optional updates, contact us at{" "}
          <a href="mailto:hello@alpmera.com" className="underline hover:text-brand-sapphire">
            hello@alpmera.com
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    title: "Data Security",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera implements security measures to protect participant information from unauthorized access, alteration, or disclosure.
        </p>
        <p>Security practices include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Encrypted data transmission and storage</li>
          <li>Access controls limiting who can view participant information</li>
          <li>Regular security assessments</li>
          <li>Secure escrow partnerships with established financial services</li>
        </ul>
        <p>
          While we take security seriously, no system is completely secure. Participants should protect their own account credentials and report any suspicious activity.
        </p>
      </div>
    ),
  },
  {
    title: "Your Rights",
    content: (
      <div className="space-y-3">
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access your participant information</li>
          <li>Request corrections to inaccurate data</li>
          <li>Request deletion of your information (subject to legal retention requirements)</li>
          <li>Opt out of optional campaign recommendations</li>
          <li>Receive confirmation of active campaign commitments</li>
        </ul>
        <p>
          To exercise these rights, contact{" "}
          <a href="mailto:hello@alpmera.com" className="underline hover:text-brand-sapphire">
            hello@alpmera.com
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    title: "Changes to This Policy",
    content: (
      <div className="space-y-3">
        <p>
          Alpmera may update this Privacy Policy as operational practices evolve. Changes will be posted on this page with an updated "Last updated" date.
        </p>
        <p>
          Material changes affecting how participant information is used will be communicated via email to all participants with active campaign commitments.
        </p>
      </div>
    ),
  },
  {
    title: "Contact Information",
    content: (
      <div className="space-y-3">
        <p>Questions about this Privacy Policy or how Alpmera handles participant information can be directed to:</p>
        <p className="font-semibold">
          Email:{" "}
          <a href="mailto:hello@alpmera.com" className="underline hover:text-brand-sapphire">
            hello@alpmera.com
          </a>
        </p>
        <p>Alpmera operates campaigns in the Seattle metropolitan area with a focus on trust-first coordination.</p>
      </div>
    ),
  },
];

export default function Privacy() {
  return (
    <Layout>
      <div className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-brand-slate mb-2 text-sm">Last updated: January 21, 2026</p>
          <p className="text-lg text-brand-slate mb-12">
            How Alpmera handles participant information
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
