import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Bot,
  Layers,
  ListFilter,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Upload,
  FileText,
  CheckSquare,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCheck,
  Terminal,
  HelpCircle,
  Briefcase,
  Smile,
  Target,
  Wrench,
  Check,
  Zap,
  Sliders,
  Copy,
  Info,
  X,
  Lock,
  ExternalLink,
  Edit2,
  Eye,
  EyeOff,
  Key,
  FileJson,
  Code,
  Braces,
  Lightbulb,
  Headphones,
  MessageCircle,
  RotateCcw,
  PhoneMissed,
  PhoneCall,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import { API_ENDPOINTS, BACKEND_URL } from "../utils/constants.js";
import KBGeneratorPromptCard from "../components/KBGeneratorPromptCard.jsx";

// Wizard steps configuration
const STEPS = [
  {
    id: 1,
    title: "Business Profile",
    shortTitle: "Business Profile",
    subtitle: "Company name, business overview, and AI conversational tone",
    icon: Building2,
    description: "Tell the AI about your brand, what your company does, and how it should speak to prospective customers on WhatsApp.",
  },
  {
    id: 2,
    title: "AI Connection & Quota",
    shortTitle: "AI Connection",
    subtitle: "Connect your Google Gemini API key and manage daily call quotas",
    icon: Bot,
    description: "Provide an active Google Gemini API key to power WhatsApp automated replies, lead qualification, and call recording intelligence across your organization.",
  },
  {
    id: 3,
    title: "Products & Services Catalog",
    shortTitle: "Services",
    subtitle: "What your business offers and customer search keywords",
    icon: Layers,
    description: "Add all products, services, and packages you offer. The AI uses these descriptions and keywords to answer inquiries and suggest offerings.",
  },
  {
    id: 4,
    title: "Lead Questions & Qualification",
    shortTitle: "Lead Questions",
    subtitle: "Information the AI should naturally gather from leads",
    icon: ListFilter,
    description: "Define the specific data points (location, budget, timeline, project requirements) the AI asks during conversation to qualify each lead.",
  },
  {
    id: 5,
    title: "Customer Messages & Greetings",
    shortTitle: "Customer Messages",
    subtitle: "Automated WhatsApp welcome greetings and missed-call notifications",
    icon: MessageCircle,
    description: "Configure the automated messages sent to customers on WhatsApp when they first message you or when an inbound call is missed.",
  },
  {
    id: 6,
    title: "Company Knowledge Documents",
    shortTitle: "Knowledge Base",
    subtitle: "Brochures, price sheets, and FAQs the AI references",
    icon: BookOpen,
    description: "Upload PDFs, Word docs, or text files containing brochures, FAQs, and price lists. The AI searches these documents to answer specific customer questions.",
  },
  {
    id: 7,
    title: "Review & Test AI Assistant",
    shortTitle: "Review & Test",
    subtitle: "Verify setup completeness, inspect compiled prompt, and test sample conversations",
    icon: Sparkles,
    description: "Review your configuration against mandatory requirements, test sample conversations in the interactive playground, and activate your AI pilot.",
  },
  {
    id: 8,
    title: "Subscription & Seats",
    shortTitle: "Subscription",
    subtitle: "Plan validity, sales representative licenses, and connection mode",
    icon: CreditCard,
    description: "Review your organization's subscription plan, allocated user seats, WhatsApp connection configuration, and daily usage statistics.",
  },
];

const DEFAULT_WELCOME_TEMPLATE = `Hello {{name}}! 👋\n\nThank you for reaching out to {{company}} regarding *{{service}}*.\n\nWe have received your enquiry and our specialist will connect with you shortly.\n\nFeel free to reply with any specific requirements or questions you may have!`;

const DEFAULT_MISSED_CALL_SAME_TEMPLATE = `Hello {{name}}! 👋 We have received your call, but we couldn't connect. We will call you back shortly. In the meantime, if you have any questions, you can ask right here! 💬`;

const DEFAULT_MISSED_CALL_DIFF_TEMPLATE = `Hello {{name}}! 👋 You have contacted {{number}}, this is also my number. We couldn't connect right now, but we will call you back shortly. Feel free to message us right here on WhatsApp! 💬`;

// Default single enquiry service for all new/unconfigured organizations
const DEFAULT_SERVICE_TEMPLATE = {
  name: "General Enquiry",
  description:
    "General inquiry or consultation regarding products, services, and customer requirements.",
  keywords: [
    "enquiry",
    "inquiry",
    "information",
    "help",
    "details",
    "consultation",
  ],
};

const DEFAULT_QUALIFICATION_FIELDS = [
  {
    key: "cityAndArea",
    label: "City & Area",
    type: "string",
    description: "Customer's city, area, or preferred project location.",
    options: [],
    required: false,
  },
  {
    key: "primaryIntent",
    label: "Primary Intent",
    type: "string",
    description:
      "Customer's primary objective, service requirement, or product needed.",
    options: [],
    required: false,
  },
  {
    key: "urgencyLevel",
    label: "Urgency Level",
    type: "select",
    options: ["Immediate", "Within 1 Month", "Planning / Just Exploring"],
    description: "Customer's purchasing urgency or required timeframe.",
    required: false,
  },
  {
    key: "interestScore",
    label: "Interest Score (1-10)",
    type: "number",
    description:
      "Assessed customer interest or buying readiness score from 1 to 10.",
    options: [],
    required: false,
  },
  {
    key: "callbackDateTime",
    label: "Callback Date/Time",
    type: "string",
    description:
      "Best callback date and time requested by customer for consultation.",
    options: [],
    required: false,
  },
];

const AI_EXTRACTION_SYSTEM_PROMPT = `You are a CRM AI Configuration Specialist. Your job is to analyze the uploaded business document(s) and extract ALL the information needed to configure an AI-powered WhatsApp sales assistant for this company.

The CRM system (SalesBuster CRM) has the following configurable AI fields that MUST be populated from the document. Extract and generate each section precisely.

═══════════════════════════════════════════════
OUTPUT FORMAT — Generate ALL of the following:
═══════════════════════════════════════════════

### 1. COMPANY NAME (companyName)
- Extract the official brand/company name from the document.
- This is what the AI agent will call itself when speaking to customers.
- Output: A single clean brand name string.

### 2. BUSINESS DESCRIPTION (businessDescription)
- Write a 2-4 sentence description of what this company does, its value proposition, and target market.
- This is used as the AI's core knowledge about the company.
- Should sound professional and compelling — the AI will reference this when explaining the company to customers.
- Output: A paragraph (2-4 sentences max).

### 3. AGENT PERSONA (agentPersona)
- Based on the business type, recommend an appropriate persona for the AI sales agent.
- Examples: "warm, friendly, and consultative sales representative", "professional and knowledgeable property advisor", "enthusiastic and helpful product specialist"
- Match the tone to the business domain (luxury = sophisticated, tech = knowledgeable, real estate = advisory, etc.)
- Output: A single descriptive phrase.

### 4. SERVICES CATALOG (services)
- Extract EVERY product, service, offering, or package mentioned in the document.
- For EACH service, provide:
  - name: Short, clear service/product name
  - description: 1-2 sentence description of what it includes
  - keywords: Array of 4-8 related keywords/synonyms that a customer might use to ask about this service (in lowercase)
  - category: Group services into logical categories (e.g., "Residential", "Commercial", "Consultation", "Products", "Packages")
- IMPORTANT: Always include a "General Enquiry" service as the first item with generic keywords.
- Output: JSON array format.

Example:
[
  {
    "name": "General Enquiry",
    "description": "General inquiry or consultation regarding products, services, and customer requirements.",
    "keywords": ["enquiry", "inquiry", "information", "help", "details", "consultation", "general"],
    "category": "General"
  },
  {
    "name": "Premium Interior Design",
    "description": "End-to-end luxury interior design services including 3D visualization, material selection, and execution.",
    "keywords": ["interior", "design", "interiors", "home design", "decoration", "furnishing", "3d design"],
    "category": "Design Services"
  }
]

### 5. LEAD QUALIFICATION FIELDS (qualificationFields)
- Based on the business type, generate the specific questions/data points the AI should gather from customers during conversation.
- For EACH field, provide:
  - key: camelCase identifier (e.g., "cityAndArea", "budgetRange", "projectType")
  - label: Human-readable label (e.g., "City & Area", "Budget Range")
  - type: One of: "string", "number", "boolean", "select"
  - description: What the AI should understand about this field and how to extract it from conversation
  - options: (Only for "select" type) Array of allowed option values
  - required: true/false — whether this is mandatory to collect

MANDATORY fields that MUST always be included:
- cityAndArea (string) — Customer's location
- primaryIntent (string) — What the customer is looking for
- urgencyLevel (select) — Options: ["Immediate", "Within 1 Month", "1-3 Months", "Planning / Just Exploring"]
- interestScore (number) — 1-10 buying readiness score
- callbackDateTime (string) — Preferred callback date/time

THEN add 3-8 BUSINESS-SPECIFIC fields based on the document. Examples:
- Real Estate: propertyType, bhkPreference, budgetRange, possessionTimeline, loanRequired
- Interior Design: projectType, roomCount, designStyle, materialPreference
- Education: courseInterest, currentQualification, startDate, scholarshipNeeded
- SaaS/Tech: teamSize, currentTool, integrationNeeds, planPreference
- Healthcare: appointmentType, insuranceProvider, preferredDoctor, symptoms
- E-commerce: productCategory, orderSize, deliveryPreference

Output: JSON array format.

Example:
[
  {
    "key": "cityAndArea",
    "label": "City & Area",
    "type": "string",
    "description": "Customer's city, area, or preferred project/service location.",
    "required": false
  },
  {
    "key": "budgetRange",
    "label": "Budget Range",
    "type": "select",
    "description": "Customer's approximate budget or spending range for the service.",
    "options": ["Under ₹5 Lakh", "₹5-15 Lakh", "₹15-30 Lakh", "₹30-50 Lakh", "₹50 Lakh+"],
    "required": false
  },
  {
    "key": "urgencyLevel",
    "label": "Urgency Level",
    "type": "select",
    "description": "How soon the customer needs the service or wants to start.",
    "options": ["Immediate", "Within 1 Month", "1-3 Months", "Planning / Just Exploring"],
    "required": false
  },
  {
    "key": "interestScore",
    "label": "Interest Score (1-10)",
    "type": "number",
    "description": "Assessed customer interest or buying readiness score from 1 to 10.",
    "required": false
  },
  {
    "key": "callbackDateTime",
    "label": "Callback Date/Time",
    "type": "string",
    "description": "Best callback date and time requested by customer for consultation.",
    "required": false
  }
]

### 6. CUSTOM INSTRUCTIONS (customInstructions)
- Generate 5-8 behavioral rules for the AI agent, customized to this specific business.
- Rules MUST always include:
  1. HUMAN TONE: Communicate like a real human. Be warm, polite, conversational. NEVER mention being AI/bot.
  2. PACING: Ask at most 1-2 questions per message to gather data naturally.
  3. PRICING RULE: How to handle pricing (quote exact if available, or schedule callback).
  4. HUMAN HANDOFF: Transfer to human if requested, set disableAI=true.
  5. WHATSAPP FORMATTING: Keep messages short (50-60 words max), clean bullet points, bold key terms (*term*), and emojis.
- Then add 2-3 BUSINESS-SPECIFIC rules. Examples:
  - "SITE VISIT: If customer shows strong interest (interest score 7+), proactively offer to schedule a site visit."
  - "PORTFOLIO: When discussing design styles, share relevant project examples from our portfolio."
  - "AVAILABILITY: Always check product availability before confirming delivery dates."
- Output: Numbered list as a single string.

### 7. LEAD STATUS CONDITIONS (Bonus — for reference)
- Based on the business, suggest what conditions should map to each lead status:
  - New: Just started conversation
  - Follow Up: Showed interest, needs nurturing
  - Not Interested: Explicitly declined
  - Not Attended: Did not attend scheduled meeting/call
  - Price Issue: Interested but budget concerns
  - Converted: Booked/purchased/signed up

═══════════════════════════════════════════════
RULES FOR EXTRACTION:
═══════════════════════════════════════════════

1. Extract REAL data from the document — do NOT make up services or products that aren't mentioned.
2. If the document mentions pricing tiers, packages, or plans — create separate services for each.
3. Keywords should include common misspellings and regional language terms if applicable.
4. Qualification fields should reflect the actual decision-making criteria for this business domain.
5. If the document is sparse, add a note about what additional information would help (e.g., "Need pricing document for accurate price rules").
6. All output must be in the EXACT JSON format shown above so it can be directly pasted into the CRM configuration.
7. Use Indian Rupee (₹) for currency if the business is India-based, otherwise use appropriate currency.

═══════════════════════════════════════════════
FINAL OUTPUT STRUCTURE:
═══════════════════════════════════════════════

Present your response in this exact structure:

---
## ✅ Company Name
[extracted name]

## ✅ Business Description
[2-4 sentence description]

## ✅ Agent Persona
[persona phrase]

## ✅ Services Catalog
\`\`\`json
[...services array...]
\`\`\`

## ✅ Qualification Fields
\`\`\`json
[...fields array...]
\`\`\`

## ✅ Custom Instructions
[numbered rules as string]

## ✅ Lead Status Mapping
[status conditions table]

## ⚠️ Missing Information (if any)
[list of things not found in the document that would improve configuration]
---

Now analyze the uploaded document and generate the complete AI configuration.`;

const parseServicesOnlyJson = (rawText) => {
  if (!rawText || !rawText.trim()) {
    return { result: null, error: "" };
  }
  const trimmed = rawText.trim();
  let parsed = null;

  // Extract markdown code block if present
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(codeBlockRegex);
  const targetStr = match ? match[1].trim() : trimmed;

  try {
    parsed = JSON.parse(targetStr);
  } catch (errDirect) {
    const firstBracket = targetStr.indexOf("[");
    const lastBracket = targetStr.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        parsed = JSON.parse(targetStr.substring(firstBracket, lastBracket + 1));
      } catch (errSub) {
        return {
          result: null,
          error: `Invalid JSON syntax: ${errDirect.message}`,
        };
      }
    } else {
      const firstBrace = targetStr.indexOf("{");
      const lastBrace = targetStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(targetStr.substring(firstBrace, lastBrace + 1));
        } catch (errSub) {
          return {
            result: null,
            error: `Invalid JSON syntax: ${errDirect.message}`,
          };
        }
      } else {
        return {
          result: null,
          error: `Could not parse JSON. Check commas, brackets and quotes: ${errDirect.message}`,
        };
      }
    }
  }

  let list = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.services)) list = parsed.services;
    else if (Array.isArray(parsed.Services)) list = parsed.Services;
    else if (Array.isArray(parsed.catalog)) list = parsed.catalog;
    else if (Array.isArray(parsed.offerings)) list = parsed.offerings;
  }

  const cleanServices = list
    .filter((s) => s && (typeof s === "string" || s.name))
    .map((s) => {
      if (typeof s === "string") {
        return {
          name: s.trim(),
          description: "",
          keywords: [s.trim().toLowerCase()],
          category: "General",
        };
      }
      let keywords = [];
      if (Array.isArray(s.keywords)) {
        keywords = s.keywords.map((k) => String(k).trim()).filter(Boolean);
      } else if (typeof s.keywords === "string") {
        keywords = s.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
      }
      return {
        name: String(s.name || "").trim(),
        description: String(s.description || "").trim(),
        keywords,
        category: String(s.category || "General").trim(),
      };
    })
    .filter((s) => Boolean(s.name));

  if (cleanServices.length === 0) {
    return {
      result: null,
      error:
        "JSON is valid, but no services with a valid 'name' property were found.",
    };
  }

  return { result: cleanServices, error: "" };
};

const parseQualificationOnlyJson = (rawText) => {
  if (!rawText || !rawText.trim()) {
    return { result: null, error: "" };
  }
  const trimmed = rawText.trim();
  let parsed = null;

  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(codeBlockRegex);
  const targetStr = match ? match[1].trim() : trimmed;

  try {
    parsed = JSON.parse(targetStr);
  } catch (errDirect) {
    const firstBracket = targetStr.indexOf("[");
    const lastBracket = targetStr.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        parsed = JSON.parse(targetStr.substring(firstBracket, lastBracket + 1));
      } catch (errSub) {
        return {
          result: null,
          error: `Invalid JSON syntax: ${errDirect.message}`,
        };
      }
    } else {
      const firstBrace = targetStr.indexOf("{");
      const lastBrace = targetStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(targetStr.substring(firstBrace, lastBrace + 1));
        } catch (errSub) {
          return {
            result: null,
            error: `Invalid JSON syntax: ${errDirect.message}`,
          };
        }
      } else {
        return {
          result: null,
          error: `Could not parse JSON. Check commas, brackets and quotes: ${errDirect.message}`,
        };
      }
    }
  }

  let list = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.qualificationFields))
      list = parsed.qualificationFields;
    else if (Array.isArray(parsed.qualification)) list = parsed.qualification;
    else if (Array.isArray(parsed.fields)) list = parsed.fields;
    else if (Array.isArray(parsed.questions)) list = parsed.questions;
  }

  const cleanFields = list
    .filter((f) => f && (f.key || f.label))
    .map((f) => {
      const rawLabel = String(f.label || f.key || "").trim();
      let rawKey = String(f.key || rawLabel)
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .replace(/^[0-9]/, "_$&");
      if (!rawKey)
        rawKey = "field_" + Math.random().toString(36).substring(2, 7);

      let rawType = String(f.type || "string")
        .toLowerCase()
        .trim();
      if (!["string", "number", "boolean", "select"].includes(rawType)) {
        if (
          rawType.includes("select") ||
          rawType.includes("choice") ||
          rawType.includes("dropdown") ||
          rawType.includes("enum")
        ) {
          rawType = "select";
        } else if (
          rawType.includes("num") ||
          rawType.includes("int") ||
          rawType.includes("score")
        ) {
          rawType = "number";
        } else if (rawType.includes("bool") || rawType.includes("check")) {
          rawType = "boolean";
        } else {
          rawType = "string";
        }
      }

      let options = [];
      if (Array.isArray(f.options)) {
        options = f.options.map((o) => String(o).trim()).filter(Boolean);
      } else if (typeof f.options === "string") {
        options = f.options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }

      return {
        key: rawKey,
        label: rawLabel,
        type: rawType,
        description: String(f.description || "").trim(),
        options,
        required: Boolean(f.required),
      };
    });

  if (cleanFields.length === 0) {
    return {
      result: null,
      error:
        "JSON is valid, but no qualification criteria with a 'label' or 'key' were found.",
    };
  }

  return { result: cleanFields, error: "" };
};

