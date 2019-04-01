#!/bin/bash
ip netns exec ns-MGMT pip install tornado
mkdir /usr/share/nginx/html/apps/
lIP=$(ip netns exec ns-MGMT hostname -I)
lIP=${lIP%?}
sed -i "s/{IP}/$lIP/g" usr/share/nginx/html/apps/EosIntfs/js/js.js
cp -r usr/share/nginx/html/apps/EosIntfs/* /usr/share/nginx/html/apps/EosIntfs/
cp etc/nginx/external_conf/* /etc/nginx/external_conf/
