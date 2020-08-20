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

cd /workspaces/eos-html-intf

rm manifest.txt

echo "format: 1" >> manifest.txt
echo "primaryRPM: EosIntfGui-${VERSION}-${RELEASE}.noarch.rpm" >> manifest.txt
echo -n "EosIntfGui-${VERSION}-${RELEASE}.noarch.rpm: " >> manifest.txt
echo $(sha1sum rpmbuild/RPM/noarch/EosIntfGui-${VERSION}-${RELEASE}.noarch.rpm | awk '{print $1}') >> manifest.txt

scp /workspaces/eos-html-intf/rpmbuild/RPM/noarch/EosIntfGui-${VERSION}-${RELEASE}.noarch.rpm rmartin@192.168.23.5:/mnt/flash/ext-eos/
scp manifest.txt rmartin@192.168.23.5:/mnt/flash/ext-eos/

