import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import { API_ENDPOINTS } from "../utils/constants.js";
import KBGeneratorPromptCard from "../components/KBGeneratorPromptCard.jsx";

// Wizard steps configuration
const STEPS = [
  {
    id: 1,
    title: "AI Engine & Identity",
    shortTitle: "Engine & Tone",
    subtitle: "Gemini API key, brand persona & rules",
    icon: Bot,
  },
  {
    id: 2,
    title: "Catalog & Offerings",
    shortTitle: "Services",
    subtitle: "Products, services & keywords",
    icon: Layers,
  },
  {
    id: 3,
    title: "Lead Qualification",
    shortTitle: "Qualification",
    subtitle: "Dynamic lead questionnaire",
    icon: ListFilter,
  },
  {
    id: 4,
    title: "Knowledge Base (RAG)",
    shortTitle: "Knowledge Base",
    subtitle: "PDFs, brochures & FAQs",
    icon: BookOpen,
  },
  {
    id: 5,
    title: "Review & Playground",
    shortTitle: "Review",
    subtitle: "Prompt verification & test",
    icon: Sparkles,
  },
];

const DEFAULT_WELCOME_TEMPLATE = `Hello {{name}}! 👋\n\nThank you for reaching out to {{company}} regarding *{{service}}*.\n\nWe have received your enquiry and our specialist will connect with you shortly.\n\nFeel free to reply with any specific requirements or questions you may have!`;

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
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState(null);
  const [refreshingUsage, setRefreshingUsage] = useState(false);
  const [resetCountdown, setResetCountdown] = useState("");
  const [showEditLimitModal, setShowEditLimitModal] = useState(false);
  const [customDailyLimit, setCustomDailyLimit] = useState(1500);
  const [savingLimit, setSavingLimit] = useState(false);

  // Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    keywords: "",
  });

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
    const targetLimit = parseInt(
      newLimit !== undefined ? newLimit : customDailyLimit,
      10,
    );
    if (!targetLimit || targetLimit <= 0) {
      alert("Please enter a valid daily API calls limit (greater than 0).");
      return;
    }
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
      setTimeout(() => setSaveToast(""), 3500);

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
    if (!aiSettings.geminiApiKey || !aiSettings.geminiApiKey.trim()) {
      missing.push({
        step: 1,
        field: "Google Gemini API Key",
        detail: "Configure and test your Gemini API key in Step 1.",
      });
    }
    if (!aiSettings.companyName || !aiSettings.companyName.trim()) {
      missing.push({
        step: 1,
        field: "Company / Brand Name",
        detail: "Provide your brand name in Step 1.",
      });
    }
    if (!aiSettings.services || aiSettings.services.length === 0) {
      missing.push({
        step: 2,
        field: "Catalog Offerings",
        detail: "Add at least 1 product or service offering in Step 2.",
      });
    }
    if (
      !aiSettings.qualificationFields ||
      aiSettings.qualificationFields.length === 0
    ) {
      missing.push({
        step: 3,
        field: "Lead Qualification Criteria",
        detail: "Add at least 1 qualification question in Step 3.",
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
  const handleAddService = () => {
    if (!newService.name.trim()) return;
    const keywordsArr = newService.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const updated = [
      ...aiSettings.services,
      {
        name: newService.name.trim(),
        description: newService.description.trim(),
        keywords: keywordsArr,
      },
    ];

    setAiSettings({ ...aiSettings, services: updated });
    setNewService({ name: "", description: "", keywords: "" });
    setShowAddServiceModal(false);
    handleSaveStep({ ...aiSettings, services: updated });
  };

  const handleRemoveService = (index) => {
    const updated = aiSettings.services.filter((_, i) => i !== index);
    setAiSettings({ ...aiSettings, services: updated });
    handleSaveStep({ ...aiSettings, services: updated });
  };

  // Field Management
  const handleEditField = (index) => {
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
    if (!newField.key.trim() || !newField.label.trim()) return;
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
    const updated = aiSettings.qualificationFields.filter(
      (_, i) => i !== index,
    );
    setAiSettings({ ...aiSettings, qualificationFields: updated });
    handleSaveStep({ ...aiSettings, qualificationFields: updated });
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
        "Please configure and save your Google Gemini API Key in Step 1 first. Gemini embeddings are required to index documents into Qdrant.",
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

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Remove this document from the AI knowledge base?"))
      return;
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

  const activeStepObj = STEPS.find((s) => s.id === currentStep) || STEPS[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header with Brand Details & Clean Tab Switcher ───────────── */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Org Identification */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary hover:border-pilot-blue/40 transition-colors shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pilot-blue to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
              {(org.name || "S").charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">
                  {org.name || "Organization"}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {org.status ? org.status.toUpperCase() : "ACTIVE"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Customize your AI sales pilot, products catalog, qualification
                schema, and knowledge documents.
              </p>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <div className="flex items-center p-1.5 bg-bg-secondary border border-border-main rounded-2xl gap-1.5 self-stretch lg:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab("wizard")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "wizard"
                  ? "bg-pilot-blue text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <Bot size={16} />
              <span>AI Setup Wizard</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "billing"
                  ? "bg-pilot-blue text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <Building2 size={16} />
              <span>Subscription & Seats</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openSupportModal(
                  "Book 1-on-1 Human Assistance & Consultation Session for AI Pilot Setup."
                )
              }
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title="Schedule a 1-on-1 support meeting via Calendly"
            >
              <Headphones size={16} />
              <span>Book Human Assistance</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Success Toast Banner ─────────────────────────────────────────── */}
      {saveToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={17} />
            <span>{saveToast}</span>
          </div>
          <button
            onClick={() => setSaveToast("")}
            className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: STEP-BY-STEP GUIDED AI PILOT SETUP WIZARD                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "wizard" && (
        <div className="space-y-6">
          {/* ── AI DOCUMENT EXTRACTION & SETUP HERO GUIDE ────────────────────── */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-pilot-blue/15 via-indigo-600/10 to-bg-card border border-pilot-blue/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-pilot-blue/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pilot-blue text-white shadow-xs">
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

              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setGuidanceTab("prompt");
                    setShowAiGuidanceModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-md shadow-pilot-blue/20 cursor-pointer group"
                >
                  <Sparkles
                    size={15}
                    className="group-hover:rotate-12 transition-transform"
                  />
                  <span>Document Extraction Guide</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQuickPrompt}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-bg-card border border-border-main hover:border-pilot-blue/40 text-text-primary text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Copy the extraction prompt to clipboard directly"
                >
                  {copiedQuickPrompt ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Prompt Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="text-pilot-blue" />
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
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                  title="Schedule a 30-min strategy & onboarding call with our team"
                >
                  <Headphones size={15} />
                  <span>Book Human Assistance</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
              {STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex items-center gap-3 p-2.5 sm:px-4 sm:py-3 rounded-2xl transition-all text-left shrink-0 cursor-pointer ${
                        isCurrent
                          ? "bg-pilot-blue text-white shadow-md shadow-pilot-blue/20"
                          : isCompleted
                            ? "bg-bg-secondary text-text-primary hover:bg-bg-secondary/80"
                            : "text-text-secondary/70 hover:text-text-primary hover:bg-bg-secondary/40"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                          isCurrent
                            ? "bg-white/20 text-white"
                            : isCompleted
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-bg-secondary border border-border-main text-text-secondary"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={16} />
                        ) : (
                          <StepIcon size={16} />
                        )}
                      </div>

                      <div className="hidden sm:block">
                        <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                          Step 0{step.id}
                        </div>
                        <div className="text-xs font-black tracking-tight whitespace-nowrap">
                          {step.shortTitle}
                        </div>
                      </div>
                    </button>

                    {idx < STEPS.length - 1 && (
                      <div className="hidden md:block flex-1 h-[2px] bg-border-main shrink-0 min-w-4 max-w-12 rounded-full" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Current Step Workspace Card */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-8 shadow-xs space-y-7">
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

            {/* ── STEP 1: IDENTITY & PERSONA ──────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* ── GOOGLE GEMINI API KEY CONFIGURATION ───────────────── */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-bg-secondary/70 via-bg-secondary/40 to-bg-card border border-border-main space-y-4 shadow-2xs">
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
                            * Mandatory
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          Each organization must provide their own Gemini API
                          key for automated sales chat and RAG embeddings.
                        </p>
                      </div>
                    </div>

                    {aiSettings.geminiApiKey?.trim() ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 size={13} />
                        <span>Configured & Encrypted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        <AlertTriangle size={13} />
                        <span>API Key Required</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <input
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
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                          title={showApiKey ? "Hide Key" : "Show Key"}
                        >
                          {showApiKey ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestApiKey}
                        disabled={
                          testingKey || !aiSettings.geminiApiKey?.trim()
                        }
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-bg-card hover:bg-bg-secondary border border-border-main text-xs font-bold text-text-primary hover:border-pilot-blue/50 transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
                      >
                        {testingKey ? (
                          <RefreshCw
                            size={14}
                            className="animate-spin text-pilot-blue"
                          />
                        ) : (
                          <Sparkles size={14} className="text-pilot-blue" />
                        )}
                        <span>{testingKey ? "Verifying..." : "Test Key"}</span>
                      </button>
                    </div>

                    {/* Test result message */}
                    {keyTestResult && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
                          keyTestResult.success
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
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
                          className="p-1 hover:opacity-75"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 text-[11px] text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Lock size={12} className="text-emerald-500" />
                        <span>
                          Encrypted with AES-256-GCM. Never shared with other
                          organizations.
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-black text-text-primary uppercase tracking-wider">
                        Brand Name / Display Name
                      </label>
                      <span className="text-[10px] font-bold text-pilot-blue bg-pilot-blue/10 px-2 py-0.5 rounded-md border border-pilot-blue/20">
                        Auto-filled
                      </span>
                    </div>
                    <input
                      type="text"
                      value={aiSettings.companyName}
                      onChange={(e) =>
                        setAiSettings({
                          ...aiSettings,
                          companyName: e.target.value,
                        })
                      }
                      placeholder={org.name || "e.g. SalesBuster AI"}
                      className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all font-medium"
                    />
                    <span className="text-[10px] text-text-secondary mt-1.5 block">
                      The official brand name the AI assistant introduces on
                      WhatsApp. Automatically pre-filled from your organization
                      profile.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                      Custom Agent Role Description
                    </label>
                    <input
                      type="text"
                      value={aiSettings.agentPersona}
                      onChange={(e) =>
                        setAiSettings({
                          ...aiSettings,
                          agentPersona: e.target.value,
                        })
                      }
                      placeholder="e.g. warm, consultative sales advisor"
                      className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                    />
                    <span className="text-[10px] text-text-secondary mt-1.5 block">
                      Controls the AI assistant's personality traits and
                      conversational vocabulary.
                    </span>
                  </div>
                </div>

                {/* Company Pitch / Overview */}
                <div>
                  <label className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                    Company Overview & Value Proposition
                  </label>
                  <textarea
                    rows={3}
                    value={aiSettings.businessDescription}
                    onChange={(e) =>
                      setAiSettings({
                        ...aiSettings,
                        businessDescription: e.target.value,
                      })
                    }
                    placeholder="Briefly describe what your company offers, core target audience, and key customer benefits..."
                    className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all leading-relaxed"
                  />
                  <span className="text-[10px] text-text-secondary mt-1.5 block">
                    Gives the AI context about your business when answering
                    broad customer enquiries.
                  </span>
                </div>

                {/* Guardrails and Rules */}
                <div>
                  <label className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                    Mandatory Sales Guardrails & Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={aiSettings.customInstructions}
                    onChange={(e) =>
                      setAiSettings({
                        ...aiSettings,
                        customInstructions: e.target.value,
                      })
                    }
                    className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all font-mono leading-relaxed"
                  />
                  <span className="text-[10px] text-text-secondary mt-1.5 block">
                    Defines strict pricing guidelines (e.g. never guess fixed
                    quotes), callback triggers, and handoff rules.
                  </span>
                </div>

                {/* ── AUTOMATED WHATSAPP WELCOME GREETING ───────────────── */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-bg-secondary/70 via-bg-secondary/40 to-bg-card border border-border-main space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                        <MessageCircle size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                            Automated Welcome Greeting
                          </h3>
                          <span className="text-[10px] font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                            Instant WhatsApp Lead Response
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          Sent automatically to prospective customers when an enquiry arrives via Website, Meta Ads, Call, or Mobile App.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-black text-text-primary mb-1 uppercase tracking-wider">
                          Insert Dynamic Placeholders
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { key: "name", label: "{{name}}" },
                            { key: "firstName", label: "{{firstName}}" },
                            { key: "service", label: "{{service}}" },
                            { key: "company", label: "{{company}}" },
                            { key: "city", label: "{{city}}" },
                            { key: "phone", label: "{{phone}}" },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                const current =
                                  aiSettings.welcomeMessageTemplate ||
                                  DEFAULT_WELCOME_TEMPLATE;
                                setAiSettings({
                                  ...aiSettings,
                                  welcomeMessageTemplate: `${current} {{${item.key}}}`,
                                });
                              }}
                              className="px-2 py-1 text-[11px] font-semibold bg-bg-secondary/70 hover:bg-teal-500/20 text-text-primary hover:text-teal-600 rounded-lg border border-border-main transition-colors cursor-pointer"
                              title={`Insert ${item.label}`}
                            >
                              + {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-black text-text-primary uppercase tracking-wider">
                            Message Template
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setAiSettings({
                                ...aiSettings,
                                welcomeMessageTemplate: DEFAULT_WELCOME_TEMPLATE,
                              })
                            }
                            className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset Default
                          </button>
                        </div>
                        <textarea
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
                          placeholder="Type your organization's custom WhatsApp welcome greeting..."
                          className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all font-mono leading-relaxed resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-text-primary mb-1 uppercase tracking-wider">
                          Fallback Service Name
                        </label>
                        <input
                          type="text"
                          value={aiSettings.welcomeMessageFallbackService || ""}
                          onChange={(e) =>
                            setAiSettings({
                              ...aiSettings,
                              welcomeMessageFallbackService: e.target.value,
                            })
                          }
                          placeholder={
                            aiSettings.services?.[0]?.name ||
                            "e.g. Solutions & Services"
                          }
                          className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                        />
                        <span className="text-[10px] text-text-secondary mt-1 block">
                          Substituted into {"{{service}}"} if the enquiry does not specify a specific service.
                        </span>
                      </div>
                    </div>

                    {/* Preview Bubble */}
                    <div className="flex flex-col justify-between p-4 rounded-2xl bg-[#0b141a] border border-border-main text-white shadow-inner min-h-[260px]">
                      <div className="pb-2.5 border-b border-white/10 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center font-bold text-[10px]">
                          {(
                            aiSettings.companyName ||
                            orgData?.name ||
                            "O"
                          )[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {aiSettings.companyName ||
                              orgData?.name ||
                              "Our Company"}
                          </div>
                          <div className="text-[9px] text-white/50">
                            WhatsApp Preview
                          </div>
                        </div>
                      </div>

                      <div className="my-auto py-2">
                        <div className="max-w-[95%] ml-auto bg-[#005c4b] text-white text-xs p-3 rounded-2xl rounded-tr-sm shadow-md whitespace-pre-line leading-relaxed">
                          {(
                            aiSettings.welcomeMessageTemplate ||
                            DEFAULT_WELCOME_TEMPLATE
                          )
                            .replace(/\{\{?\s*name\s*\}?\}/gi, "John Doe")
                            .replace(/\{\{?\s*firstname\s*\}?\}/gi, "John")
                            .replace(
                              /\{\{?\s*service\s*\}?\}/gi,
                              aiSettings.welcomeMessageFallbackService ||
                                aiSettings.services?.[0]?.name ||
                                "our services",
                            )
                            .replace(
                              /\{\{?\s*company(name)?\s*\}?\}/gi,
                              aiSettings.companyName ||
                                orgData?.name ||
                                "Our Company",
                            )
                            .replace(/\{\{?\s*city\s*\}?\}/gi, "New York")
                            .replace(
                              /\{\{?\s*phone\s*\}?\}/gi,
                              "+91 98765 43210",
                            )
                            .replace(
                              /\{\{?\s*source\s*\}?\}/gi,
                              "Website Form",
                            )}
                          <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-white/60">
                            <span>Just now</span>
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 text-[10px] text-white/40 text-center border-t border-white/5">
                        Live preview demonstrating placeholder substitution
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: PRODUCTS & SERVICES ─────────────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Step 2 Pro Guidance Callout */}
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
                        When a customer reaches out via WhatsApp, the AI maps
                        their request to these services and keywords, and tags
                        the lead in your CRM.
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
                      The AI automatically matches incoming customer messages
                      against these products and keywords.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
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
                      onClick={() => setShowAddServiceModal(true)}
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
                      Add your products or services so the AI knows what you
                      sell and can guide your customers effectively.
                    </p>
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                      <button
                        onClick={openServicesImportModal}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bg-card border border-border-main text-text-primary text-xs font-bold hover:bg-bg-secondary transition-colors cursor-pointer"
                      >
                        <FileJson size={14} className="text-pilot-blue" />
                        <span>Import Services JSON</span>
                      </button>
                      <button
                        onClick={() => setShowAddServiceModal(true)}
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
                            <h4 className="text-xs font-black text-text-primary">
                              {svc.name}
                            </h4>
                            <button
                              onClick={() => handleRemoveService(idx)}
                              className="text-text-secondary hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Service"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {svc.description}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1.5">
                            Intent Keywords:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {svc.keywords && svc.keywords.length > 0 ? (
                              svc.keywords.map((kw, kidx) => (
                                <span
                                  key={kidx}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-bg-card border border-border-main text-pilot-blue"
                                >
                                  #{kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-text-secondary italic">
                                No keywords tagged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Service Modal */}
                {showAddServiceModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-xl">
                      <div className="flex justify-between items-center pb-2 border-b border-border-main">
                        <div className="flex items-center gap-2">
                          <Layers size={18} className="text-pilot-blue" />
                          <h3 className="text-sm font-black text-text-primary">
                            Add Product or Service
                          </h3>
                        </div>
                        <button
                          onClick={() => setShowAddServiceModal(false)}
                          className="p-1 text-text-secondary hover:text-text-primary rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Service / Offering Name *
                          </label>
                          <input
                            type="text"
                            value={newService.name}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. 3 BHK Luxury Flat / MRL Passenger Lift"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Description for AI Assistant *
                          </label>
                          <textarea
                            rows={3}
                            value={newService.description}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe features, suitability, and benefits so the AI can explain it to customers..."
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Intent Keywords (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={newService.keywords}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                keywords: e.target.value,
                              })
                            }
                            placeholder="e.g. 3bhk, luxury flat, gated community, apartment"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                        <button
                          onClick={() => setShowAddServiceModal(false)}
                          className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddService}
                          disabled={!newService.name.trim()}
                          className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                          Save Service
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: LEAD QUALIFICATION SCHEMA ───────────────────────── */}
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
                        How Dynamic Qualification Works
                      </div>
                      <p className="text-text-secondary leading-relaxed">
                        The AI agent asks these qualification questions
                        organically over the WhatsApp conversation, avoiding
                        rigid interrogation and maximizing customer response
                        rates.
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

                {/* Lead Qualification Criteria Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-text-primary">
                      Lead Qualification Criteria (
                      {aiSettings.qualificationFields.length})
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Standard criteria your AI extracts to qualify leads.
                      Customize, edit, delete, or add questions to suit your
                      business.
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

                {/* Custom Fields List */}
                {aiSettings.qualificationFields.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-bg-secondary/40 border border-dashed border-border-main text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center mx-auto">
                      <ListFilter size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">
                      No Custom Questions Configured
                    </h4>
                    <p className="text-xs text-text-secondary max-w-md mx-auto">
                      Add business-specific criteria (e.g. budget, timeframe,
                      product specifications) to capture key lead requirements.
                    </p>
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                      <button
                        onClick={openQualificationImportModal}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bg-card border border-border-main text-text-primary text-xs font-bold hover:bg-bg-secondary transition-colors cursor-pointer"
                      >
                        <FileJson size={14} className="text-pilot-blue" />
                        <span>Import Criteria JSON</span>
                      </button>
                      <button
                        onClick={() => setShowAddFieldModal(true)}
                        className="px-4 py-2 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-colors cursor-pointer"
                      >
                        Add First Field
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
                                onClick={() => handleEditField(idx)}
                                className="text-text-secondary hover:text-pilot-blue p-1 rounded-lg hover:bg-pilot-blue/10 transition-colors"
                                title="Edit Question"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveField(idx)}
                                className="text-text-secondary hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Delete Field"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-text-secondary block">
                            Key:{" "}
                            <span className="font-bold text-text-primary">
                              {field.key}
                            </span>
                          </span>

                          <p className="text-xs text-text-secondary leading-relaxed">
                            {field.description ||
                              "No extraction guidance specified."}
                          </p>
                        </div>

                        {field.options && field.options.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                              Allowed Options:
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

                {/* Add Field Modal */}
                {showAddFieldModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-xl">
                      <div className="flex justify-between items-center pb-2 border-b border-border-main">
                        <div className="flex items-center gap-2">
                          <ListFilter size={18} className="text-pilot-blue" />
                          <h3 className="text-sm font-black text-text-primary">
                            {editingFieldIndex !== null
                              ? "Edit Qualification Field"
                              : "Add Qualification Field"}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setEditingFieldIndex(null);
                            setShowAddFieldModal(false);
                          }}
                          className="p-1 text-text-secondary hover:text-text-primary rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-text-primary mb-1">
                              Question / Display Label *
                            </label>
                            <input
                              type="text"
                              value={newField.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewField({
                                  ...newField,
                                  label: val,
                                  key:
                                    newField.key ||
                                    val
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]/g, "_"),
                                });
                              }}
                              placeholder="e.g. Budget Range / BHK"
                              className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-text-primary mb-1">
                              Field Key (Identifier) *
                            </label>
                            <input
                              type="text"
                              value={newField.key}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  key: e.target.value,
                                })
                              }
                              placeholder="e.g. budget_range"
                              className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Field Data Type
                          </label>
                          <select
                            value={newField.type}
                            onChange={(e) =>
                              setNewField({ ...newField, type: e.target.value })
                            }
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          >
                            <option value="string">
                              Text String (Freeform)
                            </option>
                            <option value="number">
                              Numeric (Quantity / Amount)
                            </option>
                            <option value="select">
                              Dropdown Select (Predefined Choices)
                            </option>
                            <option value="boolean">
                              Yes / No (Boolean Flag)
                            </option>
                          </select>
                        </div>

                        {newField.type === "select" && (
                          <div>
                            <label className="block text-xs font-bold text-text-primary mb-1">
                              Choices (comma-separated) *
                            </label>
                            <input
                              type="text"
                              value={newField.options}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  options: e.target.value,
                                })
                              }
                              placeholder="e.g. 2 BHK, 3 BHK, 4 BHK, Villa"
                              className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Extraction Guidance for AI
                          </label>
                          <textarea
                            rows={2}
                            value={newField.description}
                            onChange={(e) =>
                              setNewField({
                                ...newField,
                                description: e.target.value,
                              })
                            }
                            placeholder="Explain what to ask the customer or how to extract this information..."
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                        <button
                          onClick={() => {
                            setEditingFieldIndex(null);
                            setShowAddFieldModal(false);
                          }}
                          className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddField}
                          disabled={
                            !newField.label.trim() || !newField.key.trim()
                          }
                          className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                          {editingFieldIndex !== null
                            ? "Save Changes"
                            : "Save Field"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: KNOWLEDGE BASE (QDRANT RAG) ──────────────────────── */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Qdrant Partition Banner */}
                <div className="p-5 rounded-2xl bg-bg-secondary/50 border border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-pilot-blue" />
                      <h4 className="text-xs font-black text-text-primary">
                        Dedicated Qdrant Vector Collection
                      </h4>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Isolated multi-tenant vector space using{" "}
                      <span className="font-bold text-text-primary">
                        gemini-embedding-2
                      </span>{" "}
                      (768-dim).
                    </p>
                  </div>

                  <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-bg-card border border-border-main text-pilot-blue">
                    {aiSettings.qdrantCollection ||
                      `sb_kb_${(org.name || "tenant").toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
                  </span>
                </div>

                {/* AI Knowledge Base Generator System Prompt Card */}
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
                        ? "Chunking & Indexing into Qdrant..."
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
                    Indexed Knowledge Documents (
                    {aiSettings.knowledgeDocs.length})
                  </h4>

                  {aiSettings.knowledgeDocs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-bg-secondary/40 border border-border-main text-center text-xs text-text-secondary">
                      No documents indexed yet. Upload your product brochures,
                      spec sheets, or pricing FAQs above.
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
                                  {doc.chunkCount || 12} vector chunks
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Indexed
                            </span>
                            <button
                              onClick={() => handleDeleteDoc(doc.docId)}
                              className="text-text-secondary hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Document"
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

            {/* ── STEP 5: REVIEW, PROMPT INSPECTOR & PLAYGROUND ───────────── */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Pre-flight Requirement Verification Card */}
                <div className="p-5 rounded-2xl border border-border-main bg-bg-secondary/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                        Pre-Activation Checklist
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        aiSettings.geminiApiKey?.trim() &&
                        aiSettings.services.length > 0 &&
                        aiSettings.qualificationFields.length > 0 &&
                        aiSettings.companyName.trim()
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {aiSettings.geminiApiKey?.trim() &&
                      aiSettings.services.length > 0 &&
                      aiSettings.qualificationFields.length > 0 &&
                      aiSettings.companyName.trim()
                        ? "Ready to Activate"
                        : "Requirements Missing"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                    <div
                      onClick={() =>
                        !aiSettings.geminiApiKey?.trim() && setCurrentStep(1)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.geminiApiKey?.trim()
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Gemini API Key
                      </span>
                      {aiSettings.geminiApiKey?.trim() ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Step 1 Required
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() =>
                        !aiSettings.companyName.trim() && setCurrentStep(1)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.companyName.trim()
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Company Identity
                      </span>
                      {aiSettings.companyName.trim() ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Step 1 Required
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() =>
                        aiSettings.services.length === 0 && setCurrentStep(2)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.services.length > 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Services Catalog ({aiSettings.services.length})
                      </span>
                      {aiSettings.services.length > 0 ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Min 1 Required
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() =>
                        aiSettings.qualificationFields.length === 0 &&
                        setCurrentStep(3)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.qualificationFields.length > 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Questions Schema (
                        {aiSettings.qualificationFields.length})
                      </span>
                      {aiSettings.qualificationFields.length > 0 ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Min 1 Required
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
                    <span className="text-xs font-black text-pilot-blue mt-1 block truncate">
                      {aiSettings.companyName || org.name || "Configured"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Catalog Services
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.services.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Custom Questions
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.qualificationFields.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Knowledge Docs
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.knowledgeDocs.length}
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
                        onClick={copyPromptText}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-card border border-border-main text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {copiedPrompt ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedPrompt ? "Copied" : "Copy"}</span>
                      </button>
                      <button
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
                      Your prompt is compiled dynamically from your Persona,
                      Services Catalog, Qualification Criteria, and Knowledge
                      Base chunks. Click "Expand Full Prompt" above to review
                      before testing.
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
                      Simulate real customer inquiries and test qualification in
                      the interactive WhatsApp playground.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/test-ai")}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-md shadow-pilot-blue/20 shrink-0 cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Open AI Playground</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Persistent Step Navigation Footer ───────────────────────── */}
            <div className="flex justify-between items-center pt-6 border-t border-border-main">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveStep()}
                  disabled={aiSaving}
                  className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-xs font-bold text-text-primary hover:bg-bg-secondary/70 transition-colors cursor-pointer"
                >
                  {aiSaving ? "Saving..." : "Save Draft"}
                </button>

                {currentStep < STEPS.length ? (
                  <button
                    onClick={() => handleSaveStep(null, currentStep + 1)}
                    disabled={aiSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-sm shadow-pilot-blue/20 cursor-pointer"
                  >
                    <span>Save & Continue</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishSetup}
                    disabled={aiSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
                  >
                    <CheckCheck size={16} />
                    <span>
                      {aiSaving ? "Activating..." : "Finish & Activate AI"}
                    </span>
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
                          Step 2 Catalog
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
          <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pilot-blue to-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-sm">
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
                </div>
              </div>

              <div className="text-right sm:border-l border-border-main sm:pl-6">
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
                <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue">
                  <Mail size={14} />
                </div>
                <span className="text-text-primary font-medium truncate">
                  {org.email || "No email"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-text-secondary">
                <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue">
                  <Phone size={14} />
                </div>
                <span className="text-text-primary font-medium">
                  {org.mobile || "No phone"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-text-secondary">
                <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue">
                  <Globe size={14} />
                </div>
                <span className="text-text-primary font-medium truncate">
                  {org.website || "No website"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Current Billing Cycle:
                  </span>
                  <span className="font-medium text-text-primary">
                    {formatDate(org.subscriptionStartDate)} &rarr;{" "}
                    {formatDate(org.subscriptionEndDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* WhatsApp Connection Mode */}
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
                  WhatsApp connection mode is managed by your system administrator. Contact support to upgrade or change your connection plan.
                </p>
              </div>
            </div>
          </div>

          {renderDailyAiUsageCard(false)}
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
                    type="number"
                    min="10"
                    max="1000000"
                    step="50"
                    value={customDailyLimit}
                    onChange={(e) => setCustomDailyLimit(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-base font-bold font-mono rounded-2xl px-4 py-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">
                    calls / day
                  </span>
                </div>
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
