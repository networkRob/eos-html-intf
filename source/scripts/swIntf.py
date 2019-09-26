#!/usr/bin/env python
#
# Copyright (c) 2018, Arista Networks, Inc.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#  - Redistributions of source code must retain the above copyright notice,
# this list of conditions and the following disclaimer.
#  - Redistributions in binary form must reproduce the above copyright
# notice, this list of conditions and the following disclaimer in the
# documentation and/or other materials provided with the distribution.
#  - Neither the name of Arista Networks nor the names of its
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL ARISTA NETWORKS
# BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
# BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
# WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
# OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN
# IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# locateIP
#
#    Written by:
#       Rob Martin, Arista Networks
#
"""
DESCRIPTION
A Python socket server to act as a backend service for switch information.

"""
__author__ = 'rmartin'
__version__ = 0.2

from jsonrpclib import Server
import json, socket, time
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
from time import sleep
from datetime import timedelta, datetime
import json

HOST = ''
PORT = 50019
all_cons = []
tdelay = 5
class lSwitch:
    def __init__(self):
        self.l_sw = Server("unix:/var/run/command-api.sock")
        self.getData()
    def getData(self):
        self.swData = self.runC(
            "show interfaces status",
            "show hostname",
            "show version",
            "show interfaces",
            "show extensions",
            "show vlan"
        )
        self.data = {
            'intfStatus': self.swData[0]['interfaceStatuses'],
            'hostname': self.swData[1]['fqdn'],
            'system': self.swData[2],
            'intfData': self.swData[3],
            'extensions': self.parseExtensions(self.swData[4]['extensions']),
            'swImage': self.getSwImg(),
            'vlans': self.swData[5]['vlans']
        }
    def intfConfigure(self,eData):
        """
        Sends the eAPI commands to the switch for interface configuration.
        """
        cmds = ["enable","configure",'interface {}'.format(eData['intf']),eData['status']]
        if eData['description']:
            cmds.append("description {}".format(eData['description']))
        else:
            cmds.append("no description")
        if eData['accessvlan']:
            cmds.append("switchport access vlan {}".format(eData['accessvlan']))
        if eData['ipaddress']:
            cmds.append("ip address {}".format(eData['ipaddress']))
        cmds.append('end')
        res = self.runC(*cmds)
        print(res)

    def parseExtensions(self,eExt):
        eout = []
        for ext in eExt:
            eout.append({'name':ext,'version':eExt[ext]['version'] + "/" + eExt[ext]['release'],'status':eExt[ext]['status']})
        return(eout)

    def runC(self,*cmds):
        res = self.l_sw.runCmds(1,cmds)
        return(res)

    def getSwImg(self):
        mn = self.swData[2]['modelName'].lower().split('-')
        swName = mn[:len(mn)-1]
        return("-".join(swName)+".png")

class WSHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        print("New connection from: {}".format(self.request.remote_ip))
        print(self.request.headers)
        lo_sw.getData()
        #self.write_message(json.dumps([lo_sw.data,lo_sw.all_intfs,datetime.now().strftime("%Y-%m-%d %H:%M:%S")]))
        self.write_message(json.dumps([0,datetime.now().strftime("%Y-%m-%d %H:%M:%S"),lo_sw.data]))
        self.schedule_update()
    
    def on_message(self,message):
        cdata = ""
        try:
            recv = json.loads(message)
            if recv['type'] == 'Hello':
                cdata = recv['data']
            elif recv['type'] == 'IntfUpdate':
                cdata = recv['data']
                lo_sw.intfConfigure(recv['data'])
                print(cdata)
        except:
            print("Wrong message format sent.")
        

    def schedule_update(self):
        self.timeout = tornado.ioloop.IOLoop.instance().add_timeout(timedelta(seconds=1),self.update_client)
    
    def update_client(self):
        try:
            lo_sw.getData()
            #self.write_message(json.dumps([lo_sw.data,lo_sw.all_intfs,datetime.now().strftime("%Y-%m-%d %H:%M:%S")]))
            self.write_message(json.dumps([1,datetime.now().strftime("%Y-%m-%d %H:%M:%S"),lo_sw.data]))
            # sleep(30)
        # except:
        #     print("Connection closed:")
        finally:
            self.schedule_update()
 
    def on_close(self):
        print 'connection closed'
        tornado.ioloop.IOLoop.instance().remove_timeout(self.timeout)
 
    def check_origin(self, origin):
        return True
    
application = tornado.web.Application([(r'/eos', WSHandler),])

if __name__ == "__main__":
    lo_sw = lSwitch()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(50019)
    #myIP = socket.gethostbyname(socket.gethostname())
    #print '*** Websocket Server Started at %s***' % myIP
    print('*** Websocket Server Started ***')
    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.instance().stop()
        print("*** Websocked Server Stopped ***")