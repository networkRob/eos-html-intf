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
import SocketServer, json, hashlib, base64

WS_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
HOST = ''
PORT = 50019
all_cons = []

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
        all_cons.append(self.client_address)
        print(all_cons)
        self.data = self.request.recv(1024).strip()
        headers = self.data.split("\r\n")
        # is it a websocket request?
        if "Connection: Upgrade" in self.data and "Upgrade: websocket" in self.data:
            # getting the websocket key out
            for h in headers:
                if "Sec-WebSocket-Key" in h:
                    key = h.split(" ")[1]
            # let's shake hands shall we?
            self.shake_hand(key)
            while True:
                payload = self.decode_frame(bytearray(self.request.recv(1024).strip()))
                decoded_payload = payload.decode('utf-8')
                self.send_frame(payload)
        """
        while True:
            self.data = self.request.recv(2048).strip()
            if not self.data:
                all_cons.pop(all_cons.index(self.client_address))
                break
            print("{0} requested: {1}".format(self.client_address[0], self.data))
            if self.data == 'status':
                self.request.sendall(json.dumps(lo_sw.all_intfs_status))
            elif self.data == 'mode':
                self.request.sendall(json.dumps(lo_sw.all_intfs_mode))
            else:
                self.request.sendall('Try again:')   """
    def shake_hand(self,key):
        # calculating response as per protocol RFC
        key = key + WS_MAGIC_STRING
        resp_key = base64.standard_b64encode(hashlib.sha1(key).digest())
        resp="HTTP/1.1 101 Switching Protocols\r\n" + \
             "Upgrade: websocket\r\n" + \
             "Connection: Upgrade\r\n" + \
             "Sec-WebSocket-Accept: %s\r\n\r\n"%(resp_key)
    def decode_frame(self,frame):
        opcode_and_fin = frame[0]
        # assuming it's masked, hence removing the mask bit(MSB) to get len. also assuming len is <125
        payload_len = frame[1] - 128
        mask = frame [2:6]
        encrypted_payload = frame [6: 6+payload_len]
        payload = bytearray([ encrypted_payload[i] ^ mask[i%4] for i in range(payload_len)])
        return payload
    def send_frame(self, payload):
        # setting fin to 1 and opcpde to 0x1
        frame = [129]
        # adding len. no masking hence not doing +128
        frame += [len(payload)]
        # adding payload
        frame_to_send = bytearray(frame) + payload
        self.request.sendall(frame_to_send)       

lo_sw = lSwitch()
SocketServer.TCPServer.allow_reuse_address = True

server = SocketServer.TCPServer((HOST, PORT), ServerEOS)
server.serve_forever()
