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
__version__ = 0.1

from jsonrpclib import Server
import json, socket
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web

HOST = ''
PORT = 50019
all_cons = []

class lSwitch:
    def __init__(self):
        self.l_sw = Server("unix:/var/run/command-api.sock")
        self.version = self.runC("show version")
        self.extensions = self.runC("show extensions")
        #self.getData()
    def getData(self):
        self.all_intfs = self.runC('show interfaces status')[0]['interfaceStatuses']
        self.all_intfs_status = self.intf_status()
        self.all_intfs_mode = self.intf_mode()
    def runC(self,*cmds):
        res = self.l_sw.runCmds(1,cmds)
        return(res)
    def intf_status(self):
        list_intfs = []
        for intf in self.all_intfs:
            list_intfs.append({intf:self.all_intfs[intf]['linkStatus']})
        return(list_intfs)
    def intf_mode(self):
        list_intfs = []
        for intf in self.all_intfs:
            list_intfs.append({intf:self.all_intfs[intf]['vlanInformation']['interfaceMode']})
        return(list_intfs)

class WSHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        print 'new connection'
      
    def on_message(self, message):
        print 'message received:  %s' % message
        if message == 'status':
            tmp_mes = json.dumps(lo_sw.all_intfs_status)
        elif message == 'mode':
            tmp_mes = json.dumps(lo_sw.all_intfs_mode)
        elif message == 'extensions':
            tmp_mes = json.dumps(lo_sw.extensions)
        else:
            tmp_mes = json.dumps(lo_sw.version)
        self.write_message(tmp_mes)
 
    def on_close(self):
        print 'connection closed'
 
    def check_origin(self, origin):
        return True
 
application = tornado.web.Application([(r'/eos', WSHandler),])

if __name__ == "__main__":
    lo_sw = lSwitch()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(50019)
    #myIP = socket.gethostbyname(socket.gethostname())
    #print '*** Websocket Server Started at %s***' % myIP
    print '*** Websocket Server Started ***'
    tornado.ioloop.IOLoop.instance().start()