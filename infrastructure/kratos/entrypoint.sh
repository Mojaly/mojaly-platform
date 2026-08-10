#!/bin/sh
set -e

echo "Running Mojaly Kratos migrations..."
kratos migrate sql -c /etc/config/kratos/kratos.yml -e --yes

echo "Starting Mojaly Kratos..."
exec kratos serve -c /etc/config/kratos/kratos.yml