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
          This Privacy Policy describes how we handle information collected from the early list and how we plan to handle participant information once campaigns launch.
        </p>
        <p>
          Right now, we are only collecting early list signups. Campaign operations described below represent planned practices that will take effect when campaigns become available.
        </p>
      </div>
    ),
  },
  {
    title: "Information We Currently Collect",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">Early list information:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Email address</li>
          <li>Interest tags (optional product categories)</li>
          <li>Communication preferences</li>
          <li>Optional notes you choose to share</li>
        </ul>
        <p>
          This information is used solely to notify you when campaigns become available and to understand what categories to prioritize.
        </p>
      </div>
    ),
  },
  {
    title: "Information We Plan to Collect (When Campaigns Launch)",
    content: (
      <div className="space-y-3">
        <p>
          Once campaigns are active, we will collect information necessary to operate campaigns safely and communicate with participants.
        </p>
        <p className="font-semibold">Planned campaign participation records:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Campaign commitments and escrow transaction confirmations</li>
          <li>Campaign completion and fulfillment status</li>
          <li>Communication history related to specific campaigns</li>
          <li>Shipping and fulfillment information (only when needed)</li>
        </ul>
        <p>We will collect only what is necessary to operate campaigns with explicit rules and escrow protection.</p>
      </div>
    ),
  },
  {
    title: "How We Use Information",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">Currently (pre-launch):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Notify early list members when campaigns become available</li>
          <li>Understand which product categories to prioritize</li>
          <li>Send occasional updates about platform launch progress</li>
        </ul>
        <p className="font-semibold mt-4">Planned use (when campaigns launch):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Operate and coordinate collective buying campaigns</li>
          <li>Send campaign updates and status notifications</li>
          <li>Coordinate escrow commitments and refunds</li>
          <li>Communicate state changes explicitly</li>
          <li>Fulfill campaign operator responsibilities</li>
        </ul>
        <p className="font-semibold mt-4">We will not:</p>
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
    title: "Planned Campaign Participation Data",
    content: (
      <div className="space-y-3">
        <p>
          Once campaigns launch, when you join a campaign, your participation records will include commitment amounts, escrow status, and fulfillment outcomes. This information will be used to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Track campaign progress toward completion targets</li>
          <li>Coordinate with suppliers for fulfillment</li>
          <li>Process refunds if campaigns close without completing</li>
          <li>Maintain transparent records of campaign operations</li>
        </ul>
        <p>
          Campaign data will be retained as long as necessary to fulfill operator responsibilities and handle any potential disputes or refund processes.
        </p>
      </div>
    ),
  },
  {
    title: "Planned Escrow & Financial Information Handling",
    content: (
      <div className="space-y-3">
        <p>
          When campaigns launch, Alpmera will not directly handle payment information. Financial transactions will be processed through secure third-party payment processors and escrow services.
        </p>
        <p>
          We will receive confirmation of escrow commitments and completion status, but will not store credit card numbers or banking details.
        </p>
        <p>
          Payment processors will operate under their own privacy policies and security standards. Specific providers will be disclosed before campaigns launch.
        </p>
      </div>
    ),
  },
  {
    title: "Communication Preferences",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">Currently (early list):</p>
        <p>
          You can opt in to receive notifications when campaigns become available. You can unsubscribe from the early list at any time.
        </p>
        <p className="font-semibold mt-4">Planned (when campaigns launch):</p>
        <p>You will control what campaign updates you receive:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Essential campaign communications (commitment confirmations, status changes, refunds) will be sent to all participants</li>
          <li>Optional campaign recommendations can be enabled or disabled at any time</li>
          <li>Interest tag preferences help us notify you about relevant campaigns</li>
        </ul>
        <p>
          To update preferences or unsubscribe, contact{" "}
          <a href="mailto:hello@alpmera.com" className="underline hover:text-alpmera-primary">
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
          Alpmera implements security measures to protect information from unauthorized access, alteration, or disclosure.
        </p>
        <p>Current and planned security practices include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Encrypted data transmission and storage</li>
          <li>Access controls limiting who can view information</li>
          <li>Security assessments and monitoring</li>
          <li>Planned secure escrow partnerships with established financial services</li>
        </ul>
        <p>
          While we take security seriously, no system is completely secure. We will continue to improve security practices as the platform evolves.
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
          <a href="mailto:hello@alpmera.com" className="underline hover:text-alpmera-primary">
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
          Alpmera may update this Privacy Policy as we move from pre-launch to active operations and as practices evolve. Changes will be posted on this page with an updated "Last updated" date.
        </p>
        <p>
          When campaigns launch, we will notify early list members of the updated privacy practices. Material changes affecting how information is used will be communicated clearly.
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
          <a href="mailto:hello@alpmera.com" className="underline hover:text-alpmera-primary">
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
          <p className="text-alpmera-text-light mb-2 text-sm">Last updated: January 23, 2026</p>
          <p className="text-lg text-alpmera-text-light mb-4">
            How Alpmera handles participant information
          </p>
          <div className="mb-12 rounded-lg border-2 border-alpmera-accent/30 bg-alpmera-secondary/50 p-4">
            <p className="text-sm text-alpmera-text font-semibold">
              ⓘ Pre-Launch Notice: Campaigns are not yet active. This policy describes current early list practices and planned campaign operations.
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
