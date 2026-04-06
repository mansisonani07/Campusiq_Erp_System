# Student ERP System (Python + FastAPI)

A modern, responsive Student ERP where website sections and operations are managed through an admin panel.

## Core capabilities
- Admin panel controls students, courses, enrollments, attendance, grades, fees, announcements, and homepage content.
- Student portal for attendance %, grade average, course list, fees, and notices.
- Unique feature: risk intervention engine that computes risk scores from attendance + grades and suggests actions.
- Role-based access control for admin, teacher, accountant, and counselor.
- Advanced dashboard KPIs with 30-day trends, fee alerts, and action center.
- Fee reminders queue and downloadable fee receipts.
- Cloud database ready using `DATABASE_URL` (works with free providers like Neon, Supabase Postgres, Render Postgres).
- Responsive UI with lightweight CSS and small JS for smooth page-load animations.
- Centralized session and cookie management with idle timeout across all pages.
- Multi-step authentication: login with Email or Phone, OTP verification, account registration, and forgot-password reset via OTP.

## Tech stack
- FastAPI
- SQLAlchemy ORM
- Jinja2 templates
- Session auth
- SQLite (local) or Postgres (cloud)

## Run locally
1. Create virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Create env file:
   ```bash
   copy .env.example .env
   ```
3. Start server:
   ```bash
   uvicorn app.main:app --reload
   ```
4. Open `http://127.0.0.1:8000`

## Default accounts
- Admin: `admin@erp.local` / `admin123`
- Teacher: `teacher@erp.local` / `teacher123`
- Accountant: `accountant@erp.local` / `account123`
- Counselor: `counselor@erp.local` / `counsel123`
- Student: `student@erp.local` / `student123`

## Free cloud database setup
- Create a free Postgres DB on Neon or Supabase.
- Put the provided connection string in `.env` as `DATABASE_URL`.
- Example:
  ```
  DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST/DBNAME
  SECRET_KEY=your-strong-secret
  ```

## Session and cookie config
- `SESSION_IDLE_TIMEOUT_MINUTES`: auto-logout after inactivity
- `COOKIE_MAX_AGE_SECONDS`: browser cookie lifetime
- `COOKIE_SECURE`: set `true` in HTTPS production
- `COOKIE_SAME_SITE`: `lax`/`strict`/`none`
- `COOKIE_NAME`: session cookie name
- CSRF protection is enabled for all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).

## OTP and delivery config
- `EMAIL_PROVIDER=smtp` to send real email OTP via Gmail SMTP.
- `EMAIL_FALLBACK_CONSOLE=true` allows development fallback (OTP printed in terminal if SMTP fails).
- `SMS_PROVIDER=twilio` for Twilio SMS, `SMS_PROVIDER=textbelt` for direct non-Twilio SMS, `SMS_PROVIDER=custom_api` for your own SMS API, or `SMS_PROVIDER=console` for local development.
- Configure:
  - `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE`
  - `TEXTBELT_API_URL`, `TEXTBELT_API_KEY`
  - `CUSTOM_SMS_API_URL`, `CUSTOM_SMS_API_KEY`, `CUSTOM_SMS_API_TIMEOUT_SECONDS`

### Gmail fix for `535 Username and Password not accepted`
1. Enable 2-Step Verification on your Google account.
2. Create an App Password in Google account security settings.
3. Set `.env`:
   - `SMTP_USER=your-gmail@gmail.com`
   - `SMTP_PASSWORD=<16-char-app-password>`
   - `SMTP_FROM=your-gmail@gmail.com`

## Free development mode (no SMS cost)
- Use this in `.env`:
  - `SMS_PROVIDER=console`
  - `EMAIL_FALLBACK_CONSOLE=true`
- Behavior:
  - Email OTP is sent using SMTP, or printed in terminal if SMTP fails.
  - SMS OTP is printed in terminal logs as `[DEV-SMS] ... OTP: ...`.
  - Full login + OTP flow still works, no Twilio charges during development.

## Using your own SMS API
- Set in `.env`:
  - `SMS_PROVIDER=custom_api`
  - `CUSTOM_SMS_API_URL=https://your-api.example.com/send-sms`
  - `CUSTOM_SMS_API_KEY=your-api-key` (optional if your API is open in dev)
- Request body sent by ERP:
  - `{"to":"<phone>","message":"<otp_or_alert_text>","source":"nova-student-erp"}`
- Expected response:
  - Prefer JSON like `{"ok": true, "message": "queued"}` or `{"success": true}`
  - Any HTTP 2xx with empty body is also treated as success.

## Built-in non-Twilio SMS (Textbelt)
- Set in `.env`:
  - `SMS_PROVIDER=textbelt`
  - `TEXTBELT_API_URL=https://textbelt.com/text`
  - `TEXTBELT_API_KEY=textbelt` (Textbelt public test key; limited quota)
- Notes:
  - Public key usually has very limited free quota.
  - For stable real usage, buy/use your own Textbelt key.

## Suggested production upgrades
- Alembic migrations
- Role-specific dashboards for teacher/parent
- Payment gateway integration
- Background jobs for notifications
- API token auth + audit logs
