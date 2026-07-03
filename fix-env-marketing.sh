#!/bin/bash
cd /var/www/classgrid_platform/server

# Remove mangled VERCEL_MARKETING_PROJECT_ID if it exists
sed -i '/VERCEL_MARKETING_PROJECT_ID/d' .env

# Append correct clean line
echo "VERCEL_MARKETING_PROJECT_ID=prj_FUJs3VfpUwcxHxvZoefsapzXzGRO" >> .env

pm2 restart all
