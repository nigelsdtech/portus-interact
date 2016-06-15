#!/bin/sh

. ~/bin/setup_node_env.sh

export NODE_APP_INSTANCE="portus-interact-test"

mocha test
