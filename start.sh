#!/bin/bash

time=`date -Iseconds`
echo $time
/sbin/start-stop-daemon --start --verbose --chdir $PWD --make-pidfile --pidfile $PWD/.pid --background --startas /bin/bash -- -c "exec node --use-openssl-ca src/veda-1c.js >> $PWD/${PWD##*/}-$time.log 2>&1"