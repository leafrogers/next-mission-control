include n.Makefile

test: verify

build:
	mkdir -p public
	node-sass client/main.scss public/styles.css  --source-map-embed
	webpack

run:
	nht run --local