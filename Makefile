build:
	rm -rf blog && cd blog-dev && hugo -D && mv public/ ../blog

dev:
	cd blog-dev && hugo server -D