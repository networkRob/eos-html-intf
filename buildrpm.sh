#!/bin/bash

while getopts v:r:i option
do
case "${option}"
in
v) VERSION=${OPTARG};;
r) RELEASE=${OPTARG};;
i) DIMAGE=${OPTART};;
esac
done
mkdir -p rpmbuild/SOURCES
mkdir -p rpmbuild/RPM
tar -cvf rpmbuild/SOURCES/EosIntfGui-${VERSION}-${RELEASE}.tar source/*

docker run --rm -v $(pwd)/rpmbuild/SPECS/:/home/builder/rpmbuild/SPECS:ro -v $(pwd)/rpmbuild/SOURCES:/home/builder/rpmbuild/SOURCES:ro -v $(pwd)/rpmbuild/RPM:/home/builder/rpmbuild/RPM:rw ${DIMAGE}
