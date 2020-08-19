#!/bin/bash

while getopts v:r: option
do
case "${option}"
in
v) VERSION=${OPTARG};;
r) RELEASE=${OPTARG};;
esac
done
mkdir -p rpmbuild/SOURCES
mkdir -p rpmbuild/RPM
tar -cvf rpmbuild/SOURCES/EosIntfGui-${VERSION}-${RELEASE}.tar source/*

cd /workspaces/eos-html-intf/rpmbuild/SPECS

rpmbuild -ba ${name}.spec

scp /workspaces/eos-html-intf/rpmbuild/RPM/noarch/EosIntfGui-${VERSION}-${RELEASE}.noarch.rpm rmartin@192.168.23.5:/mnt/flash/
