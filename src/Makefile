# build:
# npm run build

deploy: # build
	rsync -aivP static/* ../
	echo stevenlaidlaw.com > ../CNAME
	pushall
# cd ../ && find . -not -path '*/src*' -not -path '*/.git*' -not -path '.' -exec rm -rf {} +
# rsync -aivP public/. .. && echo stevenlaidlaw.com > ../CNAME && git add .. && git commit -m "`date`" && git push
