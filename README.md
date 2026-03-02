# Luxery CRM

Multi-tenant CRM with Django REST Framework (backend) and React + Vite + TypeScript (frontend). JWT auth, role-based access, companies & contacts with optional S3 logos, and activity logging.

---

## How to run

**Prerequisites:** Python 3.10+, Node.js 18+

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Edit if needed (DB, CORS, S3)
python manage.py migrate
python manage.py create_superadmin   # superadmin / superadmin1234
python manage.py runserver
```

API: `http://localhost:8000/api/v1/`

### 2. Frontend

```bash
cd frontend
cp .env.example .env              # Set VITE_API_BASE_URL=http://localhost:8000/api/v1
npm install
npm run dev
```

App: `http://localhost:5173` (or the port Vite shows)

### 3. First use

1. Open the app URL and log in as **superadmin** / **superadmin1234**.
2. In Super Admin: **Organizations** → Add organization (name, plan, BR number, admin user).
3. Log out and log in as the new org admin → use **Companies**, **Team**, **Activity log**.

---

## Project structure

```
Luxery CRM/
├── README.md                 # This file
├── REQUIREMENTS_CHECKLIST.md # Assignment requirements mapping
├── backend/
│   ├── config/               # Django settings, URLs, exceptions
│   ├── organizations/        # Org model, serializers, views (Super Admin)
│   ├── users/                # User model, auth (JWT), permissions, Team API
│   ├── companies/            # Company CRUD, logo (S3/local), storage_backends
│   ├── contacts/             # Contact CRUD, nested under companies
│   ├── activity_log/         # Audit log model, service, API
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
└── frontend/
    ├── src/
    │   ├── pages/            # Login, Dashboard, Companies, CompanyDetail, Team, ActivityLog, SuperAdmin*
    │   ├── context/          # AuthContext (user, login, logout)
    │   ├── components/       # ProtectedRoute
    │   ├── services/         # api.ts (axios, all API calls)
    │   ├── store/            # Redux (UI state)
    │   ├── types/            # TypeScript types
    │   └── utils/            # errorMessage
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── .env.example
    └── .gitignore
```

---

## System overview

- **Multi-tenant:** Data is scoped by **organization**. Users belong to one org (or none for Super Admin). All list/detail/create/update/delete filter by `organization_id`.
- **Roles:** Super Admin (all orgs), Admin (org + delete), Manager (org + edit), Staff (org, limited write). Enforced in backend permissions and frontend UI (e.g. hide delete for non-admin).
- **CRM:** Companies (name, industry, country, logo) and Contacts (full name, email, phone, role) with full CRUD, pagination, search, soft delete.
- **Storage:** Company logos in local `media/` or AWS S3 via env; signed URLs when S3 is used.

---

## Authentication flow

1. **Login:** `POST /api/v1/auth/token/` with `username` and `password` → returns `access`, `refresh`, and `user` (incl. role, organization).
2. **Frontend:** Stores `access` and `refresh` in localStorage; sets Axios default `Authorization: Bearer <access>`.
3. **Protected routes:** React checks `user` from AuthContext; Super Admin → `/superadmin`, org users → `/dashboard`; unauthenticated → `/login`.
4. **Refresh:** When a request gets 401, frontend can call `POST /api/v1/auth/token/refresh/` with `refresh` and retry with new `access`.
5. **Me:** `GET /api/v1/auth/me/` returns current user (used after login and for session restore).

---

## CRUD operations

- **Organizations:** Super Admin only. List/create at `/api/v1/organizations/`, retrieve/update/delete at `.../<id>/`. Create also creates the first admin user.
- **Users (Team):** List/create at `/api/v1/users/` (org-scoped; Super Admin sees all). Detail/update/delete at `.../<id>/`.
- **Companies:** List/create at `/api/v1/companies/` (org-scoped; Super Admin can filter by org). Detail/update/delete at `.../<id>/`. Logo via multipart form.
- **Contacts:** Top-level list at `/api/v1/contacts/`. Nested under company: list/create at `/api/v1/companies/<id>/contacts/`, detail/update/delete at `.../<id>/`.
- All list endpoints support `?page=`, `?search=`, and (where applicable) `?ordering=` and `?organization=` (Super Admin companies).

---

## Activity logging

- **What:** CREATE, UPDATE, DELETE on Companies and Contacts are recorded in `activity_log` (user, action_type, model_name, object_id, organization_id, timestamp).
- **Where:** `activity_log.services.log_activity()` is called from company/contact viewset `perform_create`, `perform_update`, `perform_destroy`.
- **API:** `GET /api/v1/activity-log/` returns paginated log entries (org-scoped; Super Admin sees all). Frontend: **Activity log** (org) and **Super Admin → Activity** (all orgs).

---

## Architecture decisions (brief)

- **Backend:** Django apps per domain (organizations, users, companies, contacts, activity_log). ViewSets + serializers + permission classes keep endpoints consistent and tenant-safe. Custom exception handler and serializer validation messages for clear API errors.
- **Frontend:** Single SPA with React Router; AuthContext for identity; centralized `api.ts` for all HTTP; role/organization drive routes and UI (e.g. Super Admin vs dashboard). Logo URLs: prefer `logo_url` (S3 or local), fallback to `logo` when it’s a full URL so images work even if S3 fails.
- **Multi-tenancy:** No middleware; isolation via `get_queryset()` and `perform_create` using `request.user.organization_id` (and optional `organization` from body for edge cases). Same codebase for all tenants.
- **Storage:** Pluggable backend (local vs S3) via `companies.storage_backends`; env-driven so no hardcoded credentials. Signed URLs for S3 so the bucket can stay private.
- **Secrets and config:** All sensitive and environment-specific values in `.env`; `.env.example` documents variables without values. No secrets in repo.

---

For more backend detail (API list, env vars), see `backend/README.md`. For requirements mapping, see `REQUIREMENTS_CHECKLIST.md`.
