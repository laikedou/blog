#!/bin/bash
echo "=== Blog Platform Setup ==="
echo ""

# Setup Backend
echo ">>> Setting up backend..."
cd "$(dirname "$0")/backend"
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
echo "Backend ready!"
echo ""

# Setup Frontend
echo ">>> Setting up frontend..."
cd "$(dirname "$0")/frontend"
npm install
echo "Frontend ready!"
echo ""

echo "=== Setup Complete! ==="
echo ""
echo "To start the backend:  cd backend && npm run start:dev"
echo "To start the frontend: cd frontend && npm run dev"
echo ""
echo "Default admin login: admin / admin123"
echo "Demo user login:     demo / user123"
echo ""
echo "API Docs (backend running): http://localhost:4000/api/docs"
echo "Frontend:                  http://localhost:3000"
