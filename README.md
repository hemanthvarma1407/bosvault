# 🏦 BOS Vault - Professional Management Dashboard

**BOS Vault** is a premium, high-performance internal administration dashboard built with a modern monorepo architecture. It streamlines employee management, Slack integrations, and complex data consolidation with a "wow" factor UI and robust backend services.

---

## ✨ Key Features

- **👔 Employee Directory**: Comprehensive management of personnel records and profiles.
- **💬 Slack Multi-Integration**: Deep integration with Slack for user sync, group management, and automated notifications.
- **📋 Advanced Request Tracking**: Persistent table states, consolidated request views, and optimized data fetching.
- **📊 Real-time Analytics**: Beautiful data visualizations using Recharts and interactive dashboards.
- **🔐 Enterprise Security**: Multi-provider authentication (Google, Microsoft, Local) with JWT and Refresh Token flows.
- **🖨️ Document Generation**: Dynamic generation of QR codes, barcodes, PDF reports, and Excel exports.
- **🤖 AI Powered**: Integrated with Google Gemini for intelligent assistance and data insights.

---

## 🏗️ Project Structure

The project uses **Nx** for monorepo management, ensuring efficient builds and shared code across the stack.

```text
bosvault/
├── packages/
│   ├── frontend/         # Next.js 15+ React Application
│   ├── backend/          # NestJS REST & WebSocket API
│   └── libs/             # Shared Libraries
│       ├── shared-models/     # DB Entities & Type Definitions
│       ├── shared-services/   # Shared Business Logic
│       └── backend-utils/     # Node.js Utilities
├── documents/            # Configuration & Documentation
│   └── environments/     # .env templates for Dev/Live
└── uploads/              # Local storage for file uploads
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20 or higher
- **PostgreSQL**
- **Git**

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bos-vault
   ```

2. Install dependencies (using legacy peer deps for cross-package compatibility):
   ```bash
   npm install --legacy-peer-deps
   ```

### Configuration
1. Navigate to `documents/environments/`.
2. Create/update your environment file (e.g., `dev.env`).
3. Ensure the following variables are set:
   - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
   - `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `SLACK_BOT_TOKEN`, etc.

---

## 🛠️ Available Scripts

| Command | Description |
|:---|:---|
| `npm run dev` | 🚀 **Start everything** (Frontend + Backend) concurrently |
| `npm run dev:frontend` | 🎨 Start only the Frontend (Next.js) |
| `npm run dev:backend` | ⚙️ Start Backend with watch mode & lib rebuilds |
| `npm run build:all` | 📦 Build Shared, Backend, and Frontend for production |
| `npm run clean` | 🧹 Clean `node_modules` and build artifacts |
| `npm run start:backend` | 🟢 Run built Backend production server |

---

## 📚 API Documentation

Once the backend is running, you can access the interactive **Swagger API Documentation** at:
👉 [http://localhost:3001/docs](http://localhost:3001/docs)

---

## 🛡️ License
This project is private and intended for internal use only.
