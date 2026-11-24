# Frontend implementation checklist

## Completed for local UI preview
- [x] 13 named React route screens based on the approved Figma layouts.
- [x] Consistent CSS design tokens and shared components.
- [x] Local original logo reference embedded as a file asset.
- [x] Search, filters, sort, pagination, invite wizard, demo dialogs.
- [x] Intentional no-op login and clear demo-only labels.
- [x] No real payment, provider, kiosk or staff API calls.
- [x] Static TS/TSX parse, import-path verification and stylesheet syntax review.

## Must be completed on local development machine
- [ ] Run `npm install`, `npm run typecheck`, `npm run build`.
- [ ] Visually compare each desktop view with the matching Figma frame at 1440 x 900.
- [ ] Test responsive layouts at 360 / 768 / 1024 / 1440 px; fix clipped content.
- [ ] Test keyboard-only navigation, dialogs, focus return and screen readers.
- [ ] Write unit and browser E2E tests for staff filters, wizard, dialogs and routes.
- [ ] Confirm final logo treatment and typography.

## Production release blockers
- [ ] Approved OIDC identity provider and MFA configured.
- [ ] BFF/server-held session and secure cookies implemented.
- [ ] Trusted tenant identity, role permissions, object ownership on backend enforced.
- [ ] Requests and high-risk grants use dual-control approvals.
- [ ] Immutable access/audit records, security tests and independent review.
- [ ] Typed live staff API replaces all mock data and preview controls.
- [ ] Final deployment review and security sign-off.
