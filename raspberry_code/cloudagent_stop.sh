#
# Copyright Bosch.IO GmbH 2020
# All rights reserved, also regarding any disposal, exploitation,
# reproduction, editing, distribution, as well as in the event of
# applications for industrial property rights.
#
# This software is the confidential and proprietary information
# of Bosch.IO GmbH. You shall not disclose
# such Confidential Information and shall use it only in
# accordance with the terms of the license agreement you
# entered into with Bosch.IO GmbH.
#

#!/bin/sh
TIMEOUT=10
cnt=0
pkill -USR1 cloudagent
# while [ -n "`pidof cloudagent`" ]; do # not working well on raspberry
while [ -n "`ps -ef | grep 'cloudagent -' | grep -v grep`" ]; do
  cnt=`expr $cnt + 1`
#   cnt=$(($cnt + 1)) # bash alternative if expr not available
  if [ $cnt -gt $TIMEOUT ]; then
    echo "### TIMEOUT waiting for cloudagent stop ($TIMEOUT s). Killing instance [`pidof cloudagent`]!"
    pkill -9 cloudagent
    exit 1
  fi
  sleep 1
done
if [ $cnt -eq 0 ]; then
  echo "cloudagent is not running."
  exit 0
fi
echo "cloudagent stopped in ($cnt s)."
exit 0
