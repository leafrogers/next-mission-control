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
	nht float -ds --testapp ${TEST_APP}

tidy:
	nht destroy ${TEST_APP}

deploy:
	nht ship

run:
	nht run --local