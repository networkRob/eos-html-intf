#!/bin/bash
cp -r usr/lib/python2.7/site-packages/* /usr/lib/python2.7/site-packages/
mkdir /usr/share/nginx/html/apps/EosIntfs
cp -r usr/share/nginx/html/apps/EosIntfs/* /usr/share/nginx/html/apps/EosIntfs/
cp etc/nginx/external_conf/* /etc/nginx/external_conf/

