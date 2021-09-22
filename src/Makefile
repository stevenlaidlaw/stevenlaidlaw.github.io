# build:
# npm run build

deploy: # build
	rsync -aivP static/* ../
	echo stevenlaidlaw.com > ../CNAME
	git add ..
	git commit -m "`date`"
	git push
