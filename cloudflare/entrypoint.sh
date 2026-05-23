#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Combined entrypoint: starts NestJS backend + Next.js frontend in one container
#
# Background: backend (port 4000), foreground: frontend (port 3000).
# SIGTERM / SIGINT are forwarded to both children for graceful shutdown.
# ---------------------------------------------------------------------------

# Write runtime env for the backend's internal use (if needed)
export DATABASE_URL="file:./dev.db"

# If this is a fresh start, run Prisma migrations
echo "[entrypoint] Running Prisma migrations..."
cd /app/backend
npx prisma migrate deploy 2>/dev/null || echo "[entrypoint] No migrations to apply (or DB already exists)"

# Trap signals for clean shutdown
cleanup() {
  echo "[entrypoint] Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo "[entrypoint] Shutdown complete."
}
trap cleanup SIGTERM SIGINT SIGQUIT

# Start backend
echo "[entrypoint] Starting backend on :4000..."
cd /app/backend
node dist/main.js &
BACKEND_PID=$!

# Start frontend (standalone mode)
echo "[entrypoint] Starting frontend on :3000..."
cd /app/frontend
HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!

echo "[entrypoint] Backend PID=$BACKEND_PID  Frontend PID=$FRONTEND_PID"

# Wait for either child to exit
wait -n "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
EXIT_CODE=$?

echo "[entrypoint] A child process exited (code=$EXIT_CODE). Cleaning up..."
cleanup
exit $EXIT_CODE
