build:
	hugo -D && rsync -aivP public/ .. && rm -rf public/ && rsync -aivP non-hugo/ ..

copy-static:
	rsync -aivP non-hugo/ ..

clean:
	do