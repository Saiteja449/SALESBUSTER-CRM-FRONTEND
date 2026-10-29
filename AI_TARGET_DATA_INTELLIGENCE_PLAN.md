# AI Target Data Intelligence — CRM Web Implementation Plan

## Scope

Implement the user-facing Target Data Intelligence experience in the SalesBuster CRM web app (`SALESBUSTER-CRM-FRONTEND`). The feature helps a sales user describe an ideal customer profile, review prospects from approved sources, and select prospects for CRM follow-up.

This plan covers CRM web navigation, pages, interaction states, client-side validation, API integration points, and frontend permission handling. It does not implement the CRM backend, SalesBuster Admin, mobile app, external data-source connectors, or data acquisition. Those systems must provide the contracts and enforcement described under Dependencies and compliance.

## Product outcome

A permitted CRM user can enter a target market such as “manufacturing companies in Hyderabad that could require an ERP solution,” run a search through organization-approved sources, review deduplicated companies and likely decision-maker contacts with transparent relevance explanations, and select records for the CRM. The UI must make the source, freshness, and permission status visible and must never imply that a source is enabled when the server says it is not.

## Existing CRM web conventions

- React 19 + Vite, React Router, Tailwind, and Lucide icons.
- Auth and organization context are provided by `AuthContext` and `RootProvider`.
- Main authenticated routes are declared in `src/App.jsx`; role-aware grouped navigation is in `src/components/Sidebar.jsx`.
- Existing feature pages include leads, WhatsApp campaigns, and BI Analyst. Campaign/BI routes demonstrate manager/owner gating and add-on prompts.
- Existing lead records are surfaced through `LeadsContext`; prospect import should reuse the established CRM lead creation/import flow where the API supports it, rather than inventing an incompatible local record model.

## Proposed information architecture

Add a **Target Intelligence** entry in the CRM sidebar under **Sales & Pipeline** (or a closely related section selected during UX review), visible only when the authenticated organization/user is entitled to use the feature. Route: `/target-intelligence`.

The page has three primary states/views:

1. **Build a target profile** — search form and saved profiles.
2. **Review prospects** — result list/table with filters, score, source and dedupe status.
3. **Selected prospects** — review selected records, create or add to a CRM list/campaign, and see the outcome.

Use a focused page with a clear flow rather than adding a separate application shell. Reuse current CRM responsive layout, theme tokens, loading/error patterns, and accessible control conventions.

## User flow and requirements

### 1. Access and availability

- Add a route protected by authenticated app layout.
- Read feature availability/entitlement and organization policy from the server-backed auth/config contract.
- When disabled or unavailable, show a clear unavailable/upgrade state consistent with existing add-on patterns; do not expose a search action.
- Restrict access to the roles authorized by product policy. Initial default recommendation: organization owners/managers can configure and run searches; sales reps can review/act on assigned or shared prospect lists. Confirm against existing CRM role policy before implementation.
- Treat frontend role checks as presentation only; APIs must enforce authorization and tenant boundaries.

### 2. Define an ideal customer profile

Form fields:

- Industry (multi-select or searchable taxonomy).
- Geography (country/region/city; example city Hyderabad).
- Company type and size (organization-defined categories and employee/revenue ranges when supported).
- Product/service need (plain-language text, e.g. ERP solution).
- Decision-maker designation/role (multi-select plus optional free text).
- Optional filters supported by the approved source integrations.
- Search/profile name and optional description for reuse.

Behavior:

- Provide helper copy and example prompt to explain what the query does.
- Validate required filters, lengths, and supported combinations before submit.
- Allow users to save, edit, duplicate, and rerun a target profile if the API supports saved profiles.
- Show the selected source scope and an explicit message if no approved source is available.
- Present a confirmation/summary of the profile before a potentially costly search, including any quota estimate returned by the service.

### 3. Search progress and outcomes

- Submit a structured profile to the search API; do not scrape websites or query unapproved sources in the browser.
- Show queued/running/completed/failed states, progress where available, and safe retry behavior.
- Support cancellation only if the service exposes a cancellation contract.
- Preserve the profile if search fails; show actionable error copy and a retry action.
- Display result count, search timestamp, and source coverage returned by the service.

