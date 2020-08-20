# EOS HTML Interface Viewer

This project creates a web UI for EOS based switches that provides interface and system level information and statisitics.  It also provides the capability to modifiy certain parts of the interface configuration.

This repo contains base files to be able to create a container that will be used to create the `.rpm` file for packaging up the source code, which can then be used to create a `.swix` file.

## Requirements

At the moment this extension will work for DCS-7280SE-68 and CCS-720XP-48ZC2 switches as well as vEOS-lab and cEOS-lab.  All other dependencies are packeged in a .swix file.

## Setup

1. Install the latest version of the extension on the switch.
2. If the management IP address is running within a VRF, restart the management api-http.
3. Enable eAPI connections over the local unix socket.
4. For testing go into `bash` and start the script manually.
5. To make the script persistent on reloads, create an `event-handler`

#### Example (Non-Default MGMT VRF)

```
7280-rtr-01#sh extensions
Name                        Version/Release      Status      Extension
--------------------------- -------------------- ----------- ---------
EosIntfGui-0.11-1.swix      0.11/1               A, NI       1
rPodman-0.9.2-5.swix        0.9.2/5.git37a\      A, I        21
                            2afe.el7_5


A: available | NA: not available | I: installed | NI: not installed | F: forced
7280-rtr-01#extension EosIntfGui-0.11-1.swix
7280-rtr-01#config
7280-rtr-01(config)#management api http-commands
7280-rtr-01(config-mgmt-api-http-cmds)#protocol unix-socket
7280-rtr-01(config-mgmt-api-http-cmds)#shut
7280-rtr-01(config-mgmt-api-http-cmds)#no shut
7280-rtr-01(config-mgmt-api-http-cmds)#end
7280-rtr-01#bash

Arista Networks EOS shell

[rmartin@7280-rtr-01 ~]$ sudo ip netns exec ns-MGMT swIntf
*** Websocket Server Started ***
^C*** Websocked Server Stopped ***

[rmartin@7280-rtr-01 ~]$ exit
logout
7280-rtr-01#config
7280-rtr-01(config)#event-handler eos-intf
7280-rtr-01(config-handler-eos-intf)#trigger on-boot
7280-rtr-01(config-handler-eos-intf)#action bash ip netns exec ns-MGMT swIntf
7280-rtr-01(config-handler-eos-intf)#end
```

#### Example (Default MGMT VRF)

```
7280-rtr-01#sh extensions
Name                        Version/Release      Status      Extension
--------------------------- -------------------- ----------- ---------
EosIntfGui-0.11-1.swix      0.11/1               A, NI       1
rPodman-0.9.2-5.swix        0.9.2/5.git37a\      A, I        21
                            2afe.el7_5


A: available | NA: not available | I: installed | NI: not installed | F: forced
7280-rtr-01#extension EosIntfGui-0.11-1.swix
7280-rtr-01#config
7280-rtr-01(config)#management api http-commands
7280-rtr-01(config-mgmt-api-http-cmds)#protocol unix-socket
7280-rtr-01(config-mgmt-api-http-cmds)#shut
7280-rtr-01(config-mgmt-api-http-cmds)#no shut
7280-rtr-01(config-mgmt-api-http-cmds)#end
7280-rtr-01#bash

Arista Networks EOS shell

[rmartin@7280-rtr-01 ~]$ swIntf
*** Websocket Server Started ***
^C*** Websocked Server Stopped ***

[rmartin@7280-rtr-01 ~]$ exit
logout
7280-rtr-01#config
7280-rtr-01(config)#event-handler eos-intf
7280-rtr-01(config-handler-eos-intf)#trigger on-boot
7280-rtr-01(config-handler-eos-intf)#action bash swIntf
7280-rtr-01(config-handler-eos-intf)#end
```
