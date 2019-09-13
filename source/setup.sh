#!/bin/bash
cp -r /mnt/flash/EosIntfs/usr/lib/python2.7/site-packages/* /usr/lib/python2.7/site-packages/
mkdir /usr/share/nginx/html/apps/EosIntfs
cp -r /mnt/flash/EosIntfs/usr/share/nginx/html/apps/EosIntfs/* /usr/share/nginx/html/apps/EosIntfs/
cp /mnt/flash/EosIntfs/etc/nginx/external_conf/* /etc/nginx/external_conf/