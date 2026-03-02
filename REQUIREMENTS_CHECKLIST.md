# Associate Full Stack Engineer – Requirements Checklist

This document maps the assignment requirements to the implementation.

---

## System design & maturity

| Requirement | Implementation |
|------------|----------------|
| System architecture design | Django apps: `organizations`, `users`, `companies`, `contacts`, `activity_log`. Clear separation: models, serializers, views/viewsets, permissions, URLs. Frontend: pages, context (auth), Redux (UI), centralized API service. |
| Multi-tenant data isolation | Every tenant-scoped model has `organization` FK. All list/detail/create/update/delete filter by `request.user.organization_id` (or superadmin sees all). |
| Security awareness | JWT auth; no hardcoded secrets (env only); CORS allowlist; RBAC; org-scoped queries. |
| Clean code structure | Backend: serializers, views, permissions, models in separate modules. Frontend: services/api, context, store, components, pages. |
| Production readiness | .env / .env.example, DEBUG/ALLOWED_HOSTs, CORS, PostgreSQL-ready config, exception handler, pagination. |

---

## Tenant enforcement

| Requirement | Implementation |
|------------|----------------|
| Proper database modeling (organization FKs) | `User.organization`, `Company.organization`, `Contact.organization` (and `Contact.company`). |
| Query-level filtering | In every ViewSet/View: `get_queryset()` filters by `organization_id=request.user.organization_id` (or no filter for superadmin). |
| Middleware or manager level isolation | Optional tenant middleware can be added; currently enforcement is in **permissions** and **get_queryset** in each view. |
| Role-based access control | Custom permission classes: `IsSuperAdmin`, `CanDeleteRecord`, `CanEditRecord`, `CanCreateUser`, `IsSuperAdminOrOrgUser`. Only Admin (and SuperAdmin) can delete; Managers can edit; Staff limited write. |

---

## Organization & user model

| Requirement | Implementation |
|------------|----------------|
| Organization: name, subscription plan (Basic/Pro), created | `Organization`: `name`, `subscription_plan` (Basic/Pro), `br_number`, `created`. |
| User belongs to organization, role (Admin / Manager / Staff) | `User`: `organization` FK (null for superadmin), `role` (superadmin/admin/manager/staff). |
| Only Admin can delete | `CanDeleteRecord` permission: `role in (SUPERADMIN, ADMIN)`. |
| Managers may edit but not delete | Edit views allow Admin/Manager; delete view requires `CanDeleteRecord`. |
| Staff limited write | Staff can create/edit where allowed by view; delete still requires Admin. |

---

## Authentication & API

| Requirement | Implementation |
|------------|----------------|
| JWT-based authentication | `djangorestframework-simplejwt`: `/api/v1/auth/token/`, `/api/v1/auth/token/refresh/`, `/api/v1/auth/me/`. |
| Protected endpoints require valid tokens | `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] = [IsAuthenticated]`; all API views use auth. |

---

## Company & Contact (CRM)

| Requirement | Implementation |
|------------|----------------|
| Company: name, industry, country, logo, organization, created | `Company` model: all fields; `logo` via ImageField (S3 or local). |
| Logo in AWS S3, env vars, no hardcoded credentials, signed URLs | `companies/storage_backends.py`: S3 with env `AWS_*`, `USE_S3_STORAGE`; signed URLs; local fallback. |
| Contact: full name, email (unique per company), phone (8–15 digits optional), role, organization, created | `Contact` model; `ContactSerializer` validates email format, uniqueness per company, phone length. |
| Full CRUD Companies & Contacts | ViewSets with list, create, retrieve, update, destroy (soft delete for Company/Contact). |
| Pagination, search, filtering | DRF `PageNumberPagination`; `SearchFilter` on companies/contacts; ordering params. |
| Soft delete (`is_deleted`) | `Company` and `Contact` have `is_deleted`; delete action sets flag; querysets exclude `is_deleted=True`. |
| Queries scoped to authenticated user’s organization | All company/contact querysets filter by `organization_id=request.user.organization_id` (except superadmin). |

