#!/usr/bin/env bash

npm run build
rsync -aivP public/ ../stevenlaidlaw/

git add .
git commit -m "`date`"
git push