const parseFullConfigJson = (rawText) => {
  if (!rawText || !rawText.trim()) {
    return { result: null, error: "" };
  }
  const trimmed = rawText.trim();
  let parsedObjects = [];

  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  const matches = [...trimmed.matchAll(codeBlockRegex)];

  if (matches.length > 0) {
    for (const m of matches) {
      try {
        parsedObjects.push(JSON.parse(m[1].trim()));
      } catch (e) {}
    }
  }

  if (parsedObjects.length === 0) {
    try {
      parsedObjects.push(JSON.parse(trimmed));
    } catch (errDirect) {
      const firstBrace = trimmed.indexOf("{");
      const lastBrace = trimmed.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsedObjects.push(
            JSON.parse(trimmed.substring(firstBrace, lastBrace + 1)),
          );
        } catch (e) {
          return {
            result: null,
            error: `Invalid JSON syntax: ${errDirect.message}`,
          };
        }
      } else {
        return {
          result: null,
          error: `Could not parse JSON: ${errDirect.message}`,
        };
      }
    }
  }

  let services = [];
  let qualificationFields = [];
  let companyName = "";
  let businessDescription = "";
  let agentPersona = "";
  let customInstructions = "";

  for (const obj of parsedObjects) {
    if (obj && typeof obj === "object") {
      if (Array.isArray(obj.services)) services.push(...obj.services);
      if (Array.isArray(obj.qualificationFields))
        qualificationFields.push(...obj.qualificationFields);
      if (typeof obj.companyName === "string" && obj.companyName.trim())
        companyName = obj.companyName.trim();
      if (
        typeof obj.businessDescription === "string" &&
        obj.businessDescription.trim()
      )
        businessDescription = obj.businessDescription.trim();
      if (typeof obj.agentPersona === "string" && obj.agentPersona.trim())
        agentPersona = obj.agentPersona.trim();
      if (
        typeof obj.customInstructions === "string" &&
        obj.customInstructions.trim()
      )
        customInstructions = obj.customInstructions.trim();
      else if (Array.isArray(obj.customInstructions))
        customInstructions = obj.customInstructions.join("\n");
    }
  }

  const cleanServices =
    parseServicesOnlyJson(JSON.stringify(services)).result || [];
  const cleanFields =
    parseQualificationOnlyJson(JSON.stringify(qualificationFields)).result ||
    [];

  const hasAny =
    cleanServices.length > 0 ||
    cleanFields.length > 0 ||
    Boolean(companyName) ||
    Boolean(businessDescription) ||
    Boolean(agentPersona) ||
    Boolean(customInstructions);

  if (!hasAny) {
    return {
      result: null,
      error: "No matching AI configuration fields found in the provided JSON.",
    };
  }

  return {
    result: {
      services: cleanServices,
      qualificationFields: cleanFields,
      companyName,
      businessDescription,
      agentPersona,
      customInstructions,
    },
    error: "",
  };
};

