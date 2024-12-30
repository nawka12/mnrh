#!/bin/bash

domains=(moonaroh.com www.moonaroh.com)
email="your-email@example.com" # Change this to your email
staging=0 # Set to 1 if you're testing your setup

data_path="./certbot"
rsa_key_size=4096

if [ -d "$data_path" ]; then
  read -p "Existing data found. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

mkdir -p "$data_path/conf/live/$domains"
mkdir -p "$data_path/www"

echo "### Creating dummy certificate..."
openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
  -keyout "$data_path/conf/live/$domains/privkey.pem" \
  -out "$data_path/conf/live/$domains/fullchain.pem" \
  -subj "/CN=localhost"

echo "### Starting nginx..."
docker-compose up --force-recreate -d nginx

echo "### Requesting Let's Encrypt certificate..."
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $email \
    ${staging:+--staging} \
    ${domains[@]/#/-d } \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot

echo "### Reloading nginx..."
docker-compose exec nginx nginx -s reload 