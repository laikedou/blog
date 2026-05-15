#!/bin/bash
cd "$(dirname "$0")/backend"
echo "Starting Blog API..."
npx nest start --watch
