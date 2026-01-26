import { useEffect } from "react";

interface StructuredDataProps {
  faqs: Array<{ q: string; a: string }>;
}

export default function StructuredData({ faqs }: StructuredDataProps) {
  useEffect(() => {
    // Organization Schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Alpmera",
      "url": "https://alpmera.com",
      "description": "Trust-first collective buying operator with escrow-protected campaigns",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "WA",
        "addressLocality": "Seattle",
        "addressCountry": "US"
      },
      "email": "hello@alpmera.com",
      "areaServed": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": "47.6062",
          "longitude": "-122.3321"
        }
      }
    };

    // FAQPage Schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };

    // WebSite Schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Alpmera",
      "url": "https://alpmera.com",
      "description": "Join campaigns with clear rules, commit funds to escrow, receive refunds if campaigns don't complete",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://alpmera.com/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    };

    // LocalBusiness Schema
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Alpmera",
      "description": "Trust-first campaign operator for collective participation",
      "url": "https://alpmera.com",
      "telephone": "",
      "email": "hello@alpmera.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Seattle",
        "addressRegion": "WA",
        "addressCountry": "US"
      },
      "areaServed": {
        "@type": "City",
        "name": "Seattle"
      }
    };

    // Inject all schemas
    const schemas = [organizationSchema, faqSchema, websiteSchema, localBusinessSchema];

    schemas.forEach((schema, index) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = `structured-data-${index}`;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup on unmount
    return () => {
      schemas.forEach((_, index) => {
        const script = document.getElementById(`structured-data-${index}`);
        if (script) {
          document.head.removeChild(script);
        }
      });
    };
  }, [faqs]);

  return null;
}
