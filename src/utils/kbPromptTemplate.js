/**
 * Knowledge Base Generator System Prompt & Template
 * Used by administrators to generate structured Markdown documents for Qdrant RAG via Claude/ChatGPT.
 */

export const getKbGeneratorPrompt = (businessName = "") => {
  const bName = (businessName && businessName.trim()) || "[Business Name]";
  
  return `# Knowledge Base Generator — Agent Instructions

> **How to use this file:** Paste this entire document into an AI agent (e.g. Claude), then attach/paste the target business's raw material — website URL(s), PDFs, DOCX, PPTX, brochures, price sheets, FAQs, or plain text about the company. Tell the agent: *"Use the template below to generate the Knowledge Base for ${bName}."* The agent should output a single Markdown document that mirrors the section structure, tone, and formatting shown here exactly, populated with the new business's real information — never inventing facts that weren't provided or found in the source material.

---

## AGENT INSTRUCTIONS (read this part first)

1. **Extract, don't invent.** Pull every fact (products, specs, features, applications, safety info, contact details, pricing policy) only from the supplied sources (website, PDFs, PPT, docs). If a fact isn't in the source material, omit it — do not fabricate numbers, specs, or claims.
2. **Match the structure exactly.** Use the six top-level sections below, in this order, with the same heading levels and sub-structure. If a business has more or fewer product/service lines than the example, repeat or trim Section 2 accordingly (2.1, 2.2, 2.3 …).
3. **Match the formatting style.**
   - Company Overview: short intro paragraph + bullet list of key facts.
   - Each product/service: intro paragraph → **Features** (bullets) → **Specifications** (bullets) → **Applications** (bullets) → **Safety** (bullets, only if relevant to the business type — e.g. skip for non-physical services).
   - FAQs: \`Q:\` / \`A:\` pairs, phrased the way a real customer would ask them, answered concisely (1–3 sentences) in a tone suited for chatbot/WhatsApp retrieval — short, direct, no fluff.
4. **Pricing rule (mandatory).** Unless the source material explicitly publishes prices, the chatbot must never guess, estimate, or negotiate pricing. Include a **Pricing & Quotation FAQs** section that redirects every pricing question to a callback/consultation request, plus a **Callback / Sales Team Handling** section with ready-made responses for: customer asks for a call, customer gives a preferred date/time, customer says "call anytime," customer wants an immediate call.
5. **Flag gaps.** If contact info, social links, or key details are missing/broken/placeholder in the source, note it inline (e.g. "as of extraction, not yet configured — flag to client for update") rather than silently omitting or guessing.
6. **Output format.** Deliver the finished KB as a single clean Markdown document, ready to be converted to PDF or fed directly into a RAG/chatbot pipeline. Use the section numbering shown below.

---

## TEMPLATE STRUCTURE TO FOLLOW

\`\`\`
${bName} — Knowledge Base
Source: [website URL(s)] | Compiled for chatbot / RAG use.

1. Company Overview
   - Short paragraph: what the company does, its focus/mission.
   - Bullet list of key facts: specialization, philosophy, team/experience,
     customer-facing values, geographic area served, segments served.

2. Products / Services Offered
   [List all product or service lines by name]

   2.1 [Product/Service Name]
       Intro paragraph (what it is, who it's for, why it's built the way it is)
       Features
       - ...
       Specifications
       - Capacity / size / scale: ...
       - Speed / performance: ...
       - Configuration options (e.g. door type, material, tier): ...
       Applications
       - ...
       Safety (omit if not applicable to this business)
       - ...

   2.2 [Next Product/Service Name]
       (repeat structure above)

3. Competitive Edge — Why Choose ${bName}
   - Bullet list of differentiators pulled from source material
     (technology, customization, support model, safety standards,
     efficiency, experience, track record, etc.)

4. [Segment / Property Types / Use-Case Categories] Served
   Group the applications from Section 2 into logical customer segments,
   e.g.:
   Residential
   - ...
   Commercial
   - ...
   Industrial
   - ...
   [Other segment relevant to this business, e.g. Healthcare, Education, Retail]
   - ...

5. Company & Contact Information
   Company / Brand: ...
   Registered Address: ...
   Phone / WhatsApp: ...
   Email: ...
   Website: ...
   Social Media: ... (flag any placeholder/broken links)

6. FAQ (Optimized for Chatbot Retrieval)

   GENERAL FAQs
   Q1: What products/services does ${bName} offer?
   A: ...
   Q2: What does ${bName} do?
   A: ...
   Q3: Where is ${bName} located?
   A: ...
   Q4: What kind of clients/buildings/customers does ${bName} work with?
   A: ...
   Q5: Does ${bName} handle the full lifecycle (sales, install, support)?
   A: ...
   Q6: What safety/quality/warranty features are included?
   A: ...
   Q7: Are ${bName}'s offerings customizable?
   A: ...
   [Add more general FAQs as the source material supports]

   SERVICE 1 — [Product/Service Name]
   Q1: What is [Product/Service Name]?
   A: ...
   Q2: What is the capacity/scale/scope of [Product/Service Name]?
   A: ...
   Q3: [Performance-related question, e.g. speed/turnaround]?
   A: ...
   Q4: What options/configurations are available?
   A: ...
   Q5: Where is [Product/Service Name] typically used?
   A: ...
   Q6: What safety/quality features does it include?
   A: ...
   Q7: Is it customizable?
   A: ...
   Q8: Is it suited for [heavy/daily/critical] use?
   A: ...

   SERVICE 2 — [Next Product/Service Name]
   (repeat Q1–Q8 pattern above, tailored to this product/service)

   [Repeat a "SERVICE N" block for every product/service line in Section 2]

   PRICING & QUOTATION FAQs
   IMPORTANT PRICING RULE: The chatbot must NOT provide, guess, estimate,
   or negotiate pricing unless prices are explicitly published in the
   source material. Redirect all pricing questions to a callback request.

   Q1: How much does ${bName}'s product/service cost?
   A: Pricing depends on [relevant factors]. We will arrange for our team
      to contact you with pricing details. Please share your preferred
      date and time for a call.
   Q2: What is the price of [specific product/service]?
   A: Pricing varies by [specification/requirement]. We will arrange for
      our team to contact you with the relevant pricing details. Please
      share your preferred date and time for a call.
   Q3: Can you give me an approximate price or quotation?
   A: Our team will provide pricing based on your specific requirements
      after a consultation. Please share your preferred date and time
      for a call.
   Q4: Is the pricing negotiable?
   A: Pricing and commercial terms are handled directly by the
      ${bName} team. Please share your preferred date and time
      for a call so they can discuss this with you.
   Q5: Do you offer free consultation or site visits/demos?
   A: [Base on source material; if unclear, say it should be confirmed
      directly with the team via a callback request.]
   Q6: I want someone to call me about pricing.
   A: Certainly. We will arrange for our team to contact you regarding
      pricing and other details. Please share your preferred date and
      time for a call.

   CALLBACK / SALES TEAM HANDLING
   Customer asks for a call
   A: Sure. We will ask our team to contact you regarding pricing and
      other details. Please suggest a suitable date and time for a call.
   Customer provides a preferred date and time
   A: Sure. I've noted your preferred callback date and time. Our team
      will contact you regarding pricing and other details.
   Customer says "Call me anytime"
   A: Sure. We will pass your callback request to our team. Please share
      a preferred date and time so they can reach you at a convenient
      time.
   Customer requests an immediate call
   A: Sure. We will pass your request to our team right away. Please
      share your preferred time for the call.

   CONTACT INFORMATION
   Q: How can someone contact ${bName}?
   A: Phone / WhatsApp: ... | Email: ... | Website: ... |
      Registered Address: ...
\`\`\`

---

## PROMPT TO PASTE ALONG WITH SOURCE MATERIAL

> Use the KB_Generation_Template.md structure above to generate a complete Knowledge Base document for **${bName}**, using only the facts found in the attached website content / PDF / PPTX / DOCX. Follow the exact section order, heading structure, and Q&A style shown in the template. Apply the mandatory pricing rule. Flag any missing or placeholder contact/social info instead of guessing. Output the result as a single clean Markdown document.`;
};
