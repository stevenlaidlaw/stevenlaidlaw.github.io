# build:
# 	mkdir -p pages
# 	for file in articles/*; do markdown $file > pages/${file##*.}.md; done

deploy: # build
	rsync -aivP static/* ../
	echo stevenlaidlaw.com > ../CNAME
	git add ..
	git commit -m "`date`"
	git push
