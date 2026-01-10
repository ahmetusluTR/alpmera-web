import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Alpmera?",
    answer: "Alpmera is a trust-first collective buying platform. We coordinate campaigns where participants join together to meet volume targets, with funds held in escrow until campaign conditions are met."
  },
  {
    question: "How do I join a campaign?",
    answer: "Browse active campaigns, review the rules and terms, then make a commitment. Your funds are locked in escrow—not spent—until the campaign succeeds or fails."
  },
  {
    question: "What happens to my money when I join?",
    answer: "Your commitment amount is locked in escrow. If the campaign reaches its target, funds are released to fulfill the order. If the campaign fails, your funds are automatically refunded."
  },
  {
    question: "How is this different from regular shopping?",
    answer: "Alpmera is not a retailer. We're a clearing house that coordinates collective buying campaigns. You're joining a campaign with other participants, not purchasing from a store."
  },
  {
    question: "What does 'escrow' mean?",
    answer: "Escrow means your funds are held securely by a neutral party (Alpmera) until certain conditions are met. Your money isn't spent—it's locked until the campaign outcome is determined."
  },
  {
    question: "Can I cancel my commitment?",
    answer: "Commitment terms vary by campaign. Check each campaign's rules for cancellation policies. Some campaigns may allow cancellation before certain milestones."
  },
  {
    question: "How do I track my commitments?",
    answer: "Sign in to your account and visit the Commitments section. You can view all your active and past commitments, escrow status, and any refunds."
  },
  {
    question: "What happens if a campaign fails?",
    answer: "If a campaign doesn't reach its target by the deadline, all locked funds are automatically refunded to participants. You'll see the refund in your account's escrow history."
  },
];

export default function FAQ() {
  return (
    <Layout>
      <div className="container max-w-3xl py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3" data-testid="text-faq-title">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground">
            Common questions about how Alpmera works
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About Alpmera</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger data-testid={`faq-question-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent data-testid={`faq-answer-${index}`}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
