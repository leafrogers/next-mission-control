include n.Makefile

TEST_APP := "ft-next-front-page-branch-${CIRCLE_BUILD_NUM}"

test: verify

build:
	mkdir -p public
	node-sass client/main.scss public/styles.css  --source-map-embed
	webpack

provision:
	nht float -ds --testapp ${TEST_APP}

tidy:
	nht destroy ${TEST_APP}

deploy:
	nht ship

run:
	nht run --local