## Progress Log

### Approach We Are Taking
- Run backend and frontend as two separate processes.
- Use `uv` for Python environment and backend server lifecycle.
- Validate backend first (`/health`, `/docs`), then start and verify frontend.
- Debug from terminal output first before changing code.

### Steps Completed So Far
1. Confirmed project structure (`backend` + `frontend`) and startup commands.
2. Attempted `uv` flow, initially failed because `uv` command was not available in PowerShell.
3. Installed/reinstalled `uv` with `winget` and diagnosed PATH issues.
4. Identified shell differences (`ls -la` and `source` are Linux-style commands, not PowerShell).
5. Created backend virtual environment and switched to correct PowerShell activation command.
6. Started backend successfully with:
   - `uv run uvicorn app.main:app --reload`
7. Verified backend is healthy from logs:
   - `GET /health` returns `200 OK`.

### Current Failure / Active Issue
- "Blank page" confusion is not a backend crash.
- Backend is running correctly, but it does not render a UI at `/`.
- Wrong endpoint attempts caused expected 404s (e.g., `/health/docs`).
- Current focus: start frontend separately and open the frontend URL instead of backend root.

### Next Immediate Steps
1. In a new terminal:
   - `cd frontend`
   - `npm install` (if needed)
   - `npm run dev`
2. Open the Vite URL (usually `http://localhost:5173`).
3. Keep backend terminal running in parallel on `http://127.0.0.1:8000`.

### Progress Log Addendum
8. Implemented full backend CRUD for core domains with thin routers and service-layer logic:
   - `users`: create/list/get/update/delete
   - `routes`: create/list/get/update/delete + recommend
   - `payments`: create/get/list-by-user/update/delete
9. Added update schemas and service methods aligned with FastAPI + Pydantic v2 style:
   - `UserUpdate`, `RouteUpdate`, `PurchaseUpdate`
10. Extended backend API tests for CRUD flows (`users`, `routes`, `payments`).
11. Ran backend tests successfully:
   - `uv run pytest -q` -> `5 passed`
12. Simplified auth response to only include `access_token`:
   - Removed `token_type` from `LoginResponse`
   - Updated login test expectations
13. Verified OpenAPI/Swagger schema for auth response:
   - `LoginResponse` now contains only required `access_token`.