### 4. Review and qualify results

Provide an accessible, responsive table/list with:

- Company name, industry, location, company size/type when available.
- Contact name, title/decision-maker role, and only the contact fields permitted for display/use.
- Relevance score with a consistent scale and a short explanation of matching signals; never present the score as a guarantee.
- Source label and source record/reference, last verified date, and any consent/permission/use limitation supplied by the API.
- Duplicate/possible-duplicate indicator and canonical record linkage where available.
- Selection checkbox, select visible/page, and clear selection controls.
- Search-within-results and supported filters such as location, industry, role, score threshold, source, and verification state.
- Empty, partial-data, loading, stale, and error states.

Do not show prohibited/private-source data, hidden enrichment, or sensitive fields. Render only allowlisted fields returned by the authorized service. A compliance restriction or blocked record should be explained without revealing the restricted value.

### 5. Add prospects to SalesBuster CRM

- Allow a user to select one or more eligible prospects and inspect what will be created/updated before confirming.
- Present duplicate matches against CRM records where the backend supports matching; let the user choose skip, update, or create only where policy/API permits.
- Collect CRM-specific required fields (owner/assignee, pipeline status, tags) using existing CRM conventions.
- Allow adding selected records to a CRM list/campaign only through supported CRM APIs and existing campaign entitlements/permissions. Do not silently start outreach or send messages.
- Show per-record outcomes (created, updated, skipped, failed) and link successful records to their CRM detail pages.
- Preserve origin/source attribution and target profile/search reference on the CRM records when supported by the data model.

## Frontend architecture proposal

Suggested modular structure (adjust to the repository’s established component split during implementation):

- `src/pages/TargetIntelligence.jsx` — page shell and view state orchestration.
- `src/components/target-intelligence/TargetProfileForm.jsx` — profile form and validation.
- `src/components/target-intelligence/ProspectResults.jsx` — result table, filters, selection, and row details.
- `src/components/target-intelligence/ProspectDetailPanel.jsx` — permitted contact/company detail and match explanation.
- `src/components/target-intelligence/AddToCrmDialog.jsx` — review and confirm CRM import/list action.
- `src/services/targetIntelligence.js` (or repository’s current API module location) — typed/normalized API calls and error handling.

Keep remote state in the project’s existing API/context approach. Avoid placing prospect search results or personally identifiable information in `localStorage`; only non-sensitive UI preferences may be persisted. Ensure org-scoped requests use the existing authenticated HTTP client and cancellation/cleanup patterns.

## API/data contract dependencies (CRM web integration only)

Before building live behavior, align with backend owners on endpoints and response shapes for:

1. Feature availability, entitlement, organization policy, allowed-source summaries, usage/quota, and usage history.
2. Search submission using structured profile filters; status polling or event updates; result pagination/filtering; retry/cancel semantics.
3. Prospect/company/contact result schema, match score and explanation, source attribution, verification timestamp, permission/use status, dedupe identity, and redaction indicators.
4. Search/profile CRUD if profiles are saved.
5. CRM duplicate lookup and bulk create/update/list membership with per-record idempotent outcomes.
6. Audit/usage event attribution: organization, actor, profile/search ID, source IDs, selected/created counts, and outcome.

Recommended frontend contract properties include stable IDs, `status`, `allowedFields` or equivalent display-safe payload guarantees, `source`, `lastVerifiedAt`, `permissionStatus`, `matchScore`, `matchReasons`, `duplicateOf`, pagination cursor, and per-record import result. The server is authoritative for permitted sources, field-level release, retention, consent/use constraints, role checks, and tenant isolation.

## Compliance, privacy, and safety requirements

- Search only sources the organization has explicitly enabled and that the service confirms are currently approved.
- Do not collect or expose data from prohibited/private sources; do not add scraping, browser automation, or user-provided credentials for bypassing source restrictions.
- Display provenance and applicable use/permission status for every record; preserve attribution on import.
- Honor source-specific restrictions on contact fields, retention, export, and outreach. Disable prohibited actions based on server-provided policy.
- Minimize personal data in client memory, logs, analytics, error reports, and browser persistence. Never log raw contact payloads.
- Make clear that adding a prospect to CRM is not consent to contact; outbound communication remains subject to existing CRM and source policies.
- Log user-visible search/import actions through approved telemetry without recording unnecessary personal data.

