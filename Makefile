build:
	cd blog-dev && hugo -D && rsync -aivP public/ ../

dev:
	cd blog-dev && hugo server -D