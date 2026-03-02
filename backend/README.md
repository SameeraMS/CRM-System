# Luxery CRM – Multi-tenant CRM

Production-ready multi-tenant CRM with Django REST Framework (backend), React + Vite + TypeScript (frontend), PostgreSQL (or SQLite for dev), and optional AWS S3 for company logos.

## Features

- **Multi-tenant**: Organizations are isolated; users belong to one organization (or none for Super Admin).
- **Roles**: Super Admin, Admin, Manager, Staff with RBAC (e.g. only Admin can delete).
- **JWT auth**: Login returns access + refresh tokens; refresh is handled automatically on the frontend.
- **CRM**: Companies and Contacts with full CRUD, pagination, search, soft delete.
- **Activity log**: CREATE/UPDATE/DELETE on Companies and Contacts are audited.
- **Super Admin**: Pre-created user can create organizations and assign an admin (username, email, password, telephone, org name, BR number).

## Quick start

### Backend

```bash
# From project root
python3 -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Use SQLite (default): leave .env as is or comment DB_ENGINE.
# Use PostgreSQL: set in .env:
#   DB_ENGINE=django.db.backends.postgresql
#   DB_NAME=luxery_crm
#   DB_USER=...
#   DB_PASSWORD=...
#   DB_HOST=localhost
#   DB_PORT=5432

cp .env.example .env   # then edit .env if needed
python manage.py migrate
python manage.py create_superadmin   # creates user: superadmin / superadmin1234
python manage.py runserver
```

Backend runs at `http://localhost:8000`. API base: `http://localhost:8000/api/v1/`.

### Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### First steps

1. Open `http://localhost:5173`.
2. Log in as **superadmin** / **superadmin1234**.
3. In Super Admin dashboard, open **Organizations** and add an organization (name, plan, BR number, plus admin username, email, password, telephone).
4. Log out and log in with the new org admin (email + password). You’ll see the organization dashboard: Companies, Activity log, Team.
5. Add companies, then open a company to add contacts. All actions are recorded in Activity log.

## Environment

- **Backend** (root `.env`): `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DB_*`, `CORS_ALLOWED_ORIGINS`, `JWT_*`, `AWS_*`, `USE_S3_STORAGE`. See `.env.example`.
- **Frontend** (`frontend/.env`): `VITE_API_BASE_URL` (e.g. `http://localhost:8000/api/v1`).

No credentials are hardcoded; use `.env` and `.env.example` only.

## API overview

- `POST /api/v1/auth/token/` – login (username, password) → access, refresh, user.
- `GET /api/v1/auth/me/` – current user (requires JWT).
- **Organizations** (Super Admin): `GET/POST /api/v1/organizations/`, `GET/PATCH/DELETE /api/v1/organizations/<id>/`.
- **Users**: `GET/POST /api/v1/users/`, `GET/PATCH/DELETE /api/v1/users/<id>/`.
- **Companies**: `GET/POST /api/v1/companies/`, `GET/PATCH/DELETE /api/v1/companies/<id>/`.
- **Contacts**: `GET/POST /api/v1/contacts/`, and nested `GET/POST /api/v1/companies/<id>/contacts/`, etc.
- **Activity log**: `GET /api/v1/activity-log/`.

All list endpoints support `?page=`, `?search=`, and (where applicable) `?ordering=`.

## Tech stack

- **Backend**: Django 6, DRF, Simple JWT, CORS, python-decouple, boto3 (S3), Pillow, PostgreSQL/SQLite.
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS v4, MUI, Framer Motion, React Router, Redux Toolkit, Axios, Context API (auth).

## License

MIT.
