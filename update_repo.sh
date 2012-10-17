#!/bin/sh
set -x
git pull && 
git submodule update --init --quiet && 
git submodule foreach git pull origin master
set +x