export default function OrganizationProfile() {
  const navigate = useNavigate();
  const {
    currentUser,
    organization: cachedOrg,
    setOrganization,
    fetchOrganization,
    isManager: authIsManager,
  } = useAuth();

  const isAuthorized =
    authIsManager ||
    currentUser?.role === "Sales Manager" ||
    currentUser?.role === "Super Admin" ||
    currentUser?.isOrgOwner;

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  const { openSupportModal } = useSupportModal();

  // Primary Navigation: "wizard" | "billing"
  const [activeTab, setActiveTab] = useState("wizard");
  const [currentStep, setCurrentStep] = useState(1);
  const stepperScrollRef = useRef(null);

  useEffect(() => {
    if (stepperScrollRef.current) {
      const activeBtn = stepperScrollRef.current.querySelector(
        '[aria-selected="true"]'
      );
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentStep]);

  // Data States
  const [orgData, setOrgData] = useState(cachedOrg || null);
  const [loading, setLoading] = useState(false);

  // AI Configuration State - Brand Name auto-initialized from organization
  const [aiSettings, setAiSettings] = useState(() => {
    const initialBrandName =
      cachedOrg?.name || currentUser?.organizationName || "";
    return {
      geminiApiKey: "",
      isAiConfigured: false,
      aiSetupCompletedAt: null,
      companyName: initialBrandName,
      businessDescription: "",
      agentPersona: "warm, friendly, and consultative sales representative",
      customInstructions: `1. STRICT PRICING: Never guess or quote fixed prices without technical requirements assessment. State that pricing depends on specifications and schedule a callback.\n2. PACING: Ask at most 1-2 questions per message to avoid overwhelming the customer.\n3. HUMAN HANDOFF: If the user asks for a real human, politely acknowledge and transfer them immediately.\n4. FORMATTING: Keep messages under 50-60 words with clean WhatsApp bold (*word*) and friendly emojis.`,
      services: [DEFAULT_SERVICE_TEMPLATE],
      qualificationFields: DEFAULT_QUALIFICATION_FIELDS,
      qdrantCollection: "",
      knowledgeDocs: [],
      welcomeMessageTemplate: "",
      welcomeMessageFallbackService: "",
      missedCallMessageEnabled: true,
      missedCallMessageTemplate: "",
      missedCallDifferentNumberTemplate: "",
      serviceImagesAutoSendEnabled: true,
      dailyAiUsage: {
        date: new Date().toISOString().slice(0, 10),
        chatApiCalls: 0,
        audioApiCalls: 0,
        totalApiCalls: 0,
        dailyQuotaLimit: 1500,
        lastResetAt: new Date().toISOString(),
      },
    };
  });

  const [aiSaving, setAiSaving] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const [serviceFormError, setServiceFormError] = useState("");
  const [fieldFormError, setFieldFormError] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState(null);
  const geminiKeyLooksValid = /^AIza[\w-]{10,}$/.test((aiSettings.geminiApiKey || "").trim());
  const [refreshingUsage, setRefreshingUsage] = useState(false);
  const [resetCountdown, setResetCountdown] = useState("");
  const [showEditLimitModal, setShowEditLimitModal] = useState(false);
  const [customDailyLimit, setCustomDailyLimit] = useState(1500);
  const [quotaLimitError, setQuotaLimitError] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);
  const [missedCallEditingTab, setMissedCallEditingTab] = useState("diff");
  const [missedCallPreviewTab, setMissedCallPreviewTab] = useState("diff");
  const [customerMessagePreviewTab, setCustomerMessagePreviewTab] = useState("welcome");

  // Format WhatsApp markdown (*bold* and newlines) for live preview
  const renderFormattedWhatsAppText = (text) => {
    if (!text) return "";
    const lines = String(text).split("\n");
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*[^\*]+\*)/g);
      return (
        <React.Fragment key={lIdx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
              return (
                <strong key={pIdx} className="font-bold text-white">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            return part;
          })}
          {lIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  // Replace placeholders with realistic customer preview values
  const getWhatsAppPreviewText = (template, type = "welcome") => {
    let text = template || "";
    const company = aiSettings.companyName?.trim() || orgData?.name || cachedOrg?.name || "Our Business";
    const service =
      aiSettings.welcomeMessageFallbackService?.trim() ||
      aiSettings.services?.[0]?.name ||
      "Consultation";
    const phone = orgData?.mobile || cachedOrg?.mobile || "+91 98765 43210";
    return text
      .replace(/\{\{name\}\}/gi, "Rahul Sharma")
      .replace(/\{\{company\}\}/gi, company)
      .replace(/\{\{service\}\}/gi, service)
      .replace(/\{\{number\}\}/gi, phone);
  };

  // Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    keywords: "",
    images: [],
    sendImagesEnabled: true,
  });
  const [serviceImageUploading, setServiceImageUploading] = useState(false);

  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [newField, setNewField] = useState({
    key: "",
    label: "",
    type: "string",
    description: "",
    options: "",
    required: false,
  });

  // Dedicated Import Modals State
  const [showServicesImportModal, setShowServicesImportModal] = useState(false);
  const [servicesImportText, setServicesImportText] = useState("");
  const [servicesImportMergeStrategy, setServicesImportMergeStrategy] =
    useState("replace");
  const [servicesParsedResult, setServicesParsedResult] = useState(null);
  const [servicesParseError, setServicesParseError] = useState("");
  const [copiedServicesJson, setCopiedServicesJson] = useState(false);

  const [showQualificationImportModal, setShowQualificationImportModal] =
    useState(false);
  const [qualificationImportText, setQualificationImportText] = useState("");
  const [
    qualificationImportMergeStrategy,
    setQualificationImportMergeStrategy,
  ] = useState("replace");
  const [qualificationParsedResult, setQualificationParsedResult] =
    useState(null);
  const [qualificationParseError, setQualificationParseError] = useState("");
  const [copiedQualificationJson, setCopiedQualificationJson] = useState(false);

  // AI Extraction & Guidance Modal State
  const [showAiGuidanceModal, setShowAiGuidanceModal] = useState(false);
  const [guidanceTab, setGuidanceTab] = useState("prompt"); // "prompt" | "steps" | "fullImport"
  const [copiedExtractionPrompt, setCopiedExtractionPrompt] = useState(false);
  const [copiedQuickPrompt, setCopiedQuickPrompt] = useState(false);

  const [fullConfigImportText, setFullConfigImportText] = useState("");
  const [fullConfigParsedResult, setFullConfigParsedResult] = useState(null);
  const [fullConfigParseError, setFullConfigParseError] = useState("");
  const [fullConfigMergeStrategy, setFullConfigMergeStrategy] =
    useState("replace");

  // Knowledge base upload
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showPromptInspector, setShowPromptInspector] = useState(false);
  const [activationResultModal, setActivationResultModal] = useState(null);

  // Destructive Action Confirmation States
  const [deleteServiceTarget, setDeleteServiceTarget] = useState(null); // { index, service }
  const [deleteFieldTarget, setDeleteFieldTarget] = useState(null); // { index, field }
  const [deleteDocTarget, setDeleteDocTarget] = useState(null); // { docId, filename }

  const isManager =
    currentUser?.role === "Sales Manager" ||
    currentUser?.role === "Super Admin" ||
    currentUser?.isOrgOwner;

  // 1. Fetch Organization Details
  const fetchOrganizationProfile = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.get(API_ENDPOINTS.ORGANIZATIONS.MY_ORG, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.data) {
        setOrgData(res.data.data);
        if (setOrganization) setOrganization(res.data.data);
        localStorage.setItem(
          "salesbuster_session_org",
          JSON.stringify(res.data.data),
        );
        localStorage.setItem(
          "kranthi_session_org",
          JSON.stringify(res.data.data),
        );

        if (res.data.data.name) {
          setAiSettings((prev) => ({
            ...prev,
            companyName: prev.companyName?.trim()
              ? prev.companyName
              : res.data.data.name,
          }));
        }

        if (res.data.data.aiSettings) {
          syncAiSettingsState(res.data.data.aiSettings, res.data.data.name);
        }
      }
    } catch (err) {
      if (cachedOrg) setOrgData(cachedOrg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch AI Settings with local fallback
  const fetchAISettings = async () => {
    const orgId = orgData?._id || cachedOrg?._id || "default";
    const localCached = localStorage.getItem(`sb_ai_settings_${orgId}`);

    if (localCached) {
      try {
        const parsed = JSON.parse(localCached);
        syncAiSettingsState(parsed, orgData?.name || cachedOrg?.name);
      } catch (e) {}
    }

    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.get(API_ENDPOINTS.ORGANIZATIONS.AI_SETTINGS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.data) {
        syncAiSettingsState(res.data.data, orgData?.name || cachedOrg?.name);
        localStorage.setItem(
          `sb_ai_settings_${orgId}`,
          JSON.stringify(res.data.data),
        );
      }
    } catch (err) {
      // Backend route might still be deploying, local state remains fully functional
    }
  };

  const syncAiSettingsState = (data, orgName) => {
    setAiSettings((prev) => {
      // Filter out legacy elevator/preset services, keep clean services or default to General Enquiry
      const cleanServices =
        Array.isArray(data?.services) && data.services.length > 0
          ? data.services
          : Array.isArray(prev.services) && prev.services.length > 0
            ? prev.services
            : [DEFAULT_SERVICE_TEMPLATE];

      const cleanFields =
        Array.isArray(data?.qualificationFields) &&
        data.qualificationFields.length > 0
          ? data.qualificationFields
          : Array.isArray(prev.qualificationFields) &&
              prev.qualificationFields.length > 0
            ? prev.qualificationFields
            : DEFAULT_QUALIFICATION_FIELDS;

      const autoBrandName =
        (data?.companyName && data.companyName.trim()) ||
        (prev.companyName && prev.companyName.trim()) ||
        orgName ||
        orgData?.name ||
        cachedOrg?.name ||
        currentUser?.organizationName ||
        "";

      return {
        ...prev,
        geminiApiKey:
          data?.geminiApiKey !== undefined
            ? data.geminiApiKey
            : prev.geminiApiKey || "",
        isAiConfigured: Boolean(data?.isAiConfigured ?? prev.isAiConfigured),
        aiSetupCompletedAt: data?.aiSetupCompletedAt || prev.aiSetupCompletedAt,
        companyName: autoBrandName,
        businessDescription:
          data?.businessDescription || prev.businessDescription || "",
        agentPersona: data?.agentPersona || prev.agentPersona,
        customInstructions: data?.customInstructions || prev.customInstructions,
        services: cleanServices,
        qualificationFields: cleanFields,
        qdrantCollection: data?.qdrantCollection || prev.qdrantCollection,
        knowledgeDocs: Array.isArray(data?.knowledgeDocs)
          ? data.knowledgeDocs
          : prev.knowledgeDocs,
        welcomeMessageTemplate:
          data?.welcomeMessageTemplate !== undefined
            ? data.welcomeMessageTemplate
            : prev.welcomeMessageTemplate || "",
        welcomeMessageFallbackService:
          data?.welcomeMessageFallbackService !== undefined
            ? data.welcomeMessageFallbackService
            : prev.welcomeMessageFallbackService || "",
        missedCallMessageEnabled:
          data?.missedCallMessageEnabled !== undefined
            ? data.missedCallMessageEnabled
            : prev.missedCallMessageEnabled !== undefined
              ? prev.missedCallMessageEnabled
              : true,
        missedCallMessageTemplate:
          data?.missedCallMessageTemplate !== undefined
            ? data.missedCallMessageTemplate
            : prev.missedCallMessageTemplate || "",
        missedCallDifferentNumberTemplate:
          data?.missedCallDifferentNumberTemplate !== undefined
            ? data.missedCallDifferentNumberTemplate
            : prev.missedCallDifferentNumberTemplate || "",
        serviceImagesAutoSendEnabled:
          data?.serviceImagesAutoSendEnabled !== undefined
            ? data.serviceImagesAutoSendEnabled
            : prev.serviceImagesAutoSendEnabled !== undefined
              ? prev.serviceImagesAutoSendEnabled
              : true,
        dailyAiUsage: data?.dailyAiUsage ||
          prev.dailyAiUsage || {
            date: new Date().toISOString().slice(0, 10),
            chatApiCalls: 0,
            audioApiCalls: 0,
            totalApiCalls: 0,
            dailyQuotaLimit: 1500,
            lastResetAt: new Date().toISOString(),
          },
      };
    });
  };

  // Live countdown to midnight UTC for daily API quota renewal
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0,
        ),
      );
      const diffMs = Math.max(0, tomorrow - now);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setResetCountdown(`${hours}h ${mins}m`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshAiUsage = async () => {
    setRefreshingUsage(true);
    await fetchAISettings();
    setTimeout(() => setRefreshingUsage(false), 500);
  };

  const handleUpdateDailyLimit = async (newLimit) => {
    const targetLimit = Number(newLimit !== undefined ? newLimit : customDailyLimit);
    if (!Number.isInteger(targetLimit) || targetLimit < 100 || targetLimit > 100000) {
      setQuotaLimitError("Enter a whole number between 100 and 100,000 calls per day.");
      return;
    }
    setQuotaLimitError("");
    setSavingLimit(true);
    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.put(
        API_ENDPOINTS.ORGANIZATIONS.AI_SETTINGS,
        { dailyQuotaLimit: targetLimit },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        setAiSettings((prev) => ({
          ...prev,
          dailyAiUsage: {
            ...(prev.dailyAiUsage || {}),
            dailyQuotaLimit: targetLimit,
          },
        }));
        const orgId = orgData?._id || cachedOrg?._id || "default";
        const localCached = localStorage.getItem(`sb_ai_settings_${orgId}`);
        if (localCached) {
          try {
            const parsedCache = JSON.parse(localCached);
            parsedCache.dailyAiUsage = {
              ...(parsedCache.dailyAiUsage || {}),
              dailyQuotaLimit: targetLimit,
            };
            localStorage.setItem(
              `sb_ai_settings_${orgId}`,
              JSON.stringify(parsedCache),
            );
          } catch (e) {}
        }
        setSaveToast(
          `Daily AI API limit successfully updated to ${targetLimit.toLocaleString()} calls/day.`,
        );
        setShowEditLimitModal(false);
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to update daily AI API limit.",
      );
    } finally {
      setSavingLimit(false);
    }
  };

  // Automatically fill brand name from organization when available
  useEffect(() => {
    const orgBrand =
      orgData?.name || cachedOrg?.name || currentUser?.organizationName || "";
    if (orgBrand) {
      setAiSettings((prev) => {
        if (!prev.companyName || !prev.companyName.trim()) {
          return { ...prev, companyName: orgBrand };
        }
        return prev;
      });
    }
  }, [orgData?.name, cachedOrg?.name, currentUser?.organizationName]);

  useEffect(() => {
    fetchOrganizationProfile();
    fetchAISettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal Escape key dismissal & body scroll lock
  useEffect(() => {
    const isAnyModalOpen =
      showAddServiceModal ||
      showAddFieldModal ||
      showServicesImportModal ||
      showQualificationImportModal ||
      showAiGuidanceModal ||
      showEditLimitModal ||
      Boolean(activationResultModal) ||
      showPromptInspector ||
      Boolean(deleteServiceTarget) ||
      Boolean(deleteFieldTarget) ||
      Boolean(deleteDocTarget);

    if (!isAnyModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowAddServiceModal(false);
        setShowAddFieldModal(false);
        setShowServicesImportModal(false);
        setShowQualificationImportModal(false);
        setShowAiGuidanceModal(false);
        setShowEditLimitModal(false);
        setActivationResultModal(null);
        setShowPromptInspector(false);
        setDeleteServiceTarget(null);
        setDeleteFieldTarget(null);
        setDeleteDocTarget(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [
    showAddServiceModal,
    showAddFieldModal,
    showServicesImportModal,
    showQualificationImportModal,
    showAiGuidanceModal,
    showEditLimitModal,
    activationResultModal,
    showPromptInspector,
    deleteServiceTarget,
    deleteFieldTarget,
    deleteDocTarget,
  ]);

  // Save changes handler
  const handleSaveStep = async (overrideData = null, nextStep = null) => {
    setAiSaving(true);
    const orgId = orgData?._id || cachedOrg?._id || "default";
    const payload = overrideData || aiSettings;

    // Immediately persist locally
    localStorage.setItem(`sb_ai_settings_${orgId}`, JSON.stringify(payload));

    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.put(
        API_ENDPOINTS.ORGANIZATIONS.AI_SETTINGS,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.success) {
        if (payload.isAiConfigured) {
          setAiSettings((prev) => ({ ...prev, isAiConfigured: true }));
        }
        if (fetchOrganization) fetchOrganization();
        setSaveToast(
          payload.isAiConfigured
            ? "🎉 AI Setup completed and activated!"
            : "Configuration saved successfully!",
        );
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Changes saved locally to your workspace!";
      setSaveToast(errMsg);
    } finally {
      setAiSaving(false);
      window.setTimeout(() => setSaveToast(""), 6000);

      if (nextStep && nextStep <= STEPS.length) {
        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Test Gemini API Key handler
  const handleTestApiKey = async () => {
    if (!aiSettings.geminiApiKey || !aiSettings.geminiApiKey.trim()) {
      setKeyTestResult({
        success: false,
        message: "Please enter your Google Gemini API key first.",
      });
      return;
    }

    setTestingKey(true);
    setKeyTestResult(null);

    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.post(
        API_ENDPOINTS.ORGANIZATIONS.VALIDATE_GEMINI_KEY,
        { apiKey: aiSettings.geminiApiKey.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setKeyTestResult({
          success: true,
          message: "API Key verified successfully with Google Gemini!",
        });
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Failed to validate API Key. Please verify that it is active in Google AI Studio.";
      setKeyTestResult({
        success: false,
        message: errMsg,
      });
    } finally {
      setTestingKey(false);
    }
  };

  // Final step activation handler
  const handleFinishSetup = async () => {
    const missing = [];
    if (!aiSettings.companyName || !aiSettings.companyName.trim()) {
      missing.push({
        step: 1,
        field: "Company / Brand Name",
        detail: "Provide your company name in Step 1.",
      });
    }
    if (!aiSettings.geminiApiKey || !aiSettings.geminiApiKey.trim()) {
      missing.push({
        step: 2,
        field: "Google Gemini API Key",
        detail: "Configure and test your Gemini API key in Step 2.",
      });
    }
    if (!aiSettings.services || aiSettings.services.length === 0) {
      missing.push({
        step: 3,
        field: "Catalog Offerings",
        detail: "Add at least 1 product or service offering in Step 3.",
      });
    }
    if (
      !aiSettings.qualificationFields ||
      aiSettings.qualificationFields.length === 0
    ) {
      missing.push({
        step: 4,
        field: "Lead Qualification Questions",
        detail: "Add at least 1 lead qualification question in Step 4.",
      });
    }

    if (missing.length > 0) {
      setActivationResultModal({
        success: false,
        title: "Activation Incomplete",
        message:
          "Your AI assistant cannot be activated yet because some required setup steps are missing.",
        errors: missing,
      });
      return;
    }

    setAiSaving(true);
    const orgId = orgData?._id || cachedOrg?._id || "default";
    const payload = {
      ...aiSettings,
      isAiConfigured: true,
    };

    localStorage.setItem(`sb_ai_settings_${orgId}`, JSON.stringify(payload));

    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.put(
        API_ENDPOINTS.ORGANIZATIONS.AI_SETTINGS,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        setAiSettings((prev) => ({ ...prev, isAiConfigured: true }));
        if (fetchOrganization) await fetchOrganization();
        setActivationResultModal({
          success: true,
          title: "AI Sales Pilot Activated Successfully!",
          message: `Your AI assistant for "${aiSettings.companyName}" is now active and ready to handle customer inquiries on WhatsApp.`,
          details: {
            brandName: aiSettings.companyName,
            servicesCount: aiSettings.services.length,
            questionsCount: aiSettings.qualificationFields.length,
          },
        });
      } else {
        setActivationResultModal({
          success: false,
          title: "Activation Failed",
          message:
            res.data.message ||
            "Failed to save AI configuration to your organization.",
          errors: [
            {
              field: "Server Error",
              detail: res.data.message || "An unexpected error occurred.",
            },
          ],
        });
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not connect to the server to activate your AI configuration.";
      setActivationResultModal({
        success: false,
        title: "Activation Failed",
        message: errMsg,
        errors: [{ field: "Server Error", detail: errMsg }],
      });
    } finally {
      setAiSaving(false);
    }
  };

  // Service Management
  const handleOpenAddServiceModal = () => {
    setServiceFormError("");
    setEditingServiceIndex(null);
    setNewService({
      name: "",
      description: "",
      keywords: "",
      images: [],
      sendImagesEnabled: true,
    });
    setShowAddServiceModal(true);
  };

  const handleOpenEditServiceModal = (index) => {
    setServiceFormError("");
    const svc = aiSettings.services[index];
    if (!svc) return;
    setEditingServiceIndex(index);
    setNewService({
      name: svc.name || "",
      description: svc.description || "",
      keywords: Array.isArray(svc.keywords)
        ? svc.keywords.join(", ")
        : svc.keywords || "",
      sendImagesEnabled: svc.sendImagesEnabled !== false,
      images: Array.isArray(svc.images)
        ? svc.images.map((img) => ({
            url: img.url || "",
            title: img.title || "",
            description: img.description || "",
          }))
        : [],
    });
    setShowAddServiceModal(true);
  };

  const handleSaveService = () => {
    const keywordsArr =
      typeof newService.keywords === "string"
        ? newService.keywords.split(",").map((k) => k.trim()).filter(Boolean)
        : Array.isArray(newService.keywords) ? newService.keywords : [];
    if (newService.name.trim().length < 2) {
      setServiceFormError("Enter a service name with at least 2 characters.");
      return;
    }
    if (!newService.description.trim()) {
      setServiceFormError("Add a short description for this service.");
      return;
    }
    if (!keywordsArr.length) {
      setServiceFormError("Add at least one keyword to help AI recognize this service.");
      return;
    }
    setServiceFormError("");

    const serviceObj = {
      name: newService.name.trim(),
      description: newService.description.trim(),
      keywords: keywordsArr,
      sendImagesEnabled: newService.sendImagesEnabled !== false,
      images: Array.isArray(newService.images) ? newService.images : [],
    };

    let updated;
    if (
      editingServiceIndex !== null &&
      editingServiceIndex >= 0 &&
      editingServiceIndex < aiSettings.services.length
    ) {
      updated = [...aiSettings.services];
      updated[editingServiceIndex] = serviceObj;
    } else {
      updated = [...aiSettings.services, serviceObj];
    }

    setAiSettings({ ...aiSettings, services: updated });
    setNewService({
      name: "",
      description: "",
      keywords: "",
      images: [],
      sendImagesEnabled: true,
    });
    setEditingServiceIndex(null);
    setShowAddServiceModal(false);
    handleSaveStep({ ...aiSettings, services: updated });
  };

  const handleAddService = handleSaveService;

  const handleRemoveService = (index) => {
    const service = aiSettings.services[index];
    setDeleteServiceTarget({ index, service });
  };

  const handleConfirmDeleteService = () => {
    if (!deleteServiceTarget) return;
    const { index } = deleteServiceTarget;
    const updated = aiSettings.services.filter((_, i) => i !== index);
    setAiSettings({ ...aiSettings, services: updated });
    handleSaveStep({ ...aiSettings, services: updated });
    setDeleteServiceTarget(null);
  };

  const handleServiceImageUpload = async (e) => {
    const fileList = e?.target?.files;
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    setServiceImageUploading(true);
    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");

      const formData = new FormData();
      for (const file of files) {
        formData.append("images", file);
      }

      const res = await axios.post(
        API_ENDPOINTS.ORGANIZATIONS.SERVICE_IMAGE_UPLOAD,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      let uploadedImages = [];
      if (res.data?.success) {
        if (Array.isArray(res.data.images) && res.data.images.length > 0) {
          uploadedImages = res.data.images.map((img) => ({
            url: img.url,
            title:
              img.title || img.originalName?.replace(/\.[^/.]+$/, "") || "",
            description: "",
          }));
        } else if (res.data.url) {
          uploadedImages = [
            {
              url: res.data.url,
              title: files[0]?.name?.replace(/\.[^/.]+$/, "") || "",
              description: "",
            },
          ];
        }
      }

      if (uploadedImages.length > 0) {
        setNewService((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedImages],
        }));
      }
    } catch (err) {
      console.error("Failed to upload service image:", err);
      alert(
        err.response?.data?.message ||
          "Failed to upload service image. Please try again.",
      );
    } finally {
      setServiceImageUploading(false);
      try {
        if (e?.target) e.target.value = "";
      } catch (_) {}
    }
  };

  const handleUpdateServiceImageDesc = (imgIdx, desc) => {
    setNewService((prev) => {
      const copy = [...(prev.images || [])];
      if (copy[imgIdx]) {
        copy[imgIdx] = { ...copy[imgIdx], description: desc };
      }
      return { ...prev, images: copy };
    });
  };

  const handleRemoveServiceImage = (imgIdx) => {
    setNewService((prev) => {
      const copy = [...(prev.images || [])];
      copy.splice(imgIdx, 1);
      return { ...prev, images: copy };
    });
  };

  // Field Management
  const handleEditField = (index) => {
    setFieldFormError("");
    const f = aiSettings.qualificationFields[index];
    if (!f) return;
    setEditingFieldIndex(index);
    setNewField({
      key: f.key || "",
      label: f.label || "",
      type: f.type || "string",
      description: f.description || "",
      options: Array.isArray(f.options)
        ? f.options.join(", ")
        : f.options || "",
      required: Boolean(f.required),
    });
    setShowAddFieldModal(true);
  };

  const handleAddField = () => {
    if (!newField.label.trim()) {
      setFieldFormError("Enter a question label.");
      return;
    }
    if (!newField.key.trim()) {
      setFieldFormError("Enter a field key.");
      return;
    }
    if (newField.type === "select" && !newField.options.split(",").some((option) => option.trim())) {
      setFieldFormError("Add at least one choice for this dropdown.");
      return;
    }
    setFieldFormError("");
    const cleanKey = newField.key
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[0-9]/, "_$&");

    const optionsArr = newField.options
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const fieldObj = {
      key: cleanKey,
      label: newField.label.trim(),
      type: newField.type,
      description: newField.description.trim(),
      options: optionsArr,
      required: newField.required,
    };

    let updated;
    if (
      editingFieldIndex !== null &&
      editingFieldIndex >= 0 &&
      editingFieldIndex < aiSettings.qualificationFields.length
    ) {
      updated = [...aiSettings.qualificationFields];
      updated[editingFieldIndex] = fieldObj;
    } else {
      updated = [...aiSettings.qualificationFields, fieldObj];
    }

    setAiSettings({ ...aiSettings, qualificationFields: updated });
    setNewField({
      key: "",
      label: "",
      type: "string",
      description: "",
      options: "",
      required: false,
    });
    setEditingFieldIndex(null);
    setShowAddFieldModal(false);
    handleSaveStep({ ...aiSettings, qualificationFields: updated });
  };

  const handleRemoveField = (index) => {
    const field = aiSettings.qualificationFields[index];
    setDeleteFieldTarget({ index, field });
  };

  const handleConfirmDeleteField = () => {
    if (!deleteFieldTarget) return;
    const { index } = deleteFieldTarget;
    const updated = aiSettings.qualificationFields.filter(
      (_, i) => i !== index,
    );
    setAiSettings({ ...aiSettings, qualificationFields: updated });
    handleSaveStep({ ...aiSettings, qualificationFields: updated });
    setDeleteFieldTarget(null);
  };

  // Services Dedicated JSON Handlers
  const openServicesImportModal = () => {
    setServicesImportText("");
    setServicesParsedResult(null);
    setServicesParseError("");
    setServicesImportMergeStrategy("replace");
    setShowServicesImportModal(true);
  };

  const handleServicesTextChange = (text) => {
    setServicesImportText(text);
    if (!text.trim()) {
      setServicesParsedResult(null);
      setServicesParseError("");
      return;
    }
    const { result, error } = parseServicesOnlyJson(text);
    setServicesParsedResult(result);
    setServicesParseError(error);
  };

  const handleApplyServicesImport = async () => {
    if (!servicesParsedResult || servicesParsedResult.length === 0) return;

    let updatedServices = [...aiSettings.services];
    if (servicesImportMergeStrategy === "replace") {
      updatedServices = servicesParsedResult;
    } else {
      const existingNames = new Set(
        updatedServices.map((s) => s.name.toLowerCase().trim()),
      );
      for (const s of servicesParsedResult) {
        if (!existingNames.has(s.name.toLowerCase().trim())) {
          updatedServices.push(s);
          existingNames.add(s.name.toLowerCase().trim());
        }
      }
    }

    const updatedSettings = {
      ...aiSettings,
      services: updatedServices,
    };

    setAiSettings(updatedSettings);
    await handleSaveStep(updatedSettings);

    setShowServicesImportModal(false);
    setServicesImportText("");
    setServicesParsedResult(null);

    setSaveToast(
      `🎉 Successfully imported and saved ${servicesParsedResult.length} services!`,
    );
  };

  const handleCopyServicesJson = () => {
    navigator.clipboard.writeText(
      JSON.stringify(aiSettings.services || [], null, 2),
    );
    setCopiedServicesJson(true);
    setTimeout(() => setCopiedServicesJson(false), 2000);
  };

  // Qualification Criteria Dedicated JSON Handlers
  const openQualificationImportModal = () => {
    setQualificationImportText("");
    setQualificationParsedResult(null);
    setQualificationParseError("");
    setQualificationImportMergeStrategy("replace");
    setShowQualificationImportModal(true);
  };

  const handleQualificationTextChange = (text) => {
    setQualificationImportText(text);
    if (!text.trim()) {
      setQualificationParsedResult(null);
      setQualificationParseError("");
      return;
    }
    const { result, error } = parseQualificationOnlyJson(text);
    setQualificationParsedResult(result);
    setQualificationParseError(error);
  };

  const handleApplyQualificationImport = async () => {
    if (!qualificationParsedResult || qualificationParsedResult.length === 0)
      return;

    let updatedFields = [...aiSettings.qualificationFields];
    if (qualificationImportMergeStrategy === "replace") {
      updatedFields = qualificationParsedResult;
    } else {
      const existingKeys = new Set(
        updatedFields.map((f) => f.key.toLowerCase().trim()),
      );
      for (const f of qualificationParsedResult) {
        if (!existingKeys.has(f.key.toLowerCase().trim())) {
          updatedFields.push(f);
          existingKeys.add(f.key.toLowerCase().trim());
        }
      }
    }

    const updatedSettings = {
      ...aiSettings,
      qualificationFields: updatedFields,
    };

    setAiSettings(updatedSettings);
    await handleSaveStep(updatedSettings);

    setShowQualificationImportModal(false);
    setQualificationImportText("");
    setQualificationParsedResult(null);

    setSaveToast(
      `🎉 Successfully imported and saved ${qualificationParsedResult.length} qualification questions!`,
    );
  };

  const handleCopyQualificationJson = () => {
    navigator.clipboard.writeText(
      JSON.stringify(aiSettings.qualificationFields || [], null, 2),
    );
    setCopiedQualificationJson(true);
    setTimeout(() => setCopiedQualificationJson(false), 2000);
  };

  // Guidance Prompt Copy Handlers
  const handleCopyExtractionPrompt = () => {
    navigator.clipboard.writeText(AI_EXTRACTION_SYSTEM_PROMPT);
    setCopiedExtractionPrompt(true);
    setTimeout(() => setCopiedExtractionPrompt(false), 2500);
  };

  const handleCopyQuickPrompt = () => {
    navigator.clipboard.writeText(AI_EXTRACTION_SYSTEM_PROMPT);
    setCopiedQuickPrompt(true);
    setTimeout(() => setCopiedQuickPrompt(false), 2500);
  };

  // Full Config Importer inside Guidance Modal
  const handleFullConfigTextChange = (text) => {
    setFullConfigImportText(text);
    if (!text.trim()) {
      setFullConfigParsedResult(null);
      setFullConfigParseError("");
      return;
    }
    const { result, error } = parseFullConfigJson(text);
    setFullConfigParsedResult(result);
    setFullConfigParseError(error);
  };

  const handleApplyFullConfigImport = async () => {
    if (!fullConfigParsedResult) return;

    const {
      services: importedServices,
      qualificationFields: importedFields,
      companyName,
      businessDescription,
      agentPersona,
      customInstructions,
    } = fullConfigParsedResult;

    let updatedServices = [...aiSettings.services];
    let updatedFields = [...aiSettings.qualificationFields];

    if (importedServices && importedServices.length > 0) {
      if (fullConfigMergeStrategy === "replace") {
        updatedServices = importedServices;
      } else {
        const existingNames = new Set(
          updatedServices.map((s) => s.name.toLowerCase().trim()),
        );
        for (const s of importedServices) {
          if (!existingNames.has(s.name.toLowerCase().trim())) {
            updatedServices.push(s);
            existingNames.add(s.name.toLowerCase().trim());
          }
        }
      }
    }

    if (importedFields && importedFields.length > 0) {
      if (fullConfigMergeStrategy === "replace") {
        updatedFields = importedFields;
      } else {
        const existingKeys = new Set(
          updatedFields.map((f) => f.key.toLowerCase().trim()),
        );
        for (const f of importedFields) {
          if (!existingKeys.has(f.key.toLowerCase().trim())) {
            updatedFields.push(f);
            existingKeys.add(f.key.toLowerCase().trim());
          }
        }
      }
    }

    const updatedSettings = {
      ...aiSettings,
      services: updatedServices,
      qualificationFields: updatedFields,
    };

    if (companyName) updatedSettings.companyName = companyName;
    if (businessDescription)
      updatedSettings.businessDescription = businessDescription;
    if (agentPersona) updatedSettings.agentPersona = agentPersona;
    if (customInstructions)
      updatedSettings.customInstructions = customInstructions;

    setAiSettings(updatedSettings);
    await handleSaveStep(updatedSettings);

    setShowAiGuidanceModal(false);
    setFullConfigImportText("");
    setFullConfigParsedResult(null);

    setSaveToast(
      `🎉 Full AI configuration applied successfully (${importedServices.length} services, ${importedFields.length} criteria)!`,
    );
  };

  // Knowledge base file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!aiSettings.geminiApiKey?.trim()) {
      alert(
        "Please configure and save your Google Gemini API Key in Step 2 first. Gemini embeddings are required to index documents into Qdrant.",
      );
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingDoc(true);
    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.post(
        API_ENDPOINTS.ORGANIZATIONS.KNOWLEDGE_UPLOAD,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data.success) {
        await fetchAISettings();
        const chunkCount = res.data.data?.chunkCount || "vector";
        setSaveToast(
          `🎉 Document "${file.name}" indexed successfully into Qdrant (${chunkCount} chunks)!`,
        );
      }
    } catch (err) {
      console.error("Knowledge upload failed:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Document indexing into Qdrant failed.";
      alert(`Upload Failed: ${errMsg}`);
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleDeleteDoc = (docId) => {
    const doc = (aiSettings.knowledgeDocs || []).find((d) => d.docId === docId);
    setDeleteDocTarget({
      docId,
      filename: doc?.filename || "Document",
    });
  };

  const handleConfirmDeleteDoc = async () => {
    if (!deleteDocTarget) return;
    const { docId } = deleteDocTarget;
    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      await axios.delete(API_ENDPOINTS.ORGANIZATIONS.KNOWLEDGE_DELETE(docId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAISettings();
    } catch (err) {
      const updatedDocs = aiSettings.knowledgeDocs.filter(
        (d) => d.docId !== docId,
      );
      setAiSettings({ ...aiSettings, knowledgeDocs: updatedDocs });
      handleSaveStep({ ...aiSettings, knowledgeDocs: updatedDocs });
    } finally {
      setDeleteDocTarget(null);
    }
  };

  const copyPromptText = () => {
    const text = `You are a ${aiSettings.agentPersona} working at ${aiSettings.companyName || org.name || "Our Company"}.\n\nCOMPANY OVERVIEW:\n${aiSettings.businessDescription}\n\nCORE PRODUCTS:\n${aiSettings.services.map((s, i) => `${i + 1}. ${s.name} - ${s.description}`).join("\n")}\n\nCRITICAL RULES:\n${aiSettings.customInstructions}`;
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!isManager) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-12">
        <div className="bg-bg-card border border-border-main rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            Access Restricted
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Only designated Organization Managers have permission to configure
            the AI sales engine and view licensing.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-pilot-blue hover:bg-pilot-blue-hover text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const org = orgData || cachedOrg || {};
  const totalSeats = org.seats || 1;
  const usedSeats = org.usedSeats || 0;
  const remainingSeats = Math.max(0, totalSeats - usedSeats);
  const seatPercentage = Math.min(
    100,
    Math.round((usedSeats / Math.max(1, totalSeats)) * 100),
  );

  const isExpired =
    org.isExpired ||
    (org.subscriptionEndDate && new Date(org.subscriptionEndDate) < new Date());

  const remainingDays =
    org.remainingDays ??
    (org.subscriptionEndDate
      ? Math.ceil(
          (new Date(org.subscriptionEndDate) - new Date()) /
            (1000 * 60 * 60 * 24),
        )
      : null);

  const renderDailyAiUsageCard = (compact = false) => {
    const dailyUsage = aiSettings.dailyAiUsage || {
      date: new Date().toISOString().slice(0, 10),
      chatApiCalls: 0,
      audioApiCalls: 0,
      totalApiCalls: 0,
      dailyQuotaLimit: 1500,
    };
    const chatCalls = Number(dailyUsage.chatApiCalls) || 0;
    const audioCalls = Number(dailyUsage.audioApiCalls) || 0;
    const totalCalls =
      dailyUsage.totalApiCalls !== undefined
        ? Number(dailyUsage.totalApiCalls)
        : chatCalls + audioCalls;
    const quotaLimit = Number(dailyUsage.dailyQuotaLimit) || 1500;
    const usagePercent = Math.min(
      100,
      Math.round((totalCalls / quotaLimit) * 100),
    );

    return (
      <div className="p-6 rounded-3xl bg-gradient-to-br from-bg-card via-bg-secondary/30 to-bg-card border border-border-main space-y-5 shadow-2xs animate-fadeIn">
        {/* Card Header & Daily Refresh Countdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0">
              <Zap size={18} className="text-pilot-blue" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                  Daily AI API Usage & Quota Monitor
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Refreshes Daily
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Real-time count of API calls utilized today for WhatsApp chats
                and voice call intelligence.
              </p>
            </div>
          </div>

          {/* Reset Countdown, Set Limit & Refresh Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-secondary border border-border-main text-[11px] font-medium text-text-secondary">
              <Calendar size={12} className="text-pilot-blue" />
              <span>
                Resets in:{" "}
                <strong className="text-text-primary font-bold">
                  {resetCountdown || "calculating..."}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setCustomDailyLimit(quotaLimit);
                setShowEditLimitModal(true);
              }}
              title="Configure your daily API quota limit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pilot-blue text-white hover:bg-pilot-blue-hover text-[11px] font-bold transition-all cursor-pointer shadow-xs"
            >
              <Sliders size={12} />
              <span>Set Limit</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshAiUsage}
              disabled={refreshingUsage}
              title="Sync latest API usage counters"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-secondary hover:bg-bg-card border border-border-main text-[11px] font-bold text-text-primary hover:border-pilot-blue/40 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={`text-pilot-blue ${
                  refreshingUsage ? "animate-spin" : ""
                }`}
              />
              <span>{refreshingUsage ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
          <strong>Daily quota protection:</strong> when this limit is reached, automated AI replies pause until the counter resets at midnight UTC.
        </div>

        {/* Overall Quota Progress Meter */}
        <div className="p-4 rounded-2xl bg-bg-secondary/40 border border-border-main space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-text-primary">
                Today's Gemini Calls:
              </span>
              <span className="font-mono text-pilot-blue font-bold">
                {totalCalls.toLocaleString()}{" "}
                <span className="text-text-secondary font-normal">
                  / {quotaLimit.toLocaleString()} calls
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomDailyLimit(quotaLimit);
                  setShowEditLimitModal(true);
                }}
                className="text-[10px] font-bold text-pilot-blue hover:underline flex items-center gap-1 ml-1 cursor-pointer bg-pilot-blue/10 px-2 py-0.5 rounded-md border border-pilot-blue/20"
                title="Update daily quota limit"
              >
                <Edit2 size={10} />
                <span>Edit Limit</span>
              </button>
            </div>
            <span
              className={`text-[11px] font-bold ${
                usagePercent >= 90
                  ? "text-red-500"
                  : usagePercent >= 70
                    ? "text-amber-500"
                    : "text-emerald-500"
              }`}
            >
              {usagePercent}% Used
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-bg-card border border-border-main rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent >= 90
                  ? "bg-red-500"
                  : usagePercent >= 70
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-pilot-blue via-indigo-500 to-emerald-500"
              }`}
              style={{
                width: `${Math.max(totalCalls > 0 ? 3 : 0, usagePercent)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-secondary pt-0.5">
            <span>0 calls</span>
            <div className="flex items-center gap-1">
              <span>Configured Daily Limit:</span>
              <button
                type="button"
                onClick={() => {
                  setCustomDailyLimit(quotaLimit);
                  setShowEditLimitModal(true);
                }}
                className="font-bold text-pilot-blue hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="Click to update daily quota limit"
              >
                <span>{quotaLimit.toLocaleString()} requests/day</span>
                <Edit2 size={10} className="text-pilot-blue" />
              </button>
            </div>
            <span>{quotaLimit.toLocaleString()} calls max</span>
          </div>
        </div>

        {/* Breakdown Cards for Specific Purposes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purpose 1: WhatsApp AI Chats */}
          <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main hover:border-pilot-blue/30 transition-all space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-text-primary">
                    WhatsApp AI Chats
                  </h4>
                  <span className="text-[10px] text-text-secondary">
                    Text replies & lead qualification
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20">
                Chats Purpose
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-text-primary tracking-tight font-mono">
                {chatCalls.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary font-medium">
                calls used today
              </span>
            </div>

            <div className="pt-2 border-t border-border-main/60 flex items-center justify-between text-[10px] text-text-secondary">
              <span>Auto-replies, FAQs & dynamic lead queries</span>
              <span className="font-mono text-pilot-blue font-semibold shrink-0">
                1 call / message
              </span>
            </div>
          </div>

          {/* Purpose 2: Audio & Voice Calls */}
          <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main hover:border-violet-500/30 transition-all space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-text-primary">
                    Audio & Voice Calls
                  </h4>
                  <span className="text-[10px] text-text-secondary">
                    Call recording transcription & analysis
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-500 border border-violet-500/20">
                Audio Purpose
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-text-primary tracking-tight font-mono">
                {audioCalls.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary font-medium">
                calls used today
              </span>
            </div>

            <div className="pt-2 border-t border-border-main/60 flex items-center justify-between text-[10px] text-text-secondary">
              <span>Sales recordings, transcription & sentiment</span>
              <span className="font-mono text-violet-500 font-semibold shrink-0">
                1 call / audio
              </span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-bg-secondary/30 border border-border-main text-[11px] text-text-secondary">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span>
              <strong>Everyday Refresh:</strong> Usage counters automatically
              reset to 0 every day at 00:00 UTC.
            </span>
          </div>
          <span className="font-mono text-[10px] text-text-secondary">
            Today:{" "}
            <strong className="text-text-primary">
              {dailyUsage.date || new Date().toISOString().slice(0, 10)}
            </strong>
          </span>
        </div>
      </div>
    );
  };

    const renderSubscriptionAndSeatsContent = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Organization Identification & Validity ── */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pilot-blue to-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
              {(org.name || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-text-primary">
                  {org.name || "Client Organization"}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {org.status ? org.status.toUpperCase() : "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Organization license, sales representative seat allocations, and billing cycle.
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l border-border-main sm:pl-6 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Subscription Validity
            </span>
            <span className="text-sm font-black text-text-primary block mt-0.5">
              {formatDate(org.subscriptionEndDate)}
            </span>
            <span
              className={`text-[11px] font-bold ${isExpired ? "text-red-500" : "text-emerald-600"}`}
            >
              {isExpired
                ? "Subscription Expired"
                : `${remainingDays} days remaining`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-border-main text-xs">
          <div className="flex items-center gap-2.5 text-text-secondary">
            <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue shrink-0">
              <Mail size={14} />
            </div>
            <span className="text-text-primary font-medium truncate">
              {org.email || "No email"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-text-secondary">
            <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue shrink-0">
              <Phone size={14} />
            </div>
            <span className="text-text-primary font-medium">
              {org.mobile || "No phone"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-text-secondary">
            <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue shrink-0">
              <Globe size={14} />
            </div>
            <span className="text-text-primary font-medium truncate">
              {org.website || "No website"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Seat Utilization, Billing Model & WhatsApp Mode ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Seats */}
        <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-main">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pilot-blue" />
              <h3 className="font-bold text-xs text-text-primary">
                Seat Utilization & Licensing
              </h3>
            </div>
            <span className="text-xs font-black text-pilot-blue">
              {usedSeats} / {totalSeats} Used
            </span>
          </div>

          <div className="w-full bg-bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-pilot-blue h-3 rounded-full transition-all duration-500"
              style={{ width: `${seatPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
              <div className="text-[10px] text-text-secondary font-bold uppercase">
                Total Seats
              </div>
              <div className="text-base font-black text-text-primary mt-0.5">
                {totalSeats}
              </div>
            </div>
            <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
              <div className="text-[10px] text-text-secondary font-bold uppercase">
                Active Reps
              </div>
              <div className="text-base font-black text-pilot-blue mt-0.5">
                {usedSeats}
              </div>
            </div>
            <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
              <div className="text-[10px] text-text-secondary font-bold uppercase">
                Available
              </div>
              <div className="text-base font-black text-emerald-600 mt-0.5">
                {remainingSeats}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Billing Model */}
        <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-main">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-pilot-blue" />
              <h3 className="font-bold text-xs text-text-primary">
                Billing & Commercial Model
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue uppercase">
              {org.subscriptionPlan || "MONTHLY"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border-main/50">
              <span className="text-text-secondary">
                Subscription Plan:
              </span>
              <span className="font-bold text-text-primary uppercase">
                {org.subscriptionPlan
                  ? `${org.subscriptionPlan} Seat-Wise`
                  : "Monthly Seat-Wise"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border-main/50">
              <span className="text-text-secondary">Rate Per Seat:</span>
              <span className="font-bold text-text-primary">
                ₹{org.pricingPerSeat || 599} /{" "}
                {org.subscriptionPlan === "annually"
                  ? "year"
                  : org.subscriptionPlan === "quarterly"
                    ? "quarter"
                    : "month"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-text-secondary">
                Current Cycle:
              </span>
              <span className="font-medium text-text-primary">
                {formatDate(org.subscriptionStartDate)} &rarr;{" "}
                {formatDate(org.subscriptionEndDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: WhatsApp Connection Mode */}
        <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-main">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-xs text-text-primary">
                WhatsApp Connection
              </h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              (org.whatsappLineLimit || 1) >= 2
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-slate-500/10 text-slate-600"
            }`}>
              {(org.whatsappLineLimit || 1) >= 2 ? "DUAL LINE" : "SINGLE LINE"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border-main/50">
              <span className="text-text-secondary">
                Connection Mode:
              </span>
              <span className="font-bold text-text-primary">
                {(org.whatsappLineLimit || 1) >= 2 ? "Dual Lines (2 Devices)" : "Single Line (1 Device)"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-text-secondary">
                Max Devices:
              </span>
              <span className="font-bold text-text-primary">
                {org.whatsappLineLimit || 1}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-bg-secondary/50 border border-border-main">
            <Info className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-secondary leading-relaxed">
              WhatsApp connection mode is managed by your system administrator. Contact support to upgrade your connection plan.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Quota & Usage Monitor Card */}
      {renderDailyAiUsageCard(false)}
    </div>
  );

  const activeStepObj = STEPS.find((s) => s.id === currentStep) || STEPS[0];

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 p-3.5 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Header with Brand Details & Clean Tab Switcher ───────────── */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-5 sm:p-6 shadow-xs w-full min-w-0">
        <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-5">
          {/* Org Identification */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary hover:border-pilot-blue/40 transition-colors shrink-0 cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pilot-blue to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
              {(org.name || "S").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-text-primary tracking-tight truncate max-w-[260px] sm:max-w-md">
                  {org.name || "Organization"}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {org.status ? org.status.toUpperCase() : "ACTIVE"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20 shrink-0">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-1 sm:line-clamp-none">
                Customize your AI sales pilot, products catalog, qualification
                schema, and knowledge documents.
              </p>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <div className="flex items-center p-1.5 bg-bg-secondary border border-border-main rounded-2xl gap-1.5 w-full 2xl:w-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                setActiveTab("wizard");
                if (currentStep === 8) setCurrentStep(1);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "wizard" && currentStep !== 8
                  ? "bg-pilot-blue text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <Bot size={15} className="shrink-0" />
              <span className="whitespace-nowrap">AI Setup Wizard</span>
              <span className="hidden xl:inline text-[10px] opacity-80">(Steps 1–7)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("billing");
                setCurrentStep(8);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "billing" || currentStep === 8
                  ? "bg-pilot-blue text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <Building2 size={15} className="shrink-0" />
              <span className="whitespace-nowrap">Subscription & Seats</span>
              <span className="hidden xl:inline text-[10px] opacity-80">(Step 8)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openSupportModal(
                  "Book 1-on-1 Human Assistance & Consultation Session for AI Pilot Setup."
                )
              }
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title="Schedule a 1-on-1 support meeting via Calendly"
            >
              <Headphones size={15} className="shrink-0" />
              <span className="whitespace-nowrap">Human Assistance</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Success Toast Banner ─────────────────────────────────────────── */}
      {saveToast && (
      <div role="status" aria-live="polite" className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn w-full min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 size={17} className="shrink-0" />
            <span className="truncate">{saveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast("")}
            aria-label="Dismiss save message"
            title="Dismiss message"
            className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: STEP-BY-STEP GUIDED AI PILOT SETUP WIZARD                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "wizard" && (
        <div className="space-y-6 w-full min-w-0">
          {/* ── AI DOCUMENT EXTRACTION & SETUP HERO GUIDE ────────────────────── */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-pilot-blue/15 via-indigo-600/10 to-bg-card border border-pilot-blue/30 shadow-sm relative overflow-hidden w-full min-w-0">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-pilot-blue/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 relative z-10 w-full min-w-0">
              <div className="space-y-1.5 max-w-2xl min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pilot-blue text-white shadow-xs shrink-0">
                    <Sparkles size={11} className="animate-pulse" />
                    AI Auto-Configuration Available
                  </span>
                  <span className="text-[11px] font-bold text-text-secondary">
                    Extract from business documents in 60s
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
                  Have a Company Brochure, Website, or Product Catalog?
                </h3>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Use our specialized extraction system prompt with ChatGPT,
                  Claude, or Gemini. Upload your business document, and it will
                  generate your exact <strong>Catalog Services</strong> and{" "}
                  <strong>Qualification Schema</strong> ready to paste into this
                  dashboard.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap w-full xl:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setGuidanceTab("prompt");
                    setShowAiGuidanceModal(true);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-md shadow-pilot-blue/20 cursor-pointer group whitespace-nowrap"
                >
                  <Sparkles
                    size={15}
                    className="group-hover:rotate-12 transition-transform shrink-0"
                  />
                  <span>Document Extraction Guide</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQuickPrompt}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-bg-card border border-border-main hover:border-pilot-blue/40 text-text-primary text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                  title="Copy the extraction prompt to clipboard directly"
                >
                  {copiedQuickPrompt ? (
                    <>
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Prompt Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="text-pilot-blue shrink-0" />
                      <span>Copy System Prompt</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openSupportModal(
                      "Book 1-on-1 Human Assistance & Consultation Session for AI Pilot Setup."
                    )
                  }
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-md shadow-purple-600/20 cursor-pointer whitespace-nowrap"
                  title="Schedule a 30-min strategy & onboarding call with our team"
                >
                  <Headphones size={15} className="shrink-0" />
                  <span>Book Human Assistance</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 w-full min-w-0 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-text-primary uppercase tracking-wider text-[11px]">
                  Setup Progress: Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20">
                  {Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)}% Complete
                </span>
              </div>
              <span className="text-text-secondary text-[11px]">
                {currentStep <= 7 ? "Click any step to review or update settings" : "Subscription & seat management"}
              </span>
            </div>

            <div className="w-full bg-bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-pilot-blue h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(12, Math.round((currentStep / STEPS.length) * 100))}%` }}
              />
            </div>

            <div
              ref={stepperScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 w-full min-w-0 max-w-full scroll-smooth scrollbar-thin scrollbar-thumb-border-main scrollbar-track-transparent"
              role="tablist"
              aria-label="Setup steps"
            >
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`Step ${step.id}: ${step.title}`}
                    onClick={() => {
                      if (step.id === 8) {
                        setActiveTab("billing");
                      } else if (activeTab === "billing") {
                        setActiveTab("wizard");
                      }
                      setCurrentStep(step.id);
                    }}
                    className={`flex items-center gap-2 p-2 sm:px-3 sm:py-2.5 rounded-2xl transition-all text-left shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pilot-blue ${
                      isCurrent
                        ? "bg-pilot-blue text-white shadow-md shadow-pilot-blue/20"
                        : isCompleted
                          ? "bg-bg-secondary text-text-primary hover:bg-bg-secondary/80"
                          : "text-text-secondary/70 hover:text-text-primary hover:bg-bg-secondary/40"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                        isCurrent
                          ? "bg-white/20 text-white"
                          : isCompleted
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-bg-secondary border border-border-main text-text-secondary"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={14} />
                      ) : (
                        <StepIcon size={14} />
                      )}
                    </div>

                    <div className="block">
                      <div className="text-[9px] uppercase font-bold tracking-wider opacity-75">
                        Step 0{step.id}
                      </div>
                      <div className="text-[11px] font-black tracking-tight whitespace-nowrap">
                        {step.shortTitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Step Workspace Card */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-5 sm:p-8 shadow-xs space-y-7 w-full min-w-0 max-w-full overflow-hidden">
            {/* Step Header & Template Picker */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border-main">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-pilot-blue block">
                  STEP {activeStepObj.id} OF {STEPS.length} &bull;{" "}
                  {activeStepObj.subtitle}
                </span>
                <h2 className="text-xl font-black text-text-primary mt-1">
                  {activeStepObj.title}
                </h2>
                <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
                  {activeStepObj.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGuidanceTab("prompt");
                    setShowAiGuidanceModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pilot-blue/15 to-indigo-600/15 border border-pilot-blue/30 text-pilot-blue text-xs font-bold hover:bg-pilot-blue/25 transition-all shadow-xs shrink-0 cursor-pointer"
                  title="View document extraction guide & copy prompt for ChatGPT/Claude"
                >
                  <Sparkles size={14} className="text-pilot-blue" />
                  <span>Document Extraction Guide</span>
                </button>
              </div>
            </div>

                        {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 1: BUSINESS PROFILE ───────────────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Step 1 Introduction & Organization Notice */}
                <div className="p-4 sm:p-5 rounded-2xl bg-pilot-blue/10 border border-pilot-blue/20 text-xs text-text-primary flex items-start gap-3">
                  <Building2 size={18} className="text-pilot-blue shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block text-text-primary">Step 1: Define Your Company Profile & AI Tone</span>
                    <p className="text-text-secondary leading-relaxed">
                      Enter your official company brand name, what your business does, and the conversational persona of your AI sales assistant. These details form the core personality and knowledge your AI references when speaking with customers across all representative channels.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Brand Name & Persona */}
                  <div className="space-y-5">
                    {/* Brand Name Input */}
                    <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="brand-name-input" className="block text-xs font-black text-text-primary uppercase tracking-wider">
                          Company / Brand Name <span className="text-red-500 font-bold">* Required</span>
                        </label>
                        <span className="text-[10px] font-bold text-pilot-blue bg-pilot-blue/10 px-2 py-0.5 rounded-md border border-pilot-blue/20">
                          Auto-filled from profile
                        </span>
                      </div>
                      <input
                        id="brand-name-input"
                        type="text"
                        value={aiSettings.companyName}
                        onChange={(e) =>
                          setAiSettings({
                            ...aiSettings,
                            companyName: e.target.value,
                          })
                        }
                        placeholder={org.name || "e.g. SalesBuster AI"}
                        aria-invalid={!aiSettings.companyName?.trim()}
                        className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all font-semibold"
                      />
                      {!aiSettings.companyName?.trim() && (
                        <p className="text-[11px] text-red-500 font-semibold" role="alert">
                          Please enter your company or brand name.
                        </p>
                      )}
                      <span className="text-[10px] text-text-secondary block">
                        The official brand name the AI introduces to customers on WhatsApp.
                      </span>
                    </div>

                    {/* Agent Persona & Tone Input */}
                    <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main space-y-3">
                      <div>
                        <label htmlFor="agent-persona-input" className="block text-xs font-black text-text-primary mb-1 uppercase tracking-wider">
                          AI Agent Tone & Role Description
                        </label>
                        <input
                          id="agent-persona-input"
                          type="text"
                          value={aiSettings.agentPersona}
                          onChange={(e) =>
                            setAiSettings({
                              ...aiSettings,
                              agentPersona: e.target.value,
                            })
                          }
                          placeholder="e.g. warm, consultative sales advisor"
                          className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                        />
                        <span className="text-[10px] text-text-secondary mt-1.5 block">
                          Controls the AI assistant's personality traits and conversational vocabulary.
                        </span>
                      </div>

                      {/* Quick Select Presets */}
                      <div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                          Quick Tone Presets:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "warm, friendly, and consultative sales advisor",
                            "professional and knowledgeable property advisor",
                            "helpful, enthusiastic product specialist",
                            "sophisticated, polished executive consultant",
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAiSettings({ ...aiSettings, agentPersona: preset })}
                              className={`px-2.5 py-1 text-[11px] rounded-lg border text-left transition-colors cursor-pointer ${
                                aiSettings.agentPersona === preset
                                  ? "bg-pilot-blue text-white border-pilot-blue font-bold shadow-2xs"
                                  : "bg-bg-card border-border-main text-text-secondary hover:text-text-primary hover:border-pilot-blue/40"
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Business Overview & Guardrails */}
                  <div className="space-y-5">
                    {/* Company Pitch / Overview */}
                    <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main space-y-2">
                      <label htmlFor="business-description-input" className="block text-xs font-black text-text-primary uppercase tracking-wider">
                        What Your Business Does & Value Proposition
                      </label>
                      <textarea
                        id="business-description-input"
                        rows={4}
                        value={aiSettings.businessDescription}
                        onChange={(e) =>
                          setAiSettings({
                            ...aiSettings,
                            businessDescription: e.target.value,
                          })
                        }
                        placeholder="Briefly describe what your company offers, core target audience, key customer benefits, and USPs (e.g. We provide turnkey residential interior design with 10-year warranty, free 3D design consultations, and on-time handover guarantee)..."
                        className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all leading-relaxed"
                      />
                      <span className="text-[10px] text-text-secondary block">
                        Gives the AI context about your company strengths when answering customer enquiries.
                      </span>
                    </div>

                    {/* Guardrails and Rules */}
                    <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="custom-instructions-input" className="block text-xs font-black text-text-primary uppercase tracking-wider">
                          Mandatory Sales Guardrails & Rules
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setAiSettings({
                              ...aiSettings,
                              customInstructions: `1. STRICT PRICING: Never guess or quote fixed prices without technical requirements assessment. State that pricing depends on specifications and schedule a callback.\n2. PACING: Ask at most 1-2 questions per message to avoid overwhelming the customer.\n3. HUMAN HANDOFF: If the user asks for a real human, politely acknowledge and transfer them immediately.\n4. FORMATTING: Keep messages under 50-60 words with clean WhatsApp bold (*word*) and friendly emojis.`,
                            })
                          }
                          className="text-[10px] font-bold text-pilot-blue hover:underline cursor-pointer"
                        >
                          Reset Rules
                        </button>
                      </div>
                      <textarea
                        id="custom-instructions-input"
                        rows={4}
                        value={aiSettings.customInstructions}
                        onChange={(e) =>
                          setAiSettings({
                            ...aiSettings,
                            customInstructions: e.target.value,
                          })
                        }
                        className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all font-mono leading-relaxed"
                      />
                      <span className="text-[10px] text-text-secondary block">
                        Defines strict pricing guidelines (e.g. never guess fixed quotes), callback triggers, and handoff rules.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-secondary/60 border border-border-main text-[11px] text-text-secondary flex items-center gap-2">
                  <Info size={14} className="text-pilot-blue shrink-0" />
                  <span>
                    <strong>Organization-wide effect:</strong> These business profile details guide the AI across all customer WhatsApp conversations in your workspace.
                  </span>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 2: AI CONNECTION & QUOTA ─────────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Organization-Wide Setting Notice */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-sm">Organization-Wide AI Connection</span>
                    <span className="text-[11px] opacity-90 leading-relaxed block">
                      This Google Gemini API key powers real-time automated WhatsApp replies, dynamic lead qualification, and audio call recordings analysis across all sales representatives in your organization.
                    </span>
                  </div>
                </div>

                {/* Gemini API Key Card */}
                <div className="p-6 rounded-3xl bg-bg-secondary/40 border border-border-main space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0">
                        <Key size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                            Google Gemini API Key
                          </h3>
                          <span className="text-[10px] font-black text-red-500 uppercase">
                            * Required
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          Each organization provides their own Gemini key from Google AI Studio.
                        </p>
                      </div>
                    </div>

                    {aiSettings.geminiApiKey?.trim() ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 size={13} />
                        <span>Key Configured</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        <AlertTriangle size={13} />
                        <span>Key Required</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <label htmlFor="gemini-api-key-input" className="text-text-primary">
                        Google Gemini API Key
                      </label>
                      <span className="text-[11px] text-text-secondary font-mono">
                        Format: AIzaSy...
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <input
                          id="gemini-api-key-input"
                          type={showApiKey ? "text" : "password"}
                          value={aiSettings.geminiApiKey || ""}
                          onChange={(e) => {
                            setAiSettings({
                              ...aiSettings,
                              geminiApiKey: e.target.value,
                            });
                            setKeyTestResult(null);
                          }}
                          placeholder="AIzaSy..."
                          className="w-full bg-bg-card border border-border-main text-text-primary text-xs font-mono rounded-xl pl-3.5 pr-10 py-3 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                          aria-label="Google Gemini API Key"
                          aria-invalid={Boolean(aiSettings.geminiApiKey?.trim()) && !geminiKeyLooksValid}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                          aria-label={showApiKey ? "Hide Gemini API key" : "Show Gemini API key"}
                          title={showApiKey ? "Hide Key" : "Show Key"}
                        >
                          {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestApiKey}
                        disabled={testingKey || !aiSettings.geminiApiKey?.trim()}
                        className="px-5 py-3 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        {testingKey ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Validating Key…</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} />
                            <span>Test API Key</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiSettings.geminiApiKey?.trim() && !geminiKeyLooksValid && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400" role="status">
                        Check the key format. Google Gemini keys usually start with “AIza”. You can verify it in Google AI Studio.
                      </p>
                    )}

                    {keyTestResult && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2.5 animate-fadeIn ${
                          keyTestResult.success
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 border border-red-500/30 text-red-500"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {keyTestResult.success ? (
                            <CheckCircle2 size={15} className="shrink-0" />
                          ) : (
                            <AlertTriangle size={15} className="shrink-0" />
                          )}
                          <span>{keyTestResult.message}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setKeyTestResult(null)}
                          aria-label="Dismiss API key verification message"
                          className="p-1 hover:opacity-75 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 text-[11px] text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Lock size={12} className="text-emerald-500 shrink-0" />
                        <span>
                          Encrypted with AES-256-GCM. Never shared with other organizations.
                        </span>
                      </div>

                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-pilot-blue hover:underline font-bold"
                      >
                        <span>Get API Key from Google AI Studio</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Daily Quota & Usage Monitor Card */}
                {renderDailyAiUsageCard(true)}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 3: PRODUCTS & SERVICES ────────────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Step 3 Pro Guidance Callout */}
                <div className="p-4 rounded-2xl bg-bg-secondary/40 border border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-pilot-blue/10 text-pilot-blue shrink-0 mt-0.5">
                      <Lightbulb size={16} />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-text-primary">
                        Catalog & Offering Matching
                      </div>
                      <p className="text-text-secondary leading-relaxed">
                        When a customer reaches out via WhatsApp, the AI maps their request to these products, services, and keywords, and tags the lead in your CRM.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGuidanceTab("prompt");
                      setShowAiGuidanceModal(true);
                    }}
                    className="text-xs font-bold text-pilot-blue hover:underline shrink-0 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Extract from Brochure</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-text-primary">
                      Catalog Offerings ({aiSettings.services.length})
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      The AI automatically matches incoming customer messages against these products and keywords.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-bg-secondary border border-border-main shadow-2xs">
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold text-text-primary leading-tight">
                          Auto-Send Photos
                        </span>
                        <span className="text-[9px] text-text-secondary">
                          {aiSettings.serviceImagesAutoSendEnabled !== false
                            ? "Active"
                            : "Paused"}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={aiSettings.serviceImagesAutoSendEnabled !== false ? "Pause auto-sending service photos" : "Enable auto-sending service photos"}
                        onClick={() => {
                          const updated = {
                            ...aiSettings,
                            serviceImagesAutoSendEnabled:
                              aiSettings.serviceImagesAutoSendEnabled === false,
                          };
                          setAiSettings(updated);
                          handleSaveStep(updated);
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          aiSettings.serviceImagesAutoSendEnabled !== false
                            ? "bg-pilot-blue"
                            : "bg-border-main"
                        }`}
                        title={
                          aiSettings.serviceImagesAutoSendEnabled !== false
                            ? "Pause auto-sending service photos"
                            : "Enable auto-sending service photos"
                        }
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            aiSettings.serviceImagesAutoSendEnabled !== false
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={openServicesImportModal}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs font-bold hover:bg-bg-secondary/70 hover:border-pilot-blue/40 transition-all shadow-xs shrink-0 cursor-pointer"
                      title="Import products & services list from JSON structure"
                    >
                      <FileJson size={15} className="text-pilot-blue" />
                      <span>Import Services (JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddServiceModal}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Add New Service</span>
                    </button>
                  </div>
                </div>

                {/* Services Grid */}
                {aiSettings.services.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-bg-secondary/40 border border-dashed border-border-main text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center mx-auto">
                      <Layers size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">
                      No Catalog Services Configured Yet
                    </h4>
                    <p className="text-xs text-text-secondary max-w-md mx-auto">
                      Add your products or services so the AI knows what you sell and can guide your customers effectively.
                    </p>
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={openServicesImportModal}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bg-card border border-border-main text-text-primary text-xs font-bold hover:bg-bg-secondary transition-colors cursor-pointer"
                      >
                        <FileJson size={14} className="text-pilot-blue" />
                        <span>Import Services JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenAddServiceModal}
                        className="px-4 py-2 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-colors cursor-pointer"
                      >
                        Add First Service
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiSettings.services.map((svc, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main hover:border-pilot-blue/40 transition-all flex flex-col justify-between gap-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-black text-text-primary">
                                {svc.name}
                              </h4>
                              {svc.sendImagesEnabled === false && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Photos Paused
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditServiceModal(idx)}
                                className="text-text-secondary hover:text-pilot-blue p-1 rounded-lg hover:bg-pilot-blue/10 transition-colors cursor-pointer"
                                title="Edit Service & Images"
                                aria-label={`Edit ${svc.name}`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveService(idx)}
                                className="text-text-secondary hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete Service"
                                aria-label={`Remove ${svc.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {svc.description}
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border-main/60">
                          {Array.isArray(svc.images) && svc.images.length > 0 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              {svc.images.map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="w-10 h-10 rounded-lg overflow-hidden border border-border-main shrink-0 bg-bg-card relative group/img"
                                  title={img.title || img.description || "Service Photo"}
                                >
                                  <img
                                    src={img.url}
                                    alt={img.title || "Service photo"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              <span className="text-[10px] text-text-secondary font-medium pl-1 shrink-0">
                                {svc.images.length} {svc.images.length === 1 ? "photo" : "photos"}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(svc.keywords)
                              ? svc.keywords
                              : (svc.keywords || "").split(",")
                            )
                              .map((k) => k.trim())
                              .filter(Boolean)
                              .map((kw, kidx) => (
                                <span
                                  key={kidx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-bg-card border border-border-main text-text-secondary"
                                >
                                  #{kw}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add / Edit Service Modal */}
                {showAddServiceModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" role="presentation">
                    <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[90vh] flex flex-col justify-between shadow-2xl space-y-4" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
                      <div className="flex justify-between items-center pb-2 border-b border-border-main">
                        <h3 id="service-modal-title" className="text-sm font-black text-text-primary">
                          {editingServiceIndex !== null
                            ? "Edit Service & Photos"
                            : "Add Catalog Service"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddServiceModal(false);
                            setEditingServiceIndex(null);
                          }}
                          className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                          aria-label="Close service modal"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                        {serviceFormError && (
                          <p className="text-xs text-red-600 dark:text-red-400 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20" role="alert">
                            {serviceFormError}
                          </p>
                        )}
                        <div>
                          <label htmlFor="service-name" className="block text-xs font-bold text-text-primary mb-1">
                            Service / Product Name *
                          </label>
                          <input
                            id="service-name"
                            type="text"
                            value={newService.name}
                            onChange={(e) =>
                              (setServiceFormError(""), setNewService({ ...newService, name: e.target.value }))
                            }
                            placeholder="e.g. Turnkey Interior Design"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label htmlFor="service-description" className="block text-xs font-bold text-text-primary mb-1">
                            Description *
                          </label>
                          <textarea
                            id="service-description"
                            rows={3}
                            value={newService.description}
                            onChange={(e) =>
                              (setServiceFormError(""), setNewService({
                                ...newService,
                                description: e.target.value,
                              }))
                            }
                            placeholder="What this service includes, scope, or standard customer packages..."
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label htmlFor="service-keywords" className="block text-xs font-bold text-text-primary mb-1">
                            Customer Keywords (comma-separated) *
                          </label>
                          <input
                            id="service-keywords"
                            type="text"
                            value={newService.keywords}
                            onChange={(e) =>
                              (setServiceFormError(""), setNewService({
                                ...newService,
                                keywords: e.target.value,
                              }))
                            }
                            placeholder="e.g. interior, design, renovation, modular kitchen, luxury home"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                          <span className="text-[10px] text-text-secondary mt-1 block">
                            Keywords customers use in messages that indicate interest in this service.
                          </span>
                        </div>

                        {/* WhatsApp Photo Attachments */}
                        <div className="pt-2 border-t border-border-main space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-text-primary block">
                                WhatsApp Photo Attachments
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                Sent to customers who enquire about this service.
                              </span>
                            </div>

                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pilot-blue/10 hover:bg-pilot-blue/20 text-pilot-blue text-xs font-bold transition-colors cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleServiceImageUpload}
                                disabled={serviceImageUploading}
                                className="hidden"
                              />
                              {serviceImageUploading ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Upload size={13} />
                              )}
                              <span>{serviceImageUploading ? "Uploading…" : "Add Photos"}</span>
                            </label>
                          </div>

                          {/* Photos List */}
                          {Array.isArray(newService.images) && newService.images.length > 0 ? (
                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                              {newService.images.map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="p-2.5 rounded-xl bg-bg-secondary/60 border border-border-main flex items-start gap-3"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.title || "Photo thumbnail"}
                                    className="w-14 h-14 rounded-lg object-cover border border-border-main shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs font-bold text-text-primary truncate">
                                        {img.title || `Photo #${imgIdx + 1}`}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveServiceImage(imgIdx)}
                                        className="text-text-secondary hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                                        title="Remove photo"
                                        aria-label="Remove photo"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={img.description || ""}
                                      onChange={(e) =>
                                        handleUpdateServiceImageDesc(
                                          imgIdx,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Caption sent with this photo on WhatsApp..."
                                      className="w-full bg-bg-card border border-border-main text-text-primary text-[11px] rounded-lg p-2 outline-none focus:border-pilot-blue resize-none"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-dashed border-border-main text-center space-y-1 bg-bg-secondary/20">
                              <div className="w-7 h-7 rounded-lg bg-pilot-blue/10 text-pilot-blue flex items-center justify-center mx-auto">
                                <ImageIcon size={14} />
                              </div>
                              <p className="text-[11px] text-text-secondary">
                                No photos attached yet. Click "Add Photos" above to attach images and customize their WhatsApp captions.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddServiceModal(false);
                            setEditingServiceIndex(null);
                          }}
                          className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveService}
                          className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Save Service
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 4: LEAD QUESTIONS & QUALIFICATION ─────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Step 4 Guidance Callout */}
                <div className="p-4 rounded-2xl bg-bg-secondary/40 border border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-pilot-blue/10 text-pilot-blue shrink-0 mt-0.5">
                      <Lightbulb size={16} />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-text-primary">
                        How Lead Qualification Works
                      </div>
                      <p className="text-text-secondary leading-relaxed">
                        The AI agent asks these qualification questions organically over the WhatsApp conversation, avoiding rigid interrogation and maximizing customer response rates.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGuidanceTab("prompt");
                      setShowAiGuidanceModal(true);
                    }}
                    className="text-xs font-bold text-pilot-blue hover:underline shrink-0 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Generate Industry Questions</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                {/* Lead Questions Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-text-primary">
                      Lead Qualification Questions ({aiSettings.qualificationFields.length})
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Standard criteria your AI extracts to qualify leads. Customize, edit, delete, or add questions to suit your business.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openQualificationImportModal}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs font-bold hover:bg-bg-secondary/70 hover:border-pilot-blue/40 transition-all shadow-xs shrink-0 cursor-pointer"
                      title="Import qualification schema criteria from JSON structure"
                    >
                      <FileJson size={15} className="text-pilot-blue" />
                      <span>Import Criteria (JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFieldIndex(null);
                        setNewField({
                          key: "",
                          label: "",
                          type: "string",
                          description: "",
                          options: "",
                          required: false,
                        });
                        setShowAddFieldModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Add Custom Question</span>
                    </button>
                  </div>
                </div>

                {/* Questions Grid */}
                {aiSettings.qualificationFields.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-bg-secondary/40 border border-dashed border-border-main text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center mx-auto">
                      <ListFilter size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">
                      No Lead Questions Configured
                    </h4>
                    <p className="text-xs text-text-secondary max-w-md mx-auto">
                      Add business-specific criteria (e.g. location, budget, timeframe, project specifications) to capture key lead requirements.
                    </p>
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={openQualificationImportModal}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bg-card border border-border-main text-text-primary text-xs font-bold hover:bg-bg-secondary transition-colors cursor-pointer"
                      >
                        <FileJson size={14} className="text-pilot-blue" />
                        <span>Import Questions JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddFieldModal(true)}
                        className="px-4 py-2 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-colors cursor-pointer"
                      >
                        Add First Question
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiSettings.qualificationFields.map((field, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main hover:border-pilot-blue/40 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-text-primary">
                                {field.label}
                              </h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-bg-card border border-border-main text-pilot-blue uppercase">
                                {field.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditField(idx)}
                                className="text-text-secondary hover:text-pilot-blue p-1 rounded-lg hover:bg-pilot-blue/10 transition-colors cursor-pointer"
                                title="Edit Question"
                                aria-label={`Edit qualification question ${field.label}`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveField(idx)}
                                className="text-text-secondary hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete Question"
                                aria-label={`Remove qualification question ${field.label}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] font-mono text-text-secondary">
                            Key: <span className="text-text-primary font-bold">{field.key}</span>
                          </div>

                          {field.description && (
                            <p className="text-xs text-text-secondary leading-relaxed pt-1">
                              {field.description}
                            </p>
                          )}
                        </div>

                        {Array.isArray(field.options) && field.options.length > 0 && (
                          <div className="pt-2 border-t border-border-main/60">
                            <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
                              Allowed Choices:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {field.options.map((opt, oidx) => (
                                <span
                                  key={oidx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-bg-card border border-border-main text-text-primary"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add / Edit Field Modal */}
                {showAddFieldModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" role="presentation">
                    <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4" role="dialog" aria-modal="true" aria-labelledby="question-modal-title">
                      <div className="flex justify-between items-center pb-2 border-b border-border-main">
                        <h3 id="question-modal-title" className="text-sm font-black text-text-primary">
                          {editingFieldIndex !== null
                            ? "Edit Qualification Question"
                            : "Add Custom Question"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFieldIndex(null);
                            setShowAddFieldModal(false);
                          }}
                          className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                          aria-label="Close question modal"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        {fieldFormError && (
                          <p className="text-xs text-red-600 dark:text-red-400 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20" role="alert">
                            {fieldFormError}
                          </p>
                        )}

                        <div>
                          <label htmlFor="field-label" className="block text-xs font-bold text-text-primary mb-1">
                            Question Display Label *
                          </label>
                          <input
                            id="field-label"
                            type="text"
                            value={newField.label}
                            onChange={(e) => {
                              setFieldFormError("");
                              const val = e.target.value;
                              const autoKey = val
                                .toLowerCase()
                                .replace(/[^a-zA-Z0-9 ]/g, "")
                                .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
                                .trim();
                              setNewField({
                                ...newField,
                                label: val,
                                key: editingFieldIndex === null ? autoKey : newField.key,
                              });
                            }}
                            placeholder="e.g. Preferred Location"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label htmlFor="field-key" className="block text-xs font-bold text-text-primary mb-1">
                            Identifier Key (camelCase) *
                          </label>
                          <input
                            id="field-key"
                            type="text"
                            value={newField.key}
                            onChange={(e) =>
                              (setFieldFormError(""), setNewField({ ...newField, key: e.target.value }))
                            }
                            placeholder="e.g. preferredLocation"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs font-mono rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label htmlFor="field-type" className="block text-xs font-bold text-text-primary mb-1">
                            Expected Answer Type
                          </label>
                          <select
                            id="field-type"
                            value={newField.type}
                            onChange={(e) =>
                              setNewField({ ...newField, type: e.target.value })
                            }
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue cursor-pointer"
                          >
                            <option value="string">Text (Open text response)</option>
                            <option value="number">Numeric (e.g. budget, quantity)</option>
                            <option value="select">Dropdown (Specific list of choices)</option>
                            <option value="boolean">Yes / No (Boolean)</option>
                          </select>
                        </div>

                        {newField.type === "select" && (
                          <div>
                            <label htmlFor="qualification-options" className="block text-xs font-bold text-text-primary mb-1">
                              Choices (comma-separated) *
                            </label>
                            <input
                              id="qualification-options"
                              type="text"
                              value={newField.options}
                              onChange={(e) =>
                                (setFieldFormError(""), setNewField({
                                  ...newField,
                                  options: e.target.value,
                                }))
                              }
                              placeholder="e.g. 2 BHK, 3 BHK, 4 BHK, Villa"
                              className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                            />
                          </div>
                        )}

                        <div>
                          <label htmlFor="field-description" className="block text-xs font-bold text-text-primary mb-1">
                            Extraction Guidance for AI
                          </label>
                          <textarea
                            id="field-description"
                            rows={2}
                            value={newField.description}
                            onChange={(e) =>
                              setNewField({
                                ...newField,
                                description: e.target.value,
                              })
                            }
                            placeholder="Explain what to ask the customer or how to extract this information naturally..."
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFieldIndex(null);
                            setShowAddFieldModal(false);
                          }}
                          className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddField}
                          className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          {editingFieldIndex !== null ? "Save Changes" : "Save Field"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 5: CUSTOMER MESSAGES & GREETINGS ─────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Customer-Facing Notice Banner */}
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
                  <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Customer-Facing Setting</span>
                    <span className="text-[11px] opacity-90 leading-relaxed">
                      Changes made in this step are sent directly to real prospective customers on WhatsApp when they reach out or when an inbound call is missed. Use the live preview on the right to verify your message formatting before saving.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Message Editors (7 cols) */}
                  <div className="xl:col-span-7 space-y-6">
                    {/* Welcome Greeting Card */}
                    <div className="p-6 rounded-3xl bg-bg-secondary/40 border border-border-main space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-border-main">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <MessageCircle size={18} />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                              Automated Welcome Greeting
                            </h3>
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              Dispatched instantly when a new lead initiates a WhatsApp conversation.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Placeholders */}
                      <div>
                        <span className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                          Insert Dynamic Placeholders
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { key: "name", label: "{{name}}", desc: "Customer Name" },
                            { key: "company", label: "{{company}}", desc: "Brand Name" },
                            { key: "service", label: "{{service}}", desc: "Matched Service" },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                const current = aiSettings.welcomeMessageTemplate || DEFAULT_WELCOME_TEMPLATE;
                                setAiSettings({
                                  ...aiSettings,
                                  welcomeMessageTemplate: `${current} {{${item.key}}}`,
                                });
                              }}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-bg-card hover:bg-teal-500/10 hover:text-teal-600 border border-border-main transition-colors cursor-pointer"
                              title={`Insert ${item.desc}`}
                            >
                              + {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Welcome Message Textarea */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="welcome-template-input" className="block text-xs font-black text-text-primary uppercase tracking-wider">
                            Welcome Message Template
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setAiSettings({
                                ...aiSettings,
                                welcomeMessageTemplate: DEFAULT_WELCOME_TEMPLATE,
                              })
                            }
                            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset Default
                          </button>
                        </div>
                        <textarea
                          id="welcome-template-input"
                          rows={6}
                          value={
                            aiSettings.welcomeMessageTemplate !== undefined &&
                            aiSettings.welcomeMessageTemplate !== ""
                              ? aiSettings.welcomeMessageTemplate
                              : DEFAULT_WELCOME_TEMPLATE
                          }
                          onChange={(e) =>
                            setAiSettings({
                              ...aiSettings,
                              welcomeMessageTemplate: e.target.value,
                            })
                          }
                          placeholder={DEFAULT_WELCOME_TEMPLATE}
                          className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono leading-relaxed resize-none"
                        />
                      </div>

                      {/* Fallback Service Selection */}
                      <div>
                        <label htmlFor="fallback-service-select" className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                          Fallback Service (for general greetings)
                        </label>
                        <select
                          id="fallback-service-select"
                          value={aiSettings.welcomeMessageFallbackService || ""}
                          onChange={(e) =>
                            setAiSettings({
                              ...aiSettings,
                              welcomeMessageFallbackService: e.target.value,
                            })
                          }
                          className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer font-medium"
                        >
                          <option value="">Default to first catalog service</option>
                          {aiSettings.services.map((s, idx) => (
                            <option key={idx} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-text-secondary mt-1.5 block">
                          Used in place of <code className="text-teal-600 font-mono">{"{{service}}"}</code> if the initial message does not specify a product.
                        </span>
                      </div>
                    </div>

                    {/* Missed-Call Messages Card */}
                    <div className="p-6 rounded-3xl bg-bg-secondary/40 border border-border-main space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-border-main">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                            <PhoneMissed size={18} />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                              Automated Missed-Call Messages
                            </h3>
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              Auto-replies via WhatsApp when an incoming customer call is missed.
                            </p>
                          </div>
                        </div>

                        {/* Master Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">
                            {aiSettings.missedCallMessageEnabled ? "Active" : "Disabled"}
                          </span>
                          <button
                            type="button"
                            aria-label={aiSettings.missedCallMessageEnabled ? "Disable Missed Call Messages" : "Enable Missed Call Messages"}
                            onClick={() =>
                              setAiSettings({
                                ...aiSettings,
                                missedCallMessageEnabled: !aiSettings.missedCallMessageEnabled,
                              })
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              aiSettings.missedCallMessageEnabled ? "bg-rose-500" : "bg-border-main"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                aiSettings.missedCallMessageEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {aiSettings.missedCallMessageEnabled ? (
                        <div className="space-y-4">
                          {/* Tabs for Missed Call Types */}
                          <div className="flex p-1 bg-bg-card rounded-xl border border-border-main gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setMissedCallEditingTab("diff");
                                setCustomerMessagePreviewTab("missed_diff");
                              }}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                missedCallEditingTab === "diff"
                                  ? "bg-rose-500 text-white shadow-xs"
                                  : "text-text-secondary hover:text-text-primary"
                              }`}
                            >
                              <PhoneMissed className="w-3.5 h-3.5" />
                              Alternate Line (SIM 2)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMissedCallEditingTab("same");
                                setCustomerMessagePreviewTab("missed_same");
                              }}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                missedCallEditingTab === "same"
                                  ? "bg-teal-600 text-white shadow-xs"
                                  : "text-text-secondary hover:text-text-primary"
                              }`}
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              Same Line (SIM 1)
                            </button>
                          </div>

                          {missedCallEditingTab === "diff" ? (
                            <div className="space-y-3">
                              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                                <strong>Alternate SIM Notice:</strong> Sent when the customer calls a different phone number than your WhatsApp connection, explaining that they reached your other line.
                              </div>

                              <div>
                                <span className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                                  Insert Placeholders
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { key: "name", label: "{{name}}" },
                                    { key: "number", label: "{{number}}", highlight: true },
                                    { key: "company", label: "{{company}}" },
                                    { key: "service", label: "{{service}}" },
                                  ].map((item) => (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => {
                                        const current = aiSettings.missedCallDifferentNumberTemplate || DEFAULT_MISSED_CALL_DIFF_TEMPLATE;
                                        setAiSettings({
                                          ...aiSettings,
                                          missedCallDifferentNumberTemplate: `${current} {{${item.key}}}`,
                                        });
                                      }}
                                      className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                                        item.highlight
                                          ? "bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20"
                                          : "bg-bg-card hover:bg-rose-500/10 text-text-primary border-border-main"
                                      }`}
                                    >
                                      + {item.label} {item.highlight ? "★ (Received SIM)" : ""}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label htmlFor="missed-call-diff-template" className="block text-xs font-black text-text-primary uppercase tracking-wider">
                                    Alternate SIM Message Template
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAiSettings({
                                        ...aiSettings,
                                        missedCallDifferentNumberTemplate: DEFAULT_MISSED_CALL_DIFF_TEMPLATE,
                                      })
                                    }
                                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset Default
                                  </button>
                                </div>
                                <textarea
                                  id="missed-call-diff-template"
                                  rows={5}
                                  value={
                                    aiSettings.missedCallDifferentNumberTemplate !== undefined &&
                                    aiSettings.missedCallDifferentNumberTemplate !== ""
                                      ? aiSettings.missedCallDifferentNumberTemplate
                                      : DEFAULT_MISSED_CALL_DIFF_TEMPLATE
                                  }
                                  onChange={(e) =>
                                    setAiSettings({
                                      ...aiSettings,
                                      missedCallDifferentNumberTemplate: e.target.value,
                                    })
                                  }
                                  placeholder={DEFAULT_MISSED_CALL_DIFF_TEMPLATE}
                                  className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono leading-relaxed resize-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-700 dark:text-teal-300">
                                <strong>Same SIM Notice:</strong> Sent when the customer calls the exact same mobile number connected to WhatsApp.
                              </div>

                              <div>
                                <span className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                                  Insert Placeholders
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { key: "name", label: "{{name}}" },
                                    { key: "company", label: "{{company}}" },
                                    { key: "service", label: "{{service}}" },
                                  ].map((item) => (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => {
                                        const current = aiSettings.missedCallMessageTemplate || DEFAULT_MISSED_CALL_SAME_TEMPLATE;
                                        setAiSettings({
                                          ...aiSettings,
                                          missedCallMessageTemplate: `${current} {{${item.key}}}`,
                                        });
                                      }}
                                      className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-bg-card hover:bg-teal-500/10 text-text-primary border border-border-main transition-colors cursor-pointer"
                                    >
                                      + {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label htmlFor="missed-call-same-template" className="block text-xs font-black text-text-primary uppercase tracking-wider">
                                    Same SIM Message Template
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAiSettings({
                                        ...aiSettings,
                                        missedCallMessageTemplate: DEFAULT_MISSED_CALL_SAME_TEMPLATE,
                                      })
                                    }
                                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset Default
                                  </button>
                                </div>
                                <textarea
                                  id="missed-call-same-template"
                                  rows={5}
                                  value={
                                    aiSettings.missedCallMessageTemplate !== undefined &&
                                    aiSettings.missedCallMessageTemplate !== ""
                                      ? aiSettings.missedCallMessageTemplate
                                      : DEFAULT_MISSED_CALL_SAME_TEMPLATE
                                  }
                                  onChange={(e) =>
                                    setAiSettings({
                                      ...aiSettings,
                                      missedCallMessageTemplate: e.target.value,
                                    })
                                  }
                                  placeholder={DEFAULT_MISSED_CALL_SAME_TEMPLATE}
                                  className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono leading-relaxed resize-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-bg-card border border-border-main text-center text-xs text-text-secondary">
                          Automated missed-call replies are currently turned off. Toggle the switch above to activate them.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Realistic WhatsApp Phone Preview (5 cols) */}
                  <div className="xl:col-span-5 sticky top-6">
                    <div className="bg-bg-card border border-border-main rounded-3xl p-5 shadow-sm space-y-4">
                      {/* Preview Controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Eye size={14} className="text-emerald-500" />
                          <span>WhatsApp Live Preview</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Realistic Demo
                        </span>
                      </div>

                      {/* Preview Tab Selector */}
                      <div className="flex p-1 bg-bg-secondary rounded-xl border border-border-main gap-1 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setCustomerMessagePreviewTab("welcome")}
                          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                            customerMessagePreviewTab === "welcome"
                              ? "bg-bg-card text-emerald-600 shadow-2xs font-bold"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          Welcome
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerMessagePreviewTab("missed_diff")}
                          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                            customerMessagePreviewTab === "missed_diff"
                              ? "bg-bg-card text-rose-500 shadow-2xs font-bold"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          Alternate SIM
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerMessagePreviewTab("missed_same")}
                          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                            customerMessagePreviewTab === "missed_same"
                              ? "bg-bg-card text-teal-600 shadow-2xs font-bold"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          Same SIM
                        </button>
                      </div>

                      {/* Phone Container Mock */}
                      <div className="rounded-2xl border-2 border-slate-800 dark:border-slate-700 overflow-hidden shadow-lg bg-[#0c1317]">
                        {/* WhatsApp Top Header Bar */}
                        <div className="bg-[#1f2c34] text-white px-3.5 py-3 flex items-center justify-between border-b border-slate-700/60">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ArrowLeft size={16} className="text-slate-300 shrink-0" />
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                              {(aiSettings.companyName || org.name || "S").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs text-slate-100 truncate">
                                  {aiSettings.companyName || org.name || "Our Business"}
                                </span>
                                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                              </div>
                              <span className="text-[10px] text-slate-400 block leading-tight">
                                online
                              </span>
                            </div>
                          </div>
                          <Phone size={15} className="text-slate-300 shrink-0" />
                        </div>

                        {/* WhatsApp Chat Canvas */}
                        <div className="p-4 min-h-[260px] max-h-[340px] overflow-y-auto space-y-3 bg-[#0b141a]/95 text-slate-200 text-xs">
                          {/* Centered Date Pill */}
                          <div className="text-center">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#182229] text-[10px] text-slate-400 font-medium shadow-xs">
                              TODAY
                            </span>
                          </div>

                          {/* Customer Incoming Query (for realistic context) */}
                          <div className="flex justify-start">
                            <div className="max-w-[85%] rounded-2xl rounded-tl-xs p-3 bg-[#202c33] text-slate-200 shadow-xs space-y-1">
                              <p className="text-[11px] leading-relaxed">
                                {customerMessagePreviewTab === "welcome"
                                  ? "Hi, I saw your advertisement and wanted more details about your services."
                                  : "📞 Missed voice call from customer"}
                              </p>
                              <span className="text-[9px] text-slate-400 text-right block">
                                10:41 AM
                              </span>
                            </div>
                          </div>

                          {/* Outgoing Automated Reply Bubble */}
                          <div className="flex justify-end">
                            <div className="max-w-[90%] rounded-2xl rounded-tr-xs p-3 bg-[#005c4b] text-slate-100 shadow-md space-y-1.5 relative">
                              <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap font-sans select-none">
                                {customerMessagePreviewTab === "welcome" &&
                                  renderFormattedWhatsAppText(
                                    getWhatsAppPreviewText(
                                      aiSettings.welcomeMessageTemplate || DEFAULT_WELCOME_TEMPLATE,
                                      "welcome"
                                    )
                                  )}
                                {customerMessagePreviewTab === "missed_diff" &&
                                  renderFormattedWhatsAppText(
                                    getWhatsAppPreviewText(
                                      aiSettings.missedCallDifferentNumberTemplate || DEFAULT_MISSED_CALL_DIFF_TEMPLATE,
                                      "missed_diff"
                                    )
                                  )}
                                {customerMessagePreviewTab === "missed_same" &&
                                  renderFormattedWhatsAppText(
                                    getWhatsAppPreviewText(
                                      aiSettings.missedCallMessageTemplate || DEFAULT_MISSED_CALL_SAME_TEMPLATE,
                                      "missed_same"
                                    )
                                  )}
                              </div>

                              <div className="flex items-center justify-end gap-1 pt-1 text-[9px] text-emerald-200/80">
                                <span>10:42 AM</span>
                                <CheckCheck size={13} className="text-sky-400" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Message Input Bar Mock */}
                        <div className="bg-[#202c33] px-3 py-2 flex items-center justify-between text-slate-400 border-t border-slate-700/60 text-xs">
                          <span className="text-slate-400 text-[11px]">Message</span>
                          <Smile size={16} />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-bg-secondary text-[11px] text-text-secondary flex items-center gap-2">
                        <Info size={13} className="text-pilot-blue shrink-0" />
                        <span>
                          Customer placeholders like <code className="text-pilot-blue font-bold">{"{{name}}"}</code> are automatically populated from the lead's contact record.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 6: COMPANY KNOWLEDGE DOCUMENTS ────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Knowledge Base Header Banner */}
                <div className="p-5 rounded-2xl bg-bg-secondary/50 border border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-pilot-blue" />
                      <h4 className="text-xs font-black text-text-primary">
                        Company Knowledge Library
                      </h4>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Searchable reference library used by your AI assistant to accurately answer customer questions and product FAQs.
                    </p>
                  </div>

                  <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-bg-card border border-border-main text-pilot-blue">
                    {aiSettings.qdrantCollection ||
                      `sb_kb_${(org.name || "tenant").toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
                  </span>
                </div>

                {/* AI Knowledge Base Generator Prompt Card */}
                <KBGeneratorPromptCard
                  businessName={aiSettings.companyName || org.name}
                />

                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-black text-text-primary mb-2 uppercase tracking-wider">
                    Upload Training Documents (.PDF, .DOCX, .TXT, .MD)
                  </label>
                  <label className="p-8 border-2 border-dashed border-border-main hover:border-pilot-blue rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all bg-bg-secondary/30 hover:bg-pilot-blue/5 group">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-bg-card border border-border-main flex items-center justify-center text-pilot-blue mb-3 group-hover:scale-110 transition-transform shadow-xs">
                      {uploadingDoc ? (
                        <RefreshCw
                          size={20}
                          className="animate-spin text-pilot-blue"
                        />
                      ) : (
                        <Upload size={20} />
                      )}
                    </div>
                    <span className="text-xs font-bold text-text-primary">
                      {uploadingDoc
                        ? "Reading & processing document for AI search..."
                        : "Click or drag & drop files here"}
                    </span>
                    <span className="text-[11px] text-text-secondary mt-1">
                      PDF, DOCX, or text files up to 25 MB per document
                    </span>
                  </label>
                </div>

                {/* Indexed Documents Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                    Indexed Knowledge Documents ({aiSettings.knowledgeDocs.length})
                  </h4>

                  {aiSettings.knowledgeDocs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-bg-secondary/40 border border-border-main text-center text-xs text-text-secondary">
                      No documents indexed yet. Upload your product brochures, spec sheets, or pricing FAQs above to give your AI authoritative reference material.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aiSettings.knowledgeDocs.map((doc, idx) => (
                        <div
                          key={doc.docId || idx}
                          className="p-3.5 rounded-2xl bg-bg-secondary/40 border border-border-main flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-bg-card border border-border-main text-pilot-blue shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-text-primary truncate">
                                {doc.originalName || doc.fileName}
                              </div>
                              <div className="text-[10px] text-text-secondary flex items-center gap-2 mt-0.5">
                                <span>
                                  {doc.fileSize
                                    ? `${Math.round(doc.fileSize / 1024)} KB`
                                    : "1.2 MB"}
                                </span>
                                <span>&bull;</span>
                                <span className="text-pilot-blue font-bold">
                                  {doc.chunkCount || 12} searchable sections
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Indexed
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.docId)}
                              className="text-text-secondary hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Document"
                              aria-label={`Remove knowledge document ${doc.filename || doc.originalName || "document"}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 7: REVIEW & TEST AI ASSISTANT ─────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 7 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Pre-flight Requirement Verification Card */}
                <div className="p-5 rounded-2xl border border-border-main bg-bg-secondary/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                        Pre-Activation Requirements Checklist
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        aiSettings.companyName?.trim() &&
                        aiSettings.geminiApiKey?.trim() &&
                        aiSettings.services?.length > 0 &&
                        aiSettings.qualificationFields?.length > 0
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {aiSettings.companyName?.trim() &&
                      aiSettings.geminiApiKey?.trim() &&
                      aiSettings.services?.length > 0 &&
                      aiSettings.qualificationFields?.length > 0
                        ? "Ready to Activate"
                        : "Requirements Incomplete"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {/* Item 1: Business Profile */}
                    <div
                      onClick={() => !aiSettings.companyName?.trim() && setCurrentStep(1)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.companyName?.trim()
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-text-primary block">
                          1. Business Profile
                        </span>
                        <span className="text-[10px] text-text-secondary truncate block max-w-[120px]">
                          {aiSettings.companyName || "Name required"}
                        </span>
                      </div>
                      {aiSettings.companyName?.trim() ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 underline">
                          Fix in Step 1
                        </span>
                      )}
                    </div>

                    {/* Item 2: AI Connection */}
                    <div
                      onClick={() => !aiSettings.geminiApiKey?.trim() && setCurrentStep(2)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.geminiApiKey?.trim()
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-text-primary block">
                          2. Gemini API Key
                        </span>
                        <span className="text-[10px] text-text-secondary block">
                          {aiSettings.geminiApiKey?.trim() ? "Configured" : "Key missing"}
                        </span>
                      </div>
                      {aiSettings.geminiApiKey?.trim() ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 underline">
                          Fix in Step 2
                        </span>
                      )}
                    </div>

                    {/* Item 3: Catalog Services */}
                    <div
                      onClick={() => aiSettings.services?.length === 0 && setCurrentStep(3)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.services?.length > 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-text-primary block">
                          3. Services Catalog
                        </span>
                        <span className="text-[10px] text-text-secondary block">
                          {aiSettings.services?.length || 0} configured
                        </span>
                      </div>
                      {aiSettings.services?.length > 0 ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 underline">
                          Fix in Step 3
                        </span>
                      )}
                    </div>

                    {/* Item 4: Lead Questions */}
                    <div
                      onClick={() => aiSettings.qualificationFields?.length === 0 && setCurrentStep(4)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.qualificationFields?.length > 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-text-primary block">
                          4. Lead Questions
                        </span>
                        <span className="text-[10px] text-text-secondary block">
                          {aiSettings.qualificationFields?.length || 0} questions
                        </span>
                      </div>
                      {aiSettings.qualificationFields?.length > 0 ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 underline">
                          Fix in Step 4
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scorecard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Agent Persona
                    </span>
                    <span className="text-xs font-black text-pilot-blue mt-1 block truncate" title={aiSettings.agentPersona}>
                      {aiSettings.companyName || org.name || "Configured"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Catalog Services
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.services?.length || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Lead Questions
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.qualificationFields?.length || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Knowledge Docs
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.knowledgeDocs?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Prompt Inspector */}
                <div className="p-5 rounded-2xl bg-bg-secondary/30 border border-border-main space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Terminal size={16} className="text-pilot-blue" />
                      <h4 className="text-xs font-black text-text-primary">
                        Compiled AI System Prompt
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyPromptText}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-card border border-border-main text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {copiedPrompt ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedPrompt ? "Copied" : "Copy"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setShowPromptInspector(!showPromptInspector)
                        }
                        className="text-xs font-bold text-pilot-blue hover:underline cursor-pointer"
                      >
                        {showPromptInspector
                          ? "Collapse"
                          : "Expand Full Prompt"}
                      </button>
                    </div>
                  </div>

                  {showPromptInspector ? (
                    <pre className="p-4 rounded-xl bg-[#0b1727] text-slate-200 border border-slate-700/60 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                      {`You are a ${aiSettings.agentPersona} working at ${aiSettings.companyName || org.name || "Our Company"}.\n\nCOMPANY OVERVIEW:\n${aiSettings.businessDescription}\n\nCORE PRODUCTS:\n${aiSettings.services.map((s, i) => `${i + 1}. ${s.name} - ${s.description}`).join("\n")}\n\nCRITICAL RULES:\n${aiSettings.customInstructions}`}
                    </pre>
                  ) : (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Your prompt is compiled dynamically from your Persona, Services Catalog, Lead Questions, and Knowledge Base documents. Click "Expand Full Prompt" above to review before testing.
                    </p>
                  )}
                </div>

                {/* Playground Launch Callout */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-pilot-blue/10 via-pilot-blue/5 to-transparent border border-pilot-blue/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-sm font-black text-text-primary">
                      Ready to Test Your Custom Sales AI?
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Simulate real customer inquiries and test qualification in the interactive WhatsApp playground before activating.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/test-ai")}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-md shadow-pilot-blue/20 shrink-0 cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Open AI Playground</span>
                  </button>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* ── STEP 8: SUBSCRIPTION & SEATS ───────────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {currentStep === 8 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-pilot-blue/10 border border-pilot-blue/20 text-xs text-text-primary flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Building2 size={16} className="text-pilot-blue shrink-0" />
                    <span>
                      <strong>Billing & Seat Management:</strong> Kept separate from AI configuration so licensing changes do not interrupt your assistant's setup.
                    </span>
                  </div>
                </div>
                {renderSubscriptionAndSeatsContent()}
              </div>
            )}

            {/* ── Persistent Step Navigation Footer ───────────────────────── */}
            <div className="sticky bottom-0 z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3.5 sm:py-4 bg-bg-card/95 backdrop-blur border-t border-border-main flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 w-auto min-w-0">
              <div className="flex items-center gap-2 text-xs text-text-secondary min-w-0" aria-live="polite">
                {aiSaving ? (
                  <><Loader2 size={14} className="animate-spin text-pilot-blue shrink-0" /><span>Saving changes…</span></>
                ) : saveToast ? (
                  <><Info size={14} className="text-pilot-blue shrink-0" /><span className="truncate">{saveToast}</span></>
                ) : (
                  <span className="truncate">Save to apply these settings across your organization.</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end shrink-0">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} className="shrink-0" />
                    <span>Previous</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => handleSaveStep()}
                  disabled={aiSaving}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-xs font-bold text-text-primary hover:bg-bg-secondary/70 transition-colors cursor-pointer"
                  title="Save changes to your organization without navigating to the next step"
                >
                  {aiSaving ? "Saving..." : "Save Draft"}
                </button>

                {currentStep < 7 ? (
                  <button
                    type="button"
                    onClick={() => handleSaveStep(null, currentStep + 1)}
                    disabled={aiSaving}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-sm shadow-pilot-blue/20 cursor-pointer"
                  >
                    <span>Save & Continue to Step {currentStep + 1}</span>
                    <span className="hidden xl:inline font-normal opacity-85">({STEPS[currentStep]?.shortTitle || ""})</span>
                    <ChevronRight size={16} className="shrink-0" />
                  </button>
                ) : currentStep === 7 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(8)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                    >
                      <span>Subscription & Seats</span>
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishSetup}
                      disabled={aiSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
                    >
                      <CheckCheck size={16} />
                      <span>
                        {aiSaving ? "Activating..." : "Finish & Activate AI"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <span>Return to Step 1</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── 1. DEDICATED SERVICES CATALOG JSON IMPORT MODAL ────────── */}
          {showServicesImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
              <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl space-y-4">
                {/* Modal Header */}
                <div className="flex justify-between items-start pb-3 border-b border-border-main shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0">
                      <Layers size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-text-primary">
                          Import Services Catalog (JSON)
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20">
                          Step 3 Catalog
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Paste an array of products or services. The AI matches
                        customer inquiries to these offerings.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowServicesImportModal(false);
                      setServicesImportText("");
                      setServicesParsedResult(null);
                      setServicesParseError("");
                    }}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyServicesJson}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Copy currently configured services as JSON"
                      >
                        {copiedServicesJson ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>
                          {copiedServicesJson ? "Copied!" : "Copy Current"}
                        </span>
                      </button>

                      {servicesImportText && (
                        <button
                          type="button"
                          onClick={() => {
                            setServicesImportText("");
                            setServicesParsedResult(null);
                            setServicesParseError("");
                          }}
                          className="text-[11px] text-text-secondary hover:text-red-500 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      rows={8}
                      value={servicesImportText}
                      onChange={(e) => handleServicesTextChange(e.target.value)}
                      placeholder={`[\n  {\n    "name": "General Enquiry",\n    "description": "General consultation and customer requirements assessment.",\n    "keywords": ["enquiry", "information", "help", "consultation"],\n    "category": "General"\n  },\n  {\n    "name": "Residential Consultation",\n    "description": "Tailored on-site assessment for residential projects.",\n    "keywords": ["home", "villa", "apartment"],\n    "category": "Residential"\n  }\n]`}
                      className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs font-mono rounded-2xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all leading-relaxed"
                    />
                  </div>

                  {/* Strategy selection */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-bg-secondary/30 border border-border-main">
                    <div>
                      <span className="text-xs font-bold text-text-primary block">
                        Import Strategy
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        Choose whether to overwrite current catalog or append
                        new services.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setServicesImportMergeStrategy("replace")
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          servicesImportMergeStrategy === "replace"
                            ? "bg-pilot-blue text-white shadow-2xs"
                            : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Replace Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setServicesImportMergeStrategy("merge")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          servicesImportMergeStrategy === "merge"
                            ? "bg-pilot-blue text-white shadow-2xs"
                            : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Append / Merge
                      </button>
                    </div>
                  </div>

                  {/* Error display */}
                  {servicesParseError && (
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold">Invalid Services JSON</div>
                        <div className="font-mono text-[11px] opacity-90">
                          {servicesParseError}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview of detected services */}
                  {servicesParsedResult && servicesParsedResult.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle2 size={16} />
                          <span>
                            Detected {servicesParsedResult.length} Services
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          Ready to Apply
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {servicesParsedResult.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-bg-card border border-border-main text-text-primary flex items-center gap-1.5"
                          >
                            <span className="font-bold text-pilot-blue">
                              {s.name}
                            </span>
                            {s.keywords?.length > 0 && (
                              <span className="text-text-secondary text-[9px]">
                                ({s.keywords.length} tags)
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-border-main shrink-0">
                  <span className="text-[11px] text-text-secondary">
                    {servicesImportMergeStrategy === "replace"
                      ? "Overwrites catalog with imported services"
                      : "Appends new services without duplicates"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowServicesImportModal(false);
                        setServicesImportText("");
                        setServicesParsedResult(null);
                        setServicesParseError("");
                      }}
                      className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyServicesImport}
                      disabled={
                        !servicesParsedResult ||
                        servicesParsedResult.length === 0 ||
                        aiSaving
                      }
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={15} />
                      <span>
                        {servicesParsedResult?.length
                          ? `Import ${servicesParsedResult.length} Services`
                          : "Import Services"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. DEDICATED QUALIFICATION CRITERIA JSON IMPORT MODAL ──────── */}
          {showQualificationImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
              <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl space-y-4">
                {/* Modal Header */}
                <div className="flex justify-between items-start pb-3 border-b border-border-main shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <ListFilter size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-text-primary">
                          Import Qualification Schema (JSON)
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          Step 3 Schema
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Paste qualification criteria questions. The AI
                        representative gathers these answers during
                        conversation.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowQualificationImportModal(false);
                      setQualificationImportText("");
                      setQualificationParsedResult(null);
                      setQualificationParseError("");
                    }}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  {/* Quick helpers bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-text-secondary">
                        Helper:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleQualificationTextChange(
                            SAMPLE_QUALIFICATION_JSON,
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-bg-secondary border border-border-main hover:border-pilot-blue/40 text-text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Insert Sample Criteria
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyQualificationJson}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Copy currently configured criteria as JSON"
                      >
                        {copiedQualificationJson ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>
                          {copiedQualificationJson ? "Copied!" : "Copy Current"}
                        </span>
                      </button>

                      {qualificationImportText && (
                        <button
                          type="button"
                          onClick={() => {
                            setQualificationImportText("");
                            setQualificationParsedResult(null);
                            setQualificationParseError("");
                          }}
                          className="text-[11px] text-text-secondary hover:text-red-500 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      rows={8}
                      value={qualificationImportText}
                      onChange={(e) =>
                        handleQualificationTextChange(e.target.value)
                      }
                      placeholder={`[\n  {\n    "key": "cityAndArea",\n    "label": "City & Area",\n    "type": "string",\n    "description": "Customer location"\n  },\n  {\n    "key": "budgetRange",\n    "label": "Budget Range",\n    "type": "select",\n    "options": ["Under ₹5 Lakh", "₹5-15 Lakh", "₹15-30 Lakh+"],\n    "description": "Customer budget"\n  }\n]`}
                      className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs font-mono rounded-2xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all leading-relaxed"
                    />
                  </div>

                  {/* Strategy selection */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-bg-secondary/30 border border-border-main">
                    <div>
                      <span className="text-xs font-bold text-text-primary block">
                        Import Strategy
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        Choose whether to overwrite questions or append without
                        duplicate keys.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setQualificationImportMergeStrategy("replace")
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          qualificationImportMergeStrategy === "replace"
                            ? "bg-pilot-blue text-white shadow-2xs"
                            : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Replace Existing
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setQualificationImportMergeStrategy("merge")
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          qualificationImportMergeStrategy === "merge"
                            ? "bg-pilot-blue text-white shadow-2xs"
                            : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Append / Merge
                      </button>
                    </div>
                  </div>

                  {/* Error display */}
                  {qualificationParseError && (
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold">Invalid Criteria JSON</div>
                        <div className="font-mono text-[11px] opacity-90">
                          {qualificationParseError}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {qualificationParsedResult &&
                    qualificationParsedResult.length > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <CheckCircle2 size={16} />
                            <span>
                              Detected {qualificationParsedResult.length}{" "}
                              Criteria Fields
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                            Ready
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {qualificationParsedResult.map((f, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-bg-card border border-border-main text-text-primary flex items-center gap-1.5"
                            >
                              <span className="font-bold">{f.label}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-pilot-blue/10 text-pilot-blue uppercase">
                                {f.type}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-border-main shrink-0">
                  <span className="text-[11px] text-text-secondary">
                    {qualificationImportMergeStrategy === "replace"
                      ? "Overwrites criteria with imported questions"
                      : "Appends new questions without duplicates"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQualificationImportModal(false);
                        setQualificationImportText("");
                        setQualificationParsedResult(null);
                        setQualificationParseError("");
                      }}
                      className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyQualificationImport}
                      disabled={
                        !qualificationParsedResult ||
                        qualificationParsedResult.length === 0 ||
                        aiSaving
                      }
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={15} />
                      <span>
                        {qualificationParsedResult?.length
                          ? `Import ${qualificationParsedResult.length} Criteria`
                          : "Import Criteria"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showAiGuidanceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-bg-card border border-border-main/80 rounded-[28px] max-w-[900px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all">
                {/* ── MODAL HEADER ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border-main/70 shrink-0 bg-white dark:bg-bg-card">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/15 border border-pilot-blue/20 text-pilot-blue flex items-center justify-center shadow-xs shrink-0">
                      <Sparkles size={22} className="text-pilot-blue" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight truncate">
                          AI Document Extraction Guide
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20 uppercase tracking-wide shrink-0">
                          SYSTEM PROMPT
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-1 sm:line-clamp-none">
                        Upload your business PDF, brochure, or catalog to
                        ChatGPT, Claude, or Gemini and generate the exact CRM
                        configuration.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAiGuidanceModal(false)}
                    aria-label="Close modal"
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-border-main/80 text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-secondary transition-all cursor-pointer shrink-0 ml-2"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* ── SEGMENTED NAVIGATION TABS ─────────────────────────────────── */}
                <div className="px-5 sm:px-6 pt-4 pb-1 bg-white dark:bg-bg-card shrink-0">
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-bg-secondary/80 border border-border-main/70 rounded-2xl gap-1">
                    <button
                      type="button"
                      onClick={() => setGuidanceTab("prompt")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        guidanceTab === "prompt"
                          ? "bg-pilot-blue text-white shadow-xs"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/60 dark:hover:bg-bg-card/60"
                      }`}
                    >
                      <FileText size={15} />
                      <span className="hidden sm:inline">01.</span>
                      <span>Extraction Prompt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGuidanceTab("steps")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        guidanceTab === "steps"
                          ? "bg-pilot-blue text-white shadow-xs"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/60 dark:hover:bg-bg-card/60"
                      }`}
                    >
                      <Lightbulb size={15} />
                      <span className="hidden sm:inline">02.</span>
                      <span>How It Works</span>
                    </button>
                  </div>
                </div>

                {/* ── MODAL INDEPENDENT SCROLLABLE BODY ─────────────────────────── */}
                <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-6">
                  {guidanceTab === "prompt" && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-pilot-blue/10 border border-blue-200/80 dark:border-pilot-blue/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-pilot-blue/15 text-pilot-blue flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles size={16} />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-black text-text-primary tracking-tight">
                                Ready-to-Use Extraction Prompt
                              </h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-bg-card border border-blue-200 dark:border-pilot-blue/30 text-pilot-blue">
                                9,067 chars
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              Compatible with ChatGPT, Claude, and Google
                              Gemini.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyExtractionPrompt}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer w-full sm:w-auto"
                        >
                          {copiedExtractionPrompt ? (
                            <>
                              <Check size={14} />
                              <span>Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy Full Prompt</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code-Editor Style Prompt Container */}
                      <div className="rounded-2xl bg-[#0a0f1d] border border-slate-800/90 overflow-hidden shadow-sm flex flex-col">
                        {/* Window Header Bar */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono select-none">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                            </div>
                            <span className="font-bold text-slate-300 tracking-wider text-[10px]">
                              SYSTEM PROMPT
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                            READ ONLY
                          </span>
                        </div>

                        {/* Code Pre Block */}
                        <pre className="p-4 sm:p-5 text-slate-300 text-[11px] sm:text-xs font-mono whitespace-pre-wrap leading-relaxed  overflow-y-auto select-all">
                          {AI_EXTRACTION_SYSTEM_PROMPT}
                        </pre>

                        {/* Editor Sub-Footer */}
                        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Info size={13} className="text-pilot-blue" />
                            <span>
                              Copy this prompt and attach your business
                              document.
                            </span>
                          </span>
                          <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
                            markdown / json schema
                          </span>
                        </div>
                      </div>

                      {/* Step Action Helper Card */}
                      <div
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 ${
                          copiedExtractionPrompt
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-50 dark:bg-bg-secondary/40 border-border-main/80 text-text-secondary"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              copiedExtractionPrompt
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-pilot-blue/10 text-pilot-blue"
                            }`}
                          >
                            {copiedExtractionPrompt ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <Copy size={15} />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text-primary">
                              {copiedExtractionPrompt
                                ? "System Prompt Copied!"
                                : "Step 1: Copy this prompt, then proceed to next step"}
                            </div>
                            <p className="text-[11px] opacity-85 mt-0.5">
                              {copiedExtractionPrompt
                                ? "Now click 'Next Step' at the bottom to see how to upload your document to ChatGPT, Claude, or Gemini."
                                : "Click 'Copy Full Prompt' above. Once copied, click 'Next Step' at the bottom to continue."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                          {!copiedExtractionPrompt && (
                            <button
                              type="button"
                              onClick={handleCopyExtractionPrompt}
                              className="px-3.5 py-2 rounded-xl bg-bg-card border border-border-main hover:border-pilot-blue/40 text-text-primary text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              Copy Prompt
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setGuidanceTab("steps")}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <span>Next Step</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ TAB 2: HOW IT WORKS ═════════════════════════════════════ */}
                  {guidanceTab === "steps" && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Step Section Header */}
                      <div>
                        <h4 className="text-sm font-black text-text-primary tracking-tight">
                          How the AI extraction workflow works
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Generate structured CRM configuration from your
                          business documents in three simple steps.
                        </p>
                      </div>

                      {/* 3 Step Connected Cards */}
                      <div className="relative">
                        {/* Subtle connecting track on desktop */}
                        <div className="hidden md:block absolute top-10 left-12 right-12 h-[2px] bg-border-main/70 pointer-events-none z-0" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                          {/* Step 1 */}
                          <div className="p-5 rounded-2xl bg-white dark:bg-bg-secondary/40 border border-border-main/80 hover:border-pilot-blue/40 transition-all flex flex-col justify-between h-full shadow-2xs group">
                            <div className="space-y-3">
                              <div className="w-10 h-10 rounded-xl bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-pilot-blue group-hover:text-white transition-all shadow-xs">
                                01
                              </div>
                              <div className="space-y-1">
                                <h5 className="text-xs font-black text-text-primary tracking-tight">
                                  Copy the extraction prompt
                                </h5>
                                <p className="text-[11px] text-text-secondary leading-relaxed">
                                  Copy the ready-to-use system prompt and open
                                  ChatGPT, Claude, or Gemini.
                                </p>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-border-main/50 mt-3 text-[10px] font-bold text-pilot-blue flex items-center gap-1">
                              <Copy size={12} />
                              <span>One-click copy</span>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="p-5 rounded-2xl bg-white dark:bg-bg-secondary/40 border border-border-main/80 hover:border-pilot-blue/40 transition-all flex flex-col justify-between h-full shadow-2xs group">
                            <div className="space-y-3">
                              <div className="w-10 h-10 rounded-xl bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-pilot-blue group-hover:text-white transition-all shadow-xs">
                                02
                              </div>
                              <div className="space-y-1">
                                <h5 className="text-xs font-black text-text-primary tracking-tight">
                                  Upload your business document
                                </h5>
                                <p className="text-[11px] text-text-secondary leading-relaxed">
                                  Attach your company brochure, PDF, product
                                  catalog, pricing document, or website content.
                                </p>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-border-main/50 mt-3 text-[10px] font-bold text-pilot-blue flex items-center gap-1">
                              <FileText size={12} />
                              <span>PDF / Word / TXT</span>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="p-5 rounded-2xl bg-white dark:bg-bg-secondary/40 border border-border-main/80 hover:border-pilot-blue/40 transition-all flex flex-col justify-between h-full shadow-2xs group">
                            <div className="space-y-3">
                              <div className="w-10 h-10 rounded-xl bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-pilot-blue group-hover:text-white transition-all shadow-xs">
                                03
                              </div>
                              <div className="space-y-1">
                                <h5 className="text-xs font-black text-text-primary tracking-tight">
                                  Import the generated configuration
                                </h5>
                                <p className="text-[11px] text-text-secondary leading-relaxed">
                                  Paste the AI-generated JSON into the CRM and
                                  automatically configure your services and
                                  qualification questions.
                                </p>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-border-main/50 mt-3 text-[10px] font-bold text-pilot-blue flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>Automatic parsing</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Best Practices Section */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-bg-secondary/30 border border-border-main/80 space-y-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Lightbulb size={16} />
                          </div>
                          <h5 className="text-xs font-black text-text-primary tracking-tight">
                            Best Practices
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-white dark:bg-bg-card border border-border-main/60 space-y-1">
                            <span className="font-bold text-text-primary block text-[11px]">
                              1. Multiple Offerings
                            </span>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              If your brochure contains multiple packages or
                              tiers, the AI can create separate service cards
                              with keyword tags.
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white dark:bg-bg-card border border-border-main/60 space-y-1">
                            <span className="font-bold text-text-primary block text-[11px]">
                              2. Industry-Specific Questions
                            </span>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              The prompt generates relevant lead qualification
                              questions based on the business type.
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white dark:bg-bg-card border border-border-main/60 space-y-1">
                            <span className="font-bold text-text-primary block text-[11px]">
                              3. Direct Import
                            </span>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              Paste the services JSON in Step 2 and lead
                              questions in Step 3 of the setup wizard.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 Finish / Ready Action Card */}
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text-primary">
                              Ready to configure your AI assistant?
                            </div>
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              Close this guide and use "Import Services (JSON)"
                              in Step 2 or "Import Criteria (JSON)" in Step 3.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAiGuidanceModal(false)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                        >
                          <span>Got It, Start Setup</span>
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 4. AI ACTIVATION RESULT POPUP MODAL (SUCCESS / FAILED) ── */}
          {activationResultModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white dark:bg-bg-card border border-border-main rounded-[28px] max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 text-center relative animate-scaleUp">
                {/* Close 'X' button */}
                <button
                  type="button"
                  onClick={() => setActivationResultModal(null)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-secondary transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>

                {activationResultModal.success ? (
                  <>
                    {/* Success Icon */}
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <CheckCircle2
                        size={36}
                        className="text-emerald-500 animate-pulse"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live & Activated
                      </span>
                      <h3 className="text-lg font-black text-text-primary tracking-tight">
                        {activationResultModal.title ||
                          "AI Sales Pilot Activated!"}
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
                        {activationResultModal.message}
                      </p>
                    </div>

                    {/* Quick Config Summary */}
                    {activationResultModal.details && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-bg-secondary/40 border border-border-main/70 text-left space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">
                            Brand Name:
                          </span>
                          <span className="font-bold text-text-primary">
                            {activationResultModal.details.brandName ||
                              "Active"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">
                            Catalog Offerings:
                          </span>
                          <span className="font-bold text-pilot-blue">
                            {activationResultModal.details.servicesCount} items
                            active
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">
                            Lead Criteria:
                          </span>
                          <span className="font-bold text-pilot-blue">
                            {activationResultModal.details.questionsCount}{" "}
                            questions active
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">
                            Gemini Engine:
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check size={13} />
                            <span>Connected</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActivationResultModal(null)}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-secondary transition-all cursor-pointer"
                      >
                        Keep Editing
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActivationResultModal(null);
                          navigate("/dashboard");
                        }}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Go to Dashboard</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Failure / Incomplete Icon */}
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
                      <AlertTriangle size={36} className="text-rose-500" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Action Required
                      </span>
                      <h3 className="text-lg font-black text-text-primary tracking-tight">
                        {activationResultModal.title || "Activation Incomplete"}
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
                        {activationResultModal.message}
                      </p>
                    </div>

                    {/* Missing Steps / Errors List */}
                    {activationResultModal.errors &&
                      activationResultModal.errors.length > 0 && (
                        <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 text-left space-y-2.5 text-xs">
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                            Missing Requirements:
                          </span>
                          {activationResultModal.errors.map((err, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-2 text-text-primary"
                            >
                              <div className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                <div>
                                  <span className="font-bold text-rose-600 dark:text-rose-400 block">
                                    {err.field}
                                  </span>
                                  <span className="text-[11px] text-text-secondary">
                                    {err.detail}
                                  </span>
                                </div>
                              </div>
                              {err.step && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentStep(err.step);
                                    setActivationResultModal(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 font-bold text-[10px] transition-colors shrink-0 cursor-pointer"
                                >
                                  Fix in Step {err.step}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActivationResultModal(null)}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-secondary transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                      {activationResultModal.errors?.some((e) => e.step) && (
                        <button
                          type="button"
                          onClick={() => {
                            const firstMissingStep =
                              activationResultModal.errors.find(
                                (e) => e.step,
                              )?.step;
                            if (firstMissingStep)
                              setCurrentStep(firstMissingStep);
                            setActivationResultModal(null);
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>
                            Go to Step{" "}
                            {
                              activationResultModal.errors.find((e) => e.step)
                                ?.step
                            }
                          </span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === "billing" && (
        <div className="space-y-6 animate-fadeIn">
          {renderSubscriptionAndSeatsContent()}
        </div>
      )}

      {(deleteServiceTarget || deleteFieldTarget || deleteDocTarget) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="presentation">
          <section className="w-full max-w-md rounded-2xl border border-border-main bg-bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <h2 id="delete-confirm-title" className="text-base font-bold text-text-primary">Remove this item?</h2>
            <p className="mt-2 text-sm text-text-secondary">
              <strong className="text-text-primary">{deleteServiceTarget?.service?.name || deleteFieldTarget?.field?.label || deleteDocTarget?.filename}</strong> will be removed from your organization’s AI configuration. This may affect how the AI identifies services, qualifies leads, or answers questions using this document.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setDeleteServiceTarget(null); setDeleteFieldTarget(null); setDeleteDocTarget(null); }} className="rounded-xl border border-border-main px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pilot-blue">Cancel</button>
              <button type="button" onClick={() => { if (deleteServiceTarget) handleConfirmDeleteService(); else if (deleteFieldTarget) handleConfirmDeleteField(); else handleConfirmDeleteDoc(); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Remove item</button>
            </div>
          </section>
        </div>
      )}

      {showEditLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-card border border-border-main rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-main">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary">
                    Update Daily AI API Limit
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Configure maximum daily requests capacity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditLimitModal(false)}
                className="p-1.5 rounded-xl hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-bg-secondary/50 border border-border-main text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Consumed Today:</span>
                  <span className="font-mono font-bold text-pilot-blue">
                    {(
                      Number(aiSettings.dailyAiUsage?.totalApiCalls) || 0
                    ).toLocaleString()}{" "}
                    calls
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1 border-t border-border-main/50">
                  <span>
                    WhatsApp Chats:{" "}
                    <strong className="text-text-primary font-bold">
                      {Number(aiSettings.dailyAiUsage?.chatApiCalls || 0)}
                    </strong>
                  </span>
                  <span>
                    Audio Calls:{" "}
                    <strong className="text-text-primary font-bold">
                      {Number(aiSettings.dailyAiUsage?.audioApiCalls || 0)}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-text-primary uppercase tracking-wider mb-2">
                  Daily Quota Limit (Requests / Day)
                </label>
                <div className="relative">
                  <input
                    id="daily-quota-limit"
                    type="number"
                    min="100"
                    max="100000"
                    step="1"
                    value={customDailyLimit}
                    onChange={(e) => { setCustomDailyLimit(e.target.value); setQuotaLimitError(""); }}
                    placeholder="e.g. 1500"
                    aria-invalid={Boolean(quotaLimitError)}
                    aria-describedby={quotaLimitError ? "daily-quota-error" : undefined}
                    className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-base font-bold font-mono rounded-2xl px-4 py-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">
                    calls / day
                  </span>
                </div>
                {quotaLimitError && <p id="daily-quota-error" className="text-[11px] text-red-600 dark:text-red-400 mt-1" role="alert">{quotaLimitError}</p>}
                <span className="text-[11px] text-text-secondary mt-1.5 block">
                  Counters automatically refresh back to 0 every day at 00:00
                  UTC.
                </span>
              </div>

              {/* Preset quick buttons */}
              <div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
                  Quick Select Presets
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 1500, 3000, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomDailyLimit(preset)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                        Number(customDailyLimit) === preset
                          ? "bg-pilot-blue text-white border-pilot-blue shadow-xs"
                          : "bg-bg-secondary/50 border-border-main text-text-primary hover:bg-bg-secondary hover:border-pilot-blue/40"
                      }`}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 p-5 border-t border-border-main bg-bg-secondary/20">
              <button
                type="button"
                onClick={() => setShowEditLimitModal(false)}
                disabled={savingLimit}
                className="px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateDailyLimit()}
                disabled={savingLimit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-md shadow-pilot-blue/20 cursor-pointer disabled:opacity-50"
              >
                {savingLimit ? (
                  <RefreshCw size={14} className="animate-spin text-white" />
                ) : (
                  <Check size={14} />
                )}
                <span>{savingLimit ? "Saving..." : "Save Daily Limit"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
