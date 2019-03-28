#!/bin/bash
ip netns exec ns-MGMT pip install tornado
mkdir /usr/share/nginx/html/apps/EosIntfs
cp -r usr/share/nginx/apps/EosIntfs/* /usr/share/nginx/html/apps/EosIntfs/
cp etc/nginx/external_conf/* /etc/nginx/external_conf/
