#!/bin/sh
# wait-for-it.sh

set -e

host="$1"
shift
cmd="$@"

until nc -z "$host" 3306; do
  echo "Waiting for MySQL to be ready..."
  sleep 1
done

echo "MySQL is ready, executing command: $cmd"
exec $cmd
