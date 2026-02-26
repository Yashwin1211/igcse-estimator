export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://igcse-estimator.vercel.app#webapp",
        "name": "IGCSE Grade Calculator - Threshold",
        "alternateName": "Threshold IGCSE Grade Estimator",
        "description": "Free IGCSE grade calculator using 5 years of Cambridge boundary data. Calculate your grades across 18 subjects for February/March, May/June, and October/November exam sessions.",
        "url": "https://igcse-estimator.vercel.app",
        "applicationCategory": "EducationalApplication",
        "applicationSubCategory": "Grade Calculator",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "featureList": [
          "18 Cambridge IGCSE subjects supported",
          "5 years of historical grade boundary data",
          "All exam sessions (FM, MJ, ON)",
          "Component weighting accuracy",
          "Weighted boundary averaging",
          "Historical range visualization"
        ],
        "author": {
          "@type": "Organization",
          "name": "Threshold"
        },
        "keywords": "IGCSE grade calculator, IGCSE grade estimator, IGCSE grade boundaries calculator, Cambridge IGCSE grades, grade boundary calculator",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://igcse-estimator.vercel.app"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://igcse-estimator.vercel.app#organization",
        "name": "Threshold",
        "description": "Educational technology focused on Cambridge IGCSE grade estimation and boundary analysis.",
        "url": "https://igcse-estimator.vercel.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://igcse-estimator.vercel.app/og-image.jpg"
        },
        "sameAs": [],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "English"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://igcse-estimator.vercel.app#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How accurate is this IGCSE grade calculator?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our IGCSE grade calculator uses 5 years of Cambridge boundary data with weighted averaging for recent trends. Component marks are weighted exactly as Cambridge specifies per syllabus for maximum accuracy."
            }
          },
          {
            "@type": "Question",
            "name": "Which IGCSE subjects does the grade calculator support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We support 18 Cambridge IGCSE subjects across sciences, mathematics, humanities, and languages including Biology, Chemistry, Physics, Mathematics, English Language, History, Geography, and more."
            }
          },
          {
            "@type": "Question",
            "name": "How do IGCSE grade boundaries work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Cambridge sets grade boundaries each session based on exam difficulty and student performance. Our IGCSE grade boundaries calculator compares your marks against 5 years of boundary data from February/March, May/June, and October/November sessions to estimate your grade."
            }
          },
          {
            "@type": "Question",
            "name": "Is the IGCSE grade calculator free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, our IGCSE grade calculator is completely free to use. No registration is required for basic grade estimation, though creating an account allows you to save your results."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://igcse-estimator.vercel.app#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://igcse-estimator.vercel.app"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "IGCSE Grade Calculator",
            "item": "https://igcse-estimator.vercel.app/estimate"
          }
        ]
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 0) }}
    />
  )
}