---

## Activity log

| Requirement | Implementation |
|------------|----------------|
| Every CREATE/UPDATE/DELETE on Companies & Contacts generates audit record | `activity_log.services.log_activity()` called in `perform_create`, `perform_update`, `perform_destroy` in Company and Contact ViewSets. |
| Log: user, action type (CREATE/UPDATE/DELETE), model name, object ID, timestamp | `ActivityLog`: `user`, `action_type`, `model_name`, `object_id`, `timestamp`, `organization_id`. |

---

## Backend structure

| Requirement | Implementation |
|------------|----------------|
| Serializers | Each app has `serializers.py` (e.g. `OrganizationSerializer`, `CompanySerializer`, `ContactSerializer`, `ActivityLogSerializer`). |
| Views / ViewSets | `views.py` per app; ViewSets for companies, contacts, activity log; APIViews for auth, organizations, users. |
| Business logic / service layer | `activity_log/services.py` for logging; optional service layer can be extended. |
| Permissions | `users/permissions.py`: custom permission classes. |
| Models | One `models.py` per app. |
| Custom permission classes | `IsSuperAdmin`, `IsOrgAdmin`, `CanDeleteRecord`, `CanEditRecord`, `CanCreateUser`, `IsSuperAdminOrOrgUser`. |
| Consistent API response formatting | `config.exceptions.custom_exception_handler` returns `{ success, error, data }`. |
| Proper exception handling | Custom handler; validation errors surfaced via serializer. |
| Versioned API routing | All routes under `/api/v1/`. |

---

## Frontend

| Requirement | Implementation |
|------------|----------------|
| Login page | `pages/Login.tsx` – username/password, JWT stored, redirect by role. |
| Organization dashboard | Super Admin: `Organizations.tsx` – list/create organizations and first admin. |
| Company management page | `Companies.tsx` – list, search, pagination, add, soft delete. |
| Company detail with nested contact management | `CompanyDetail.tsx` – company info + contacts list, add/edit/delete contacts. |
| Activity log page | `ActivityLog.tsx` – list of audit records with pagination. |
| Protected routing | `ProtectedRoute` + role checks; redirect to login or role-specific dashboard. |
| Centralized API service | `services/api.ts` – axios instance, interceptors, authApi, organizationsApi, companiesApi, contactsApi, activityLogApi. |
| State management (Context / Redux) | Auth: `AuthContext`; UI state: Redux (`store/uiSlice`). |
| Loading states | Loading flags and `CircularProgress` / spinners on list and forms. |
| Error handling | Toasts (`react-hot-toast`) with user-friendly messages via `getErrorMessage()`. |
| Pagination support | Companies, Activity log (and backend) use page/next/previous. |
| Reusable component architecture | `ProtectedRoute`, shared MUI components, shared error/toast pattern. |

---

## Production readiness

| Requirement | Implementation |
|------------|----------------|
| Proper .env usage | Backend and frontend use `.env`; no secrets in code. |
| .env.example | `backend/.env.example`, `frontend/.env.example` with all required variables. |
| Development vs production configuration | DEBUG, ALLOWED_HOSTS, CORS from env; DB and S3 configurable. |
| Correct CORS setup | `django-cors-headers`; `CORS_ALLOWED_ORIGINS` from env (e.g. localhost:5173, 5174). |
| PostgreSQL ready | `config/settings.py` uses `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` when set. |

---

## UX additions (toast & role select)

- **Toasts for errors**: All API errors and auth failures are shown with `react-hot-toast` and user-friendly text from `getErrorMessage()` (handles DRF detail, field errors, status codes).
- **Role select**: Team “Add Member” uses a proper **MUI Select** (FormControl + Select + MenuItem) for **Role** (Staff / Manager / Admin) so users can clearly choose the role.
