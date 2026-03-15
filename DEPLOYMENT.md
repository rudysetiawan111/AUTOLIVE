# Deployment Guide

Server yang direkomendasikan:

Ubuntu 22.04

Install Node.js:

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

Install PM2:

npm install -g pm2

Clone project:

git clone https://github.com/yourusername/autolive.git

Install dependency:

npm install --production

Run application:

pm2 start backend/server.js --name autolive

Setup Nginx sebagai reverse proxy.
