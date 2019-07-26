#!/bin/bash

exec 3<> /dev/null
function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}
set -e
set -x

if [ "$(/bin/bash torun.sh)" = "0" ]; then

    { green "\n\nreverting:\n\n"; } 2>&3
    # make mrevert
    (cd .. && node node_modules/.bin/ts-node node_modules/.bin/typeorm migration:revert)
fi


{ green "\n\nexecuting last migration:\n\n"; } 2>&3

/bin/bash mrun.sh