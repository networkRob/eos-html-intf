#!/bin/bash

while getopts v:r: option
do
case "${option}"
in
v) VERSION=${OPTARG};;
r) RELEASE=${OPTARG};;
esac
done

DUT='192.168.23.5'
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

scp -i ~/.ssh/builder /workspaces/eos-html-intf/rpmbuild/RPM/noarch/EosIntfGui-${VERSION}-${RELEASE}.noarch.rpm builder@${DUT}:/mnt/flash/ext-eos/
scp -i ~/.ssh/builder manifest.txt builder@${DUT}:/mnt/flash/ext-eos/

ssh -i ~/.ssh/builder builder@${DUT} bash swix create /mnt/flash/ext-eos/swix/EosIntfGui-${VERSION}-${RELEASE}.swix /mnt/flash/ext-eos/EosIntfGui-${VERSION}-${RELEASE}.noarch.rpm

scp -i ~/.ssh/builder builder@${DUT}:/mnt/flash/ext-eos/swix/EosIntfGui-${VERSION}-${RELEASE}.swix /workspaces/eos-html-intf/extension/
