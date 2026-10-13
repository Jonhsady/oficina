#!/bin/sh
set -e

i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -gt 10 ]; then
    echo "migrate falhou após 10 tentativas"
    exit 1
  fi
  sleep 2
done

npx prisma db seed
node dist/main.js
