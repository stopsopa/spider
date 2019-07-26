COMPOSE_PROJECT_NAME:="$(shell cat docker/name.conf)"

export COMPOSE_PROJECT_NAME
# master


fixtures:
	(cd migrations && node recreate-db.js safe)
	(cd migrations && make mrun)

diff:
	(cd migrations && make diff)

mrun:
	(cd migrations && make mrun)

torun:
	(cd migrations && make torun)

mrevert:
	(cd migrations && make mrevert)

mtest:
	(cd migrations && make mtest)


start:
	nodemon -e js,html server.js

doc: docs
	(cd docker && docker-compose build)
	(cd docker && docker-compose up -d --build)

docs:
	cd docker && docker-compose stop

linknpm:
	(cd migrations && make linknpm)


clear:
	/bin/bash clear.sh