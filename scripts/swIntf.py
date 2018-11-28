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
import SocketServer, json

HOST = 'localhost'
PORT = 50019

class lSwitch:
    def __init__(self):
        self.l_sw = Server("unix:/var/run/command-api.sock")
        self.getData()
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

class ServerEOS(SocketServer.BaseRequestHandler):
    def handle(self):
        while True:
            self.data = self.request.recv(1024).strip()
            if not self.data:
                break
            print("{0} requested: {1}".format(self.client_address[0], self.data))
            if self.data == 'status':
                self.request.sendall(json.dumps(lo_sw.all_intfs_status))
            elif self.data == 'mode':
                self.request.sendall(json.dumps(lo_sw.all_intfs_mode))
            else:
                self.request.sendall('Try again:')            

lo_sw = lSwitch()

server = SocketServer.TCPServer((HOST, PORT), ServerEOS)
server.serve_forever()
