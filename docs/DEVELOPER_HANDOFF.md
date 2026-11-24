# NukhbaPay Staff Management — Developer Handoff

**Status:** UI concept approved for implementation; **not a deployed authentication or staff-management system**.  
**Source of truth:** [Editable Figma file](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg) and the user-provided `.fig` backup.  
**Deliverable scope:** Thirteen desktop screens, shared design tokens, reusable frontend components, API integration boundaries, validation requirements and security acceptance criteria.

## 1. Design review and implementation decisions

The screens communicate hierarchy well: a left navigation, clear content titles, four-metric overview cards, readable tables and prominent purple actions. The layout is light and consistent with NukhbaPay's purple/green identity.

**Fix before production release:**
- Replace the temporary wordmark/placeholder with the approved original logo asset. The Figma file currently shows a simplified brand treatment, not the exact uploaded logo.
- Ensure staff-directory rows and other long tables show all entries, accessible pagination, responsive overflow and empty/error states.
- Complete keyboard-focus, form validation, loading, error, empty, offline, forbidden and session-expired states. The original frames are desktop designs, not a verified responsive design system.
- Confirm action wording and permission scopes against the final security model; UI labels do not authorize actions.
- Run formal accessibility, browser, screen-reader and security review before deployment.

## 2. Design system (from Figma)

| Token | Value | Usage |
|---|---|---|
| `--nb-purple` | `#8224D8` | Primary CTAs, active navigation, accent |
| `--nb-purple-dark` | `#6816AE` | Text accents, hover |
| `--nb-green` | `#00B978` | Success accent |
| `--nb-green-dark` | `#008D5B` | High-contrast success text |
| `--nb-canvas` | `#F6F8FB` | Main application background |
| `--nb-white` | `#FFFFFF` | Sidebar, cards, toolbar |
| `--nb-ink` | `#1F2937` | Main text |
| `--nb-muted` | `#64748B` | Supporting text |
| `--nb-border` | `#E6EAF0` | Dividers and outlines |
| `--nb-lavender` | `#F5EBFF` | Active nav, purple badges |
| `--nb-mint` | `#E7F9F1` | Success backgrounds |
| `--nb-amber` | `#FFF5E6` | Pending/review backgrounds |
| `--nb-red` | `#FDECEB` | Suspended/denied backgrounds |

**Typography:** Inter; sizes roughly 11–14px for tables, 16–18px for cards, 27–29px for page titles. Use accessible scalable text rather than rigid pixel locks.

**Desktop reference:** 1440×900 canvas, 248px left sidebar, 76px toolbar, 24–35px horizontal content spacing. Cards 12–16px radius, inputs/buttons around 9–10px radius, status pills approximately 13px radius. Target responsiveness at 360, 768, 1024 and 1440px; mobile layout not present in original Figma.

**Shared components:** AppShell, Sidebar, TopBar, PageHeading, StatCard, SurfaceCard, DataTable, StatusBadge, SearchInput, Select, TextField, Button, Modal, InlineNotice, EmptyState and ConfirmDialog. Extract these into local React components with centralized tokens.

## 3. Screen-by-screen handoff

The links below open the specific Figma frames. Screen data shown in the design is illustrative.

