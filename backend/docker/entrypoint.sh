#!/bin/sh
set -e

# Run migrations (retry a few times in case DB isn't ready yet, e.g. ECS + RDS)
echo "Running prisma migrate deploy..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if npx prisma migrate deploy; then
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "prisma migrate deploy failed after 10 attempts"
    exit 1
  fi
  echo "Attempt $i/10 failed, retrying in 2s..."
  sleep 2
done

echo "Starting app..."
exec "$@"