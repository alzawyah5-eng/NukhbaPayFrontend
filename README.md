# NukhbaPay Frontend — Staff Management & Operations Portal

[![CI/CD Pipeline](https://github.com/alzawyah5-eng/NukhbaPayFrontend/actions/workflows/ci.yml/badge.svg)](https://github.com/alzawyah5-eng/NukhbaPayFrontend/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/Node-20.x%20%7C%2022.x%20%7C%2024.x-brightgreen.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg)](https://www.typescriptlang.org/)

Modern, reactive staff management and operational dashboard for the **NukhbaPay** financial platform. Built with React 19, TypeScript, and Vite, featuring NukhbaPay's signature brand design system (purple/green), responsive layouts, and 13 operational screens.

---

## 🚀 Features & Screen Directory

The portal provides operations, security, access management, and catalogue publication:

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
│       └── ci.yml               # GitHub Actions CI/CD pipeline
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
│   ├── PlatformApp.tsx          # Production-connected platform app
│   ├── session.ts               # Session management & token handling
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

- **Node.js**: `v20.x`, `v22.x`, or `v24.x`
- **npm** or **pnpm**

### Installation

```bash
# Clone the repository
git clone https://github.com/alzawyah5-eng/NukhbaPayFrontend.git
cd NukhbaPayFrontend

# Install dependencies
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the backend API endpoint:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Development Server

Start the local development server at `http://localhost:5173`:

```bash
npm run dev
```

### Type Checking & Production Build

```bash
# Verify TypeScript types
npm run typecheck

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🔄 CI/CD & Deployment

This repository includes a production-ready **GitHub Actions CI/CD pipeline** (`.github/workflows/ci.yml`):

1. **Lint & Typecheck**: Enforces strict TypeScript compile-time safety on all PRs and pushes.
2. **Production Build**: Compiles Vite assets with production optimization, sourcemap generation, and chunk splitting.
3. **Artifact Upload**: Generates deployable `dist/` bundle ready for hosting on **Cloudflare Pages**, **Vercel**, **Netlify**, or **AWS S3 + CloudFront**.

### Deploy to Cloudflare Pages / Vercel
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Environment variables**: `VITE_API_BASE_URL`

---

## 🔒 Security & Privacy

- **No Secrets in Client**: The client never stores master API keys, database credentials, or provider secrets.
- **Strict Content Security Policy (CSP)**: Compatible with BFF HttpOnly session cookies.
- **CSRF Protected**: Designed to communicate with the NukhbaPay backend session endpoints.

---

## 📄 License & Ownership

Proprietary © NukhbaPay. All rights reserved.
