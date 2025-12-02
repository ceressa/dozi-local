@echo off
echo Starting Dozi Admin Panel...

echo Starting backend...
start cmd /k "cd backend && npm run dev"

echo Starting frontend...
start cmd /k "cd frontend && npm run dev"

timeout 2
echo Opening browser...
start http://localhost:5173

exit
