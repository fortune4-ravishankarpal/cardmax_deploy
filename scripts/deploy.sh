#!/bin/bash

# Load NVM
export NVM_DIR="/home/ubuntu/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use default

# Add pnpm path manually
export PATH=$PATH:/home/ubuntu/.local/share/pnpm

cd /var/www/production || exit 1

git pull origin production || exit 1

pnpm install || exit 1
pnpm build || exit 1

if pm2 describe production > /dev/null
then
  pm2 restart production
else
  pm2 start npm --name "production" -- start
fi

pm2 save
