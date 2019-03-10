#!/usr/bin/env bash

# After npm run build
rsync -aivP public/ ../stevenlaidlaw/

git add .
git commit -m "`date`"
git push

