# NukhbaPay Frontend — Staff Management & Operations Portal

[![Frontend CI](https://github.com/alzawyah5-eng/NukhbaPayFrontend/actions/workflows/ci.yml/badge.svg)](https://github.com/alzawyah5-eng/NukhbaPayFrontend/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/Node-20.x%20%7C%2022.x%20%7C%2024.x-brightgreen.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg)](https://www.typescriptlang.org/)

Modern, reactive staff management and operational dashboard for the **NukhbaPay** financial platform. Built with React 19, TypeScript, and Vite, featuring NukhbaPay's signature brand design system (purple/green), responsive layouts, and 13 operational screens.

---

## 🚀 Features & Screen Directory

The staff workspace includes the following screen designs. The backend determines which screens and actions are available to each authenticated staff member.

| # | Screen | Description | Path |
|---|---|---|---|
| **01** | **Overview** | Account metrics, session status, and workspace widgets | `/overview` |
| **02** | **Staff Directory** | Searchable tenant membership, roles, and status tags | `/staff` |
| **03** | **Invite Staff** | Structured onboarding workflow with approval requirements | `/staff/invite` |
| **04** | **Staff Profile** | Deep-dive staff dossier, active permissions, and activity timeline | `/staff/:staffId` |
| **05** | **Roles & Permissions** | Role matrix, privilege breakdown, and tenant policies | `/roles` |
| **06** | **Departments & Teams** | Department organizational units and member allocation | `/departments` |
| **07** | **Access Requests** | Gated approval intake, pending review queues, and audit log | `/access-requests` |
| **08** | **Security Center** | MFA status, session bounds, credentials, and step-up authentication | `/security` |
| **09** | **Sessions & Devices** | Active tokens, browser instances, IP origin, and remote revoke | `/sessions` |
| **10** | **Audit Logs** | Immutable chronological operational event trail | `/audit` |
| **11** | **Staff Reports** | Visual staff composition, departmental metrics, and analytics | `/reports` |
| **12** | **Settings** | Personal preferences, theme customization, and workspace preferences | `/settings` |
| **13** | **Catalogue & Publication**| Digital gift cards / mobile offers catalog, pricing candidates, and publication workflows | `/catalogue`, `/catalogue/publication` |

---

## 🛠️ Tech Stack

- **Runtime & Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript 5.7+](https://www.typescriptlang.org/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Design System**: NukhbaPay Custom UI Kit (`docs/design-system/`)
- **Backend API**: Proxied to NestJS Backend (`NukhbaPayBackend`)

---

## 📦 Project Structure

```text
frontend/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions checks and build
├── docs/
│   ├── design-system/           # 13 Figma screens PNGs, UI Kit (.fig), and specs
│   ├── DEVELOPER_HANDOFF.md     # Engineering handoff document
│   └── IMPLEMENTATION_NOTES.md  # Architecture implementation notes
├── public/
│   └── nukhbapay-original-logo-reference.png
├── src/
│   ├── components/              # AppShell, Button, Panel, Badge, Modals, Forms
│   ├── data/                    # Demo context providers, mock fallbacks
│   ├── lib/                     # UI utilities, classnames, formatters
│   ├── pages/                   # 13 core application screen components
│   ├── App.tsx                  # Standalone preview routes & demo shell
│   ├── PlatformApp.tsx          # Session-gated platform app
│   ├── session.ts               # Same-origin staff session requests
│   ├── department.ts            # Department definitions & helpers
│   ├── styles.css               # Core design system stylesheet
│   ├── platform.css             # Platform extensions stylesheet
│   └── main.tsx                 # Application entry point
├── .env.example                 # Example environment variables
├── .gitignore                   # Tailored gitignore for Vite/React
├── index.html                   # HTML template
├── package.json                 # Dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with API reverse proxy
└── README.md                    # Project documentation
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js 22** and **npm** for the standalone frontend. Node.js 24 also works for the Windows commands below.
- The [NukhbaPay backend](https://github.com/alzawyah5-eng/NukhbaPayBackend) for API and Staff Portal access.

### Installation

```bash
# Clone the repository
git clone https://github.com/alzawyah5-eng/NukhbaPayFrontend.git
cd NukhbaPayFrontend

# Install dependencies
npm ci
```

### Development Server

Start Vite at `http://127.0.0.1:5173`.

```bash
npm run dev
```

The Vite development proxy defaults to `http://localhost:3000`. Set `VITE_API_BASE_URL` in the environment of the Vite process to override it. This setting applies to the local proxy.

For a database-backed Auth0 login, start the HTTPS Staff Portal from the backend repository and open `https://localhost:3001/login`. The portal serves the browser app and its authenticated endpoints on the same origin.

### Type Checking & Production Build

```bash
# Verify TypeScript types
npm run typecheck

# Build for production
npm run build

# Preview production build locally
npm run preview
```

On Windows with Node.js 24, if Vite's standard config loader cannot access the workspace, use:

```powershell
npm.cmd run build -- --configLoader native
npm.cmd run preview -- --configLoader native --host 127.0.0.1 --port 5173
```

---

## CI and release

GitHub Actions installs the lockfile, checks TypeScript, builds and uploads `dist/`, and verifies the artifact on `main`.

Deployment is configured separately. An authenticated release needs an HTTPS origin that serves the app and routes `/auth/*` and staff requests to the backend-for-frontend, plus the matching Auth0 callback and logout URLs.

---

## 🔒 Security & Privacy

- **No Secrets in Client**: The client never stores master API keys, database credentials, or provider secrets.
- **Strict Content Security Policy (CSP)**: Compatible with BFF HttpOnly session cookies.
- **CSRF Protected**: Designed to communicate with the NukhbaPay backend session endpoints.

---

## 📄 License & Ownership

Proprietary © NukhbaPay. All rights reserved.
