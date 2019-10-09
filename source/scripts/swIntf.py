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
__version__ = 0.10

from jsonrpclib import Server
import json, socket, time
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import syslog
from time import sleep
from datetime import timedelta, datetime
import json

DEBUG = True
HOST = ''
PORT = 50019
all_cons = []
tdelay = 5

SWFORMATTING = {
    'dcs-7280se-68': {
        'top': '25px',
        'left': '17px',
        'width': '35px',
        'height': '23px',
        'margin': '0 0 16 0',
        'sfpbreakWidth': '7px',
        'intfbreakWidth': '19px',
        'drow': range(1,48),
        'qsfp': [49, 50],
        'intfBreaks': [],
        'sfpBreaks': [17,18,33,34,49]
    },
    'ccs-720xp-48zc2': {
        'top': '29px',
        'left': '29px',
        'width': '30px',
        'height': '20px',
        'margin': '0 4 12 0',
        'sfpbreakWidth': '14px',
        'intfbreakWidth': '19px',
        'drow': range(1,54),
        'qsfp': [53,54],
        'intfBreaks': [17,18,25,26,41,42],
        'sfpBreaks': [49,50,53,54]
    }
}
class lSwitch:
    def __init__(self):
        self.swInfo = {}
        self.l_sw = Server("unix:/var/run/command-api.sock")
        self.getData()
        

    def getData(self):
        self.swData = self.runC(
            "show interfaces status",
            "show hostname",
            "show version",
            "show interfaces",
            "show extensions",
            "show vlan",
            "show interfaces trunk"
        )

        self.swInfo['system'] = self.evalSystem()
        self.swInfo['interfaces'] = self.evalIntfs()
        self.swInfo['interfaceData'] = self._intfListToDict()
        self.swInfo['vlans'] = self.evalVlans()
        self.swInfo['vlansData'] = self._vlanListToDict()
        self.swInfo['layout'] = SWFORMATTING[self.swInfo['system']['swImg']]
    
    def evalSystem(self):
        tmpSw = {
            'hostname': self.swData[1]['fqdn'],
            'model': self.swData[2]['modelName'],
            'serialNumber': self.swData[2]['serialNumber'],
            'systemMac': self.swData[2]['systemMacAddress'],
            'eosVersion': self.swData[2]['version'],
            'hwRev': self.swData[2]['hardwareRevision'],
            'swImg': self.getSwImg(self.swData[2]['modelName']),
            'extensions': self.parseExtensions(self.swData[4]['extensions']),
            'poe': 'yes' if 'CCS' in self.swData[2]['modelName'] and 'XP' in self.swData[2]['modelName'] else ''
        }
        return(tmpSw)
    
    def evalVlans(self):
        vlanData = []
        tmpVlan = map(str,self._sortTmpVlans())
        for vlan in tmpVlan:
            vlanData.append({'id':vlan,'name':self.swData[5]['vlans'][vlan]['name']})
        return(vlanData)

    def evalIntfs(self):
        intfData = []
        tmpEthIntf = []
        tmpPcIntf = []
        tmpMaIntf = []
        # Check if switch is PoE capable
        if self.swInfo['system']['poe']:
            poeIntfs = self.runC("show poe")[0]['poePorts']
        else:
            poeIntfs = ''
        for intf in self.swData[0]['interfaceStatuses']:
            if 'Ethernet' in intf:
                if '/' not in intf:
                    tmpEthIntf.append(int(intf.replace('Ethernet','')))
                else:
                    tmpEthIntf.append(intf.replace('Ethernet',''))
            elif 'Port-Channel' in intf:
                tmpPcIntf.append(intf.replace('Port-Channel',''))
            elif 'Management' in intf:
                tmpMaIntf.append(intf.replace('Management',''))
        tmpEthIntf.sort()
        tmpPcIntf.sort()
        tmpMaIntf.sort()
        intfOrder = map(lambda x: 'Ethernet' + str(x), tmpEthIntf) + map(lambda x: 'Port-Channel' + str(x), tmpPcIntf) + map(lambda x: 'Management' + str(x), tmpMaIntf)
        for intf in intfOrder:
            tmp_intf_status = self.swData[0]['interfaceStatuses'][intf]
            tmp_intf_data = self.swData[3]['interfaces'][intf]
            tmpDict = {
                'intf': intf,
                'status': tmp_intf_status['linkStatus'],
                'rBit': tmp_intf_data['interfaceStatistics']['inBitsRate'],
                'xBit': tmp_intf_data['interfaceStatistics']['outBitsRate'],
                'physicalAddress': tmp_intf_data['physicalAddress'],
                'mtu': tmp_intf_data['mtu'],
                'description': tmp_intf_data['description'],
                'xcvrType': tmp_intf_status['interfaceType'],
                'ipAddress': '',
                'nativeVlan': '',
                'vlanId': '',
                'allowedVlans': '',
                'activeVlans': '',
                'channelGroup': '',
                'poeState': '',
                'poePower': '',
                'poeClass': '',
                'poePriority': '',
            }
            # Assign some PoE stats for interfaces
            if poeIntfs:
                if intf in poeIntfs:
                    tmpDict['poeState'] = poeIntfs[intf]['portState']
                    tmpDict['poePower'] = round(poeIntfs[intf]['power'], 2)
                    tmpDict['poeClass'] = poeIntfs[intf]['pdClass']
                    tmpDict['poePriority'] = poeIntfs[intf]['portPriority']
            # Set the interface mode
            if 'interfaceMode' in tmp_intf_status['vlanInformation']:
                tmpDict['mode'] = tmp_intf_status['vlanInformation']['interfaceMode']
            else:
                tmpDict['mode'] = tmp_intf_status['vlanInformation']['interfaceForwardingModel']
            # Check if routed, get IP address
            if tmpDict['mode'] == 'routed':
                tmpDict['ipAddress'] = tmp_intf_data['interfaceAddress'][0]['primaryIp']['address'] + '/' + str(tmp_intf_data['interfaceAddress'][0]['primaryIp']['maskLen'])
            elif tmpDict['mode'] == 'bridged':
                tmpDict['vlanId'] = tmp_intf_status['vlanInformation']['vlanId']
            elif tmpDict['mode'] == 'trunk':
                tmp_trunk_vlan = self.runC("show interfaces {} trunk".format(intf))[0]
                tmpDict['nativeVlan'] = tmp_trunk_vlan['trunks'][intf]['nativeVlan']
                if tmp_trunk_vlan['trunks'][intf]['allowedVlans']['vlanIds']:
                    tmp_vlans = tmp_trunk_vlan['trunks'][intf]['allowedVlans']['vlanIds']
                    tmp_vlans.sort()
                    tmpDict['allowedVlans'] = tmp_vlans
                    tmpDict['activeVlans'] = tmp_trunk_vlan['trunks'][intf]['allowedVlans']['vlanIds']
                elif 'activeVlans' in tmp_trunk_vlan['trunks'][intf]:
                    tmpDict['allowedVlans'] = "all"
                    tmpDict['activeVlans'] = tmp_trunk_vlan['trunks'][intf]['activeVlans']
                else:
                    tmpDict['allowedVlans'] = "all"
                    tmpDict['activeVlans'] = self._sortTmpVlans()
            elif tmpDict['mode'] == 'dataLink':
                tmpDict['channelGroup'] = tmp_intf_status['vlanInformation']['vlanExplanation']
            intfData.append(tmpDict)
        return(intfData)
    
    def _sortTmpVlans(self):
        tmpVlan = self.swData[5]['vlans'].keys()
        tmpVlan = map(int, tmpVlan)
        tmpVlan.sort()
        return(tmpVlan)
    
    def _vlanListToDict(self):
        tmpVlan = {}
        for vlan in self.swInfo['vlans']:
            tmpVlan[vlan['id']] = vlan
        return(tmpVlan)

    def _intfListToDict(self):
        tmpIntf = {}
        for intf in self.swInfo['interfaces']:
            tmpIntf[intf['intf']] = intf
        return(tmpIntf)
        
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
        elif eData['ipaddress']:
            cmds.append("ip address {}".format(eData['ipaddress']))
        elif eData['nativevlan']:
            cmds.append("switchport trunk native vlan {}".format(eData['nativevlan']))
            if eData['allowvlan'] == 'all':
                cmds.append("no switchport trunk allowed vlan")
            else:
                cmds.append("switchport trunk allowed vlan {}".format(eData['allowvlan']))
        cmds.append('end')
        res = self.runC(*cmds)
        return(res)

    def parseExtensions(self,eExt):
        eout = []
        for ext in eExt:
            eout.append({'name':ext,'version':eExt[ext]['version'] + "/" + eExt[ext]['release'],'status':eExt[ext]['status']})
        return(eout)

    def runC(self,*cmds):
        res = self.l_sw.runCmds(1,cmds)
        return(res)

    def getSwImg(self,mName):
        mn = mName.lower().split('-')
        swName = mn[:len(mn)-1]
        return("-".join(swName))

class WSHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        xRemoteIp = self.request.headers['X-Forwarded-For'].split(':')
        _to_syslog("New connection from: {}".format(xRemoteIp[len(xRemoteIp)-1]))
        lo_sw.getData()
        self.write_message(json.dumps({
            'type': "hello",
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'data': lo_sw.swInfo
        }))
        self.schedule_update()
    
    def on_message(self,message):
        xRemoteIp = self.request.headers['X-Forwarded-For'].split(':')
        cdata = ""
        try:
            recv = json.loads(message)
            if recv['type'] == 'Hello':
                cdata = recv['data']
            elif recv['type'] == 'IntfUpdate':
                cdata = recv['data']
                conf_response = lo_sw.intfConfigure(recv['data'])
                tmp_msg = "[{}] Executed Config change: {}".format(xRemoteIp[len(xRemoteIp)-1],cdata)
                _to_syslog(tmp_msg)
        except:
            _to_syslog("Wrong message format sent.")
        

    def schedule_update(self):
        self.timeout = tornado.ioloop.IOLoop.instance().add_timeout(timedelta(seconds=1),self.update_client)
    
    def update_client(self):
        try:
            lo_sw.getData()
            self.write_message(json.dumps({
                'type': 'update',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'data': lo_sw.swInfo
            }))
            # self.write_message(json.dumps([1,datetime.now().strftime("%Y-%m-%d %H:%M:%S"),lo_sw.swInfo]))
            # sleep(30)
        # except:
        #     print("Connection closed:")
        finally:
            self.schedule_update()
 
    def on_close(self):
        _to_syslog('connection closed')
        tornado.ioloop.IOLoop.instance().remove_timeout(self.timeout)
 
    def check_origin(self, origin):
        return(True)
    
def _to_syslog(sys_msg):
        syslog.syslog("%%GUI-6-LOG: {}".format(sys_msg))
        if DEBUG:
            print(sys_msg)

application = tornado.web.Application([(r'/eos', WSHandler),])

if __name__ == "__main__":
    syslog.openlog('EOS-INTF-GUI',0,syslog.LOG_LOCAL4)
    lo_sw = lSwitch()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(50019)
    #myIP = socket.gethostbyname(socket.gethostname())
    #print '*** Websocket Server Started at %s***' % myIP
    _to_syslog('*** Websocket Server Started ***')
    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.instance().stop()
        _to_syslog("*** Websocked Server Stopped ***")