## Admin and usage visibility boundary

The request includes organization-level enable/disable and usage monitoring. In this plan, the CRM web app only consumes the feature-entitlement/policy and usage contracts and displays an unavailable state or user-facing usage information if those contracts expose it. The actual organization-wide switch, source allowlist management, and administrative monitoring controls belong to SalesBuster Admin/backend and are explicitly outside this CRM web implementation scope.

## Delivery phases

### Phase 0 — Contract and UX alignment

- Confirm role access, add-on/entitlement behavior, permitted source metadata, quota model, saved-profile expectations, CRM import semantics, and consent/display rules.
- Confirm backend endpoints and example payloads using mock fixtures if APIs are not ready.
- Approve route name and page navigation placement.

### Phase 1 — CRM web shell and profile builder

- Add route, role/entitlement wrapper, sidebar entry, page header, and responsive layout.
- Build target profile form with validation, example prompt, loading/error states, and API service boundary.
- Add feature-disabled/unsupported-source state.

### Phase 2 — Search results and prospect review

- Integrate search submission and status lifecycle.
- Build paginated/filterable results, relevance display, provenance, permitted fields, dedupe presentation, detail panel, and selection UX.
- Add empty, stale, partial, and failure states.

### Phase 3 — CRM selection and list creation

- Integrate duplicate lookup and selected-record review.
- Add-to-CRM/list flow with existing CRM fields, permissions, idempotency-safe submission, per-record results, and navigation to created leads.
- Preserve source/profile attribution where supported.

### Phase 4 — Hardening and rollout

- Validate keyboard/screen-reader accessibility, mobile/table widths, dark/light themes, role/entitlement states, and tenant-safe API error handling.
- Add frontend telemetry for feature funnel/usage without contact payloads.
- Use feature-flagged rollout and monitor API failures, import outcomes, and user-visible usage/quota signals.

## Acceptance criteria

- An entitled user can create a target profile with industry, geography, company size/type, need, and roles, then run it through the approved search service.
- A user can distinguish the prospect’s company/contact fields, match rationale, score, source, freshness, permission status, and duplicate state.
- Search lifecycle and all expected loading, empty, partial, disabled, and failure states are handled without losing the profile.
- Restricted fields/records and unsupported sources cannot be exposed or selected for import through the UI; server policy remains authoritative.
- A user can select eligible results, resolve supported CRM duplicate options, add them to CRM/list, and see per-record success/failure with links to created records.
- Feature access follows organization entitlement and CRM role presentation; unauthorized API responses are handled safely.
- No raw prospect/contact data is persisted in browser storage or emitted in client logs/telemetry.
- Feature is discoverable only in the CRM web app; this delivery does not modify Admin, backend, or mobile projects.

## Risks and open decisions

- The feature depends on source licensing, lawful basis, privacy obligations, and organization policy; legal/compliance approval and backend enforcement must precede live-source launch.
- The scoring model and its explainability need product definition before UI copy and score thresholds are finalized.
- CRM lead schema may not represent companies and multiple contacts cleanly; backend mapping and duplicate behavior need agreement.
- Search cost, quotas, response latency, and asynchronous job behavior are unknown until service contracts are defined.
- It is not yet clear whether sales reps can run searches or only work manager-created lists; preserve the existing owner/manager-first pattern until decided.

## Implementation checklist

- [ ] Confirm Phase 0 product, role, legal/compliance, and API decisions.
- [ ] Add CRM web route and entitlement-aware navigation.
- [ ] Implement profile builder and search lifecycle.
- [ ] Implement results, filters, explanations, source/permission labels, and dedupe UX.
- [ ] Implement selected-prospect review and CRM/list import.
- [ ] Validate accessibility, responsive states, and frontend error handling.
- [ ] Confirm production contracts enforce source permission, field release, tenant isolation, and audit/usage requirements.
