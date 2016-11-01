include n.Makefile

TEST_APP := "ft-next-mcontrol-branch-${CIRCLE_BUILD_NUM}"

test: verify

build:
	mkdir -p public
	node-sass client/main.scss public/styles.css  --source-map-embed
	webpack

build-production:
	mkdir -p public
	node-sass client/main.scss public/styles.css  --output-style compressed
	webpack
	haikro build

provision:
	nht float --testapp ${TEST_APP}

tidy:
	# Not required

deploy:
	nht ship ft-next-m-control

run:
	nht run --local