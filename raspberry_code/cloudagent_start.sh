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

# Check if cloudagent is already started
[ -n "`pidof cloudagent`" ] && { echo "cloudagent already started, exiting!"; exit 1; }

WORKDIR=$(dirname $(readlink -f $0))

export LD_LIBRARY_PATH="$WORKDIR:$LD_LIBRARY_PATH"
echo $LD_LIBRARY_PATH

# Activate debugging on Paho client, it logs in system out
#export MQTT_C_CLIENT_TRACE=ON
# Possible values: ERROR, PROTOCOL, MINIMUM, MEDIUM and MAXIMUM
#export MQTT_C_CLIENT_TRACE_LEVEL=PROTOCOL

# Suite device id, configure with parameter -deviceId.
DEVICE_ID="${DEVICE_ID:-}"

# Hub device auth id, configure with parameter -authId.
AUTH_ID="${AUTH_ID:-}"

# Hub device tenant id, configure with parameter -tenantId.
TENANT_ID="${TENANT_ID:-}"

# Hub device password, configure with parameter -password.
PASSWORD="${PASSWORD:-}"

# Things device policy id, configure with parameter -policyId.
POLICY_ID="${POLICY_ID:-}"

# Path to Hub certificate, configure with parameter -certPath.
# If the certificate is missing in the system, it can be downloaded from  https://docs.bosch-iot-suite.com/hub/cert/iothub.crt
CERT_PATH="${CERT_PATH:-$WORKDIR/iothub.crt}"

# MQTT client id suffix, configure with parameter -clientId.
CLIENT_ID=$(cat /sys/class/net/*/address | grep . | tr -d : | grep -v "000000000000" | head -n 1 | xargs)

# Address of the local MQTT broker, configure with parameter -localAddress.
LOCAL_ADDRESS="${LOCAL_ADDRESS:-tcp://localhost:1883}"

# Log level, configure with parameter -logLevel.
# Possible values: 0 - TRACE; 1 - DEBUG; 2 - INFO; 3 - WARN; 4 - ERROR; 5 - FATAL;
LOG_LEVEL="${LOG_LEVEL:-2}"

# Log file location, configure with parameter -logFile. The folder has to be initially created
LOG_DIR=$WORKDIR/logs
mkdir -p $LOG_DIR
LOG_FILE=$LOG_DIR/log.txt

# Log file size in byte, configure with parameter -logFileSize.
#LOG_FILE_SIZE=1048576

# Log backup files count, configure with parameter -logFileCount.
#LOG_FILE_COUNT=5

# Provisioning file in json format, configure with parameter -provisioningFile.
PROVISIONING_FILE="${PROVISIONING_FILE:-provisioning.json}"

[ -n "$DEVICE_ID" ] && ARGUMENTS="$ARGUMENTS -deviceId $DEVICE_ID"
[ -n "$AUTH_ID" ] && ARGUMENTS="$ARGUMENTS -authId $AUTH_ID"
[ -n "$TENANT_ID" ] && ARGUMENTS="$ARGUMENTS -tenantId $TENANT_ID"
[ -n "$PASSWORD" ] && ARGUMENTS="$ARGUMENTS -password $PASSWORD"
[ -n "$POLICY_ID" ] && ARGUMENTS="$ARGUMENTS -policyId $POLICY_ID"
[ -n "$CERT_PATH" ] && ARGUMENTS="$ARGUMENTS -certPath $CERT_PATH"
[ -n "$CLIENT_ID" ] && ARGUMENTS="$ARGUMENTS -clientId $CLIENT_ID"
[ -n "$LOCAL_ADDRESS" ] && ARGUMENTS="$ARGUMENTS -localAddress $LOCAL_ADDRESS"
[ -n "$LOG_LEVEL" ] && ARGUMENTS="$ARGUMENTS -logLevel $LOG_LEVEL"
[ -n "$LOG_FILE" ] && ARGUMENTS="$ARGUMENTS -logFile $LOG_FILE"
[ -n "$PROVISIONING_FILE" ] && ARGUMENTS="$ARGUMENTS -provisioningFile $PROVISIONING_FILE"

echo nohup $WORKDIR/cloudagent $ARGUMENTS
nohup $WORKDIR/cloudagent $ARGUMENTS >/dev/null 2>&1 &
