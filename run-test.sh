#!/bin/sh

basedir="$(
	cd $(dirname $0)
	pwd
)"
. $basedir/env.sh

export SCREENSHOT_TARGET="${basedir}/build/test/screenshot"
npm run test
npm run reg-suit