| ID | Screen / Figma | Route | Required implementation behavior |
|---|---|---|---|
| 01 | [Staff overview](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-2) | `/overview` | Metrics, recent activity, pending approvals, links to tasks |
| 02 | [Staff directory](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-131) | `/staff` | Search, filter, sort, pagination, open profile |
| 03 | [Invite staff](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-246) | `/staff/invite` | Validated invitation wizard; no implicit activation |
| 04 | [Staff profile](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-322) | `/staff/:staffId` | Roles, details, recent events, account action confirmation |
| 05 | [Roles & permissions](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-421) | `/roles` | Role selection, permission matrix, change request; approval for sensitive grants |
| 06 | [Departments & teams](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-547) | `/departments` | Team cards, member counts, manager and scoped detail |
| 07 | [Access requests](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-658) | `/access-requests` | Filtered queue, review detail, approve/reject with reason and authorization checks |
| 08 | [Security center](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-765) | `/security` | MFA posture, policy indicators and security alerts (authorized readers only) |
| 09 | [Sessions & devices](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-880) | `/sessions` | Session list and revocation with step-up auth when required |
| 10 | [Audit logs](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-987) | `/audit` | Read-only filterable immutable audit events; export is privileged |
| 11 | [Reports](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-1094) | `/reports` | Aggregate workforce reports, authorized export and export audit event |
| 12 | [Workspace settings](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-1208) | `/settings` | Preferences vs privileged policy changes clearly separated |
| 13 | [Secure staff sign-in](https://www.figma.com/design/1N5xohAzpz6aMY3YrVVNgg?node-id=2-1302) | `/login` | Real OIDC redirect in production; the local demo explicitly does not sign in |

**Prototype interaction expectations:** Navigation should work without page reload; buttons have clear hover/focus/disabled states. Tables support keyboard navigation and no horizontal clipping at desktop widths. Mutations require a confirmation dialog and visible result/error. Screen readers announce status changes.

## 4. Proposed frontend implementation

**Delivery:** standalone React + TypeScript + Vite project in `nukhbapay-staff-react/` because the original application repository was not provided. Do not replace or overwrite the user's existing project. Migrate components into the existing staff frontend after reviewing its conventions.

```text
src/
  components/   # Sidebar, AppShell, PageHeader, Table, Modal, Badge, Cards
  data/         # Local read-only fake data and demo types
  pages/        # 13 view modules or composed route views
  styles.css    # Responsive layout + theme tokens
  App.tsx       # Client-side route and demo interaction state
  main.tsx      # Vite application entry
```

The frontend can demonstrate navigation, search, filters, empty states, and confirmation workflows. It **must not** claim to implement staff login, grant permissions, persist financial/security changes, or talk to actual production APIs.

## 5. API boundary — proposed contracts, not implemented endpoints

All frontend-to-backend calls should target the NukhbaPay central platform API (or its staff-facing BFF). The frontend must **never** directly call service-provider APIs, kiosk provider systems, or provider secrets. Route naming below is a proposal, not an assertion about the existing repository.

| API operation | Example route | Permission concept |
|---|---|---|
| Current actor/context | `GET /staff-api/v1/me` | Authenticated staff |
| Staff list/profile | `GET /staff-api/v1/staff`, `GET /staff-api/v1/staff/:id` | `staff:read` + tenant scope |
| Invite staff | `POST /staff-api/v1/invitations` | `staff:invite` |
| Staff state change | `POST /staff-api/v1/staff/:id/suspension-requests` | `staff:suspend:request` |
| Roles and effective permissions | `GET /staff-api/v1/roles`, `GET /staff-api/v1/permissions` | `roles:read` |
| Role request | `POST /staff-api/v1/access-requests` | `access:request` |
| Access review | `POST /staff-api/v1/access-requests/:id/decision` | `access:approve` + separation-of-duties |
| Departments | `GET /staff-api/v1/departments` | `departments:read` |
| Security posture | `GET /staff-api/v1/security/summary` | `security:read` |
| Session inventory and revocation | `GET /staff-api/v1/sessions`, `POST /staff-api/v1/sessions/:id/revoke` | `sessions:read/revoke` |
| Immutable audit events | `GET /staff-api/v1/audit-events` | `audit:read` |
| Reports/export | `GET /staff-api/v1/reports/...` | `reports:read/export` |
| Preferences/policies | `PATCH /staff-api/v1/me/preferences`, `POST /staff-api/v1/policy-change-requests` | Separate self/policy permissions |

**Example DTO shape:** `StaffMember { id, tenantId, displayName, email, departmentId, roleIds, status, lastLoginAtUtc }`. `AccessRequest { id, tenantId, requesterId, subjectId, requestedRoleIds, reason, riskLevel, status, reviewerId?, reviewedAtUtc?, createdAtUtc }`. `AuditEvent { id, tenantId, actorId, action, resourceType, resourceId, outcome, occurredAtUtc, requestId }`.

Use UTC ISO-8601 timestamps in all API/DB contracts; present local times via `Intl.DateTimeFormat` using authorized preference timezone (`Africa/Algiers`, `Asia/Dubai`, etc.). This presentation logic does not change stored audit timestamps.

## 6. Security requirements — release blockers

1. **Trusted identity:** Managed OIDC provider is still a proposal, not connected. Use Authorization Code + PKCE with verified issuer/audience, no custom password handling in the staff UI, and phishing-resistant MFA where supported.
2. **Session model:** Prefer a backend-for-frontend with server-held OAuth tokens and Secure, HttpOnly, SameSite session cookies; enforce CSRF protection as appropriate. No real credentials, tokens, or provider keys in browser localStorage or source code.
3. **Server-side authorization:** Every route, action, tenant ID and object must be checked by the backend. UI hiding is usability only, never a security barrier. A default-deny model and explicit action scopes are required.
4. **Separation of duties:** No self-approval for high-risk grants or changes to sensitive price publication permissions. Record full approver/requester decision history.
5. **Auditability:** Append-only security event records with immutable event IDs, actor/resource/tenant scope, outcome and trace IDs; redact sensitive fields, restrict access and protect retention.
6. **Input safety:** Server validation, idempotent mutation requests where applicable, request limits, output encoding, anti-CSRF, security headers, safe errors and no secrets in telemetry.
7. **Tenant isolation:** Tenant scope derived from trusted server identity, never trusting a free-form `tenantId` header or client-supplied tenant ID. All DB queries and object checks enforce ownership.
8. **Release gate:** Independent threat model, permission matrix review, negative authorization tests, MFA/IdP tests, CSRF/XSS checks, audit verification, accessibility tests and security sign-off. No architecture can guarantee a 0% breach probability.

**Architecture context:** The staff frontend is distinct from the payment application's React UI and the kiosk CRM frontend (technology not confirmed). It consumes only the centralized NukhbaPay staff API. No live payment, transfer or provider integration belongs in this demo.

## 7. Acceptance checklist for the frontend

- [ ] All 13 routes visually match the approved Figma frames in desktop layout.
- [ ] Functional sidebar, mobile navigation, table search/filter, invite form validation and request dialogs in the demo.
- [ ] Semantic labels, focus states, dialogs, keyboard and color-contrast reviewed.
- [ ] Responsive layouts inspected at mobile/tablet/desktop breakpoints.
- [ ] Demo/mocked data clearly labeled and impossible to confuse with live operations.
- [ ] No client-side secrets or simulated authorization presented as production security.
- [ ] Production API contract, OIDC provider, roles, permissions and security review approved before integration.
- [ ] Unit/E2E checks added in the actual project before launch.

## 8. How to hand off to the implementation team

1. Store a local `.fig` backup and give read access to the Figma design link.
2. Open `nukhbapay-staff-react` as a **standalone review application**. Do not merge into the existing backend automatically.
3. Match its routes and components to the real repo, replace mock data with typed API services, and add backend-permission-driven navigation.
4. Implement Brick 3 trusted identity/tenant authorization before any staff mutation; implement catalogue publication only after authorized backend rules are validated.

Prepared from the supplied Figma design and uploaded local backup. No real backend endpoints or staff accounts were verified in this handoff.
