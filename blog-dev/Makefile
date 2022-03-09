dev:
	hugo server -D

build:
	hugo -D && rsync -aivP public/ .. && rm -rf public/ && rsync -aivP non-hugo/ ..

copy-static:
	rsync -aivP non-hugo/ ..

clean:
	cd .. && rm -rf `ls | grep -v '.git' | grep -v 'blog-dev'`