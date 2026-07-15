# Placement Portal Application (PPA)

A campus placement management system built for the MAD I project brief, with three roles —
Admin, Company, Student — and background jobs handled by Celery/Redis.

**Student:** Abhishek Ramesh Kumar (21F3002090)

---

## Stack

- **Backend:** Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Caching, Flask-CORS
- **Database:** SQLite (created programmatically via `db.create_all()` — no manual DB Browser step)
- **Caching / broker:** Redis (falls back to an in-memory cache automatically if Redis isn't running)
- **Background jobs:** Celery (worker + beat)
- **Frontend:** VueJS 3 + Vue Router (CDN build, no npm/build step) + Bootstrap 5 + Chart.js + Axios

---

## Folder structure

```
placement_portal_21F3002090/
├── backend/
│   ├── app.py                
│   ├── config.py             
│   ├── extensions.py          
│   ├── models.py              
│   ├── decorators.py          
│   ├── celery_app.py          
│   ├── tasks.py               
│   ├── seed_demo_data.py      
│   ├── requirements.txt
│   └── routes/
│       ├── auth_routes.py
│       ├── admin_routes.py
│       ├── company_routes.py
│       ├── student_routes.py
│       └── drive_routes.py
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── app.js
        ├── services/          # api.js, auth.js
        └── components/        # One component per page
```

---

## Running it locally (Windows / PowerShell)

Open 4 terminals. Each new terminal needs its own `venv\Scripts\activate` — activation only
applies to the terminal session it was run in.

**Terminal 1 — Backend**
```powershell
cd backend
venv\Scripts\activate
python app.py
```
Creates `instance/placement_portal.db` and prints the admin credentials on first run.

**Terminal 2 — Celery worker**
```powershell
cd backend
venv\Scripts\activate
celery -A celery_app.celery worker --loglevel=info
```

**Terminal 3 — Celery beat** (only needed to test the scheduled reminder/report jobs)
```powershell
cd backend
venv\Scripts\activate
celery -A celery_app.celery beat --loglevel=info
```
Requires Redis running locally.

**Terminal 4 — Frontend**
```powershell
cd frontend
python -m http.server 8080 --bind 127.0.0.1
```

Open **http://localhost:8080** in your browser.

---

## Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@ppa.com | Admin@123 |
| Student / Company | whatever was used at signup | — |

Admin is auto-created on first run — there is no admin registration form, by design.

---

## Resetting the database

```powershell
cd backend
del instance\placement_portal.db
python app.py
```
Wipes all students/companies/drives/applications and recreates just the admin account.

---