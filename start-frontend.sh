#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "Starting Blog Frontend..."
npx next dev -p 3000
