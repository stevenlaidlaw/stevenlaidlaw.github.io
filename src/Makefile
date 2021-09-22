build:
	npm run build

deploy: build 
	cd ../ && find . -not -path '*/src*' -not -path '*/.git*' -not -path '.' -exec rm -rf {} + && rsync -aivP src/public/. . && echo stevenlaidlaw.com > CNAME && git add . && git commit -m "`date`" && git push
