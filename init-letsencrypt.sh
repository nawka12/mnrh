#!/bin/bash

domains=(moonaroh.com www.moonaroh.com)
email="kayfa.haluk.y@gmail.com" # Using your actual email
staging=1 # Set to 1 for testing

data_path="./certbot"
rsa_key_size=4096

if [ -d "$data_path" ]; then
  read -p "Existing data found. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# Create required directories
mkdir -p "$data_path/conf/live/moonaroh.com"
mkdir -p "$data_path/www"

echo "### Creating dummy certificate..."
openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
  -keyout "$data_path/conf/live/moonaroh.com/privkey.pem" \
  -out "$data_path/conf/live/moonaroh.com/fullchain.pem" \
  -subj "/CN=localhost"

echo "### Stopping existing containers..."
sudo docker-compose down

echo "### Starting app service..."
sudo docker-compose up -d --build app

echo "### Waiting for app service to start..."
sleep 10

echo "### Requesting Let's Encrypt certificate..."
sudo docker-compose run --rm certbot \
    certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -v \
    --email $email \
    -d moonaroh.com \
    -d www.moonaroh.com \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --no-eff-email \
    --staging \
    --force-renewal

echo "### Restarting app service..."
sudo docker-compose restart app 