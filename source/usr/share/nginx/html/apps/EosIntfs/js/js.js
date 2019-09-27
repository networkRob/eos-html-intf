var eosURL = window.location.href;
eosURL = eosURL.replace("https:","wss:")
eosURL = eosURL.replace("apps/EosIntfs/","eos")

var ws = new WebSocket(eosURL);
ws.onopen = function()
{
    // Web Socket is connected, send data using send()
    ws.send(JSON.stringify({type:"Hello",data:"Hello Test"}));
    // alert("Message is sent...");
};
ws.onmessage = function (evt) 
{ 
    var output = "";
    var re_data = evt.data;
    var received_msg = JSON.parse(re_data);
    systemData = received_msg['data']['system'];
    intfs = received_msg['data']['interfaces'];
    intfData = received_msg['data']['interfaceData'];
    vlns = received_msg['data']['vlans'];
    vlnsData = received_msg['data']['vlansData'];
    
    // Check to see if this is the initial data dump
    if (received_msg['type'] == "hello") {
        document.getElementById('swHostname').innerHTML = systemData['hostname'];
        document.getElementById('eosModel').innerHTML = systemData['model'];
        document.getElementById('serialNumber').innerHTML = systemData['serialNumber'];
        document.getElementById('eosVersion').innerHTML = systemData['eosVersion'];
        document.getElementById('lastUpdate').innerHTML = received_msg['timestamp'];
        document.getElementById('eosExtensions').innerHTML = disExt(systemData['extensions']);
        document.getElementById('eosImage').innerHTML = "<img src='imgs/" + systemData['swImg'] + "'>";
        output += disIntfs(intfs);
        document.getElementById('EosOutput').innerHTML = output;
        disIntfDetail('Ethernet1');
    }
    else {
        document.getElementById('lastUpdate').innerHTML = received_msg['timestamp'];
        document.getElementById('eosExtensions').innerHTML = disExt(systemData['extensions']);
        output += disIntfs(intfs);
        document.getElementById('EosOutput').innerHTML = output;
    } 
};

function checkId(form_id) {
    tmp = document.getElementById(form_id);
    if (tmp) {
        return tmp.value;
    }
    else {
        return "";
    }
}

function formUpdate(eName) {
    var aVLAN = checkId('accessVlan');
    var newIP = checkId('ipAddress');
    var nativeVLAN = checkId('nativeVlan');
    var allowVLAN = checkId('allowVlan');
    var upData = {
        intf: eName, 
        status: document.getElementById("adminStatus").value,
        description: document.getElementById("iDesc").value,
        accessvlan: aVLAN,
        ipaddress: newIP,
        nativevlan: nativeVLAN,
        allowvlan: allowVLAN,
    };
    ws.send(JSON.stringify({type: "IntfUpdate", data: upData}));
}
function disExt(eExt) {
    var e_output = "<table><tr><th>Extension</th><th>Version</th><th>Status</th></tr>";
    for (i = 0; i < eExt.length; i++) {
        e_output += "<tr><td>" + eExt[i]['name'] + "</td><td>" + eExt[i]['version'] + "</td><td>" + eExt[i]['status'] + "</td></tr>";
    }
    e_output += "</table>"
    return e_output;
}
function conInt(prInt) {
    var nInt;
    var cDict = {};
    if (prInt.indexOf("Ethernet") > -1) {
        intI = prInt.replace(/ethernet/i,"");
        if (intI.length == 1) {
            intI = "0" + intI;
        }
        nInt = "1e" + intI;
    }
    else if (prInt.indexOf("Port-Channel") > -1) {
        intI = prInt.replace(/port-channel/i,"");
        if (intI.length == 1) {
            intI = "0" + intI;
        }
        nInt = "2p" + intI;
    }
    else if (prInt.indexOf("Vlan") > -1) {
        intI = prInt.replace(/vlan/i,"");
        if (intI.length == 1) {
            intI = "0" + intI;
        }
        nInt = "3v" + intI;
    }
    else if (prInt.indexOf("Management") > -1) {
        intI = prInt.replace(/management/i,"");
        nInt = "9m" + intI;
    }
    else {
        nInt = prInt;
    }
    return [nInt,prInt];
}

function gIntfID(iList) {
    var cList = [];
    var cDict = {};
    var i;
    for (i in iList) {
        tmpInt = conInt(iList[i]);
        cDict[tmpInt[0]] = tmpInt[1];
        cList.push(tmpInt[0]);
    }
    cList.sort();
    return [cList,cDict];
}

function checkStatus(iStatus) {
    if (iStatus == "connected") {
        return "UP";
    }
    else if (iStatus == "notconnect") {
        return "DOWN";
    }
    else if (iStatus == "disabled") {
        return "DISABLED";
    }
}

function getIntfType(eName) {
    var intfFor = intfData[eName]['mode'];
    if (intfFor == "dataLink") {
        return intfData[eName]['channelGroup'];
    }
    else if (intfFor == 'bridged') {
        return "Access<br />VLAN: " + intfData[eName]["vlanId"];
    }
    else if (intfFor == "routed") {
        return "Routed<br />IP: " + intfData[eName]["ipAddress"];
    }
    else if (intfFor == 'trunk' ) {
        return "Trunk<br />Native Vlan: " + intfData[eName]['nativeVlan'] + "<br />Allowed Vlans: " + intfData[eName]['allowedVlans'];
    }
}

function getBW(bits) {
    var sizes = ['Bits/s', 'Kb/s', 'Mb/s', 'Gb/s', 'Tb/s'];
    if (bits == 0) return '0 Bit/s';
    var i = parseInt(Math.floor(Math.log(bits) / Math.log(1024)));
    return Math.round(bits / Math.pow(1000, i), 2) + ' ' + sizes[i];
 };

 // ===========================
 // Section to build out interface config
 // ===========================
function disIntfDetail(eName) {
    var i_output = "<b>Interface:</b> " + eName + "<form action='#' method='post' id='fdata'>";
    // Admin status portion
    i_output += "Admin Status: <select id='adminStatus'>";
    if (intfData[eName]['status'] == 'disabled') {
        i_output +="<option value='shutdown' selected>Shutdown</option><option value='no shutdown'>No Shutdown</option></select>";
    }
    else {
        i_output +="<option value='shutdown'>Shutdown</option><option value='no shutdown' selected>No Shutdown</option></select>";
    }
    i_output += "<br />";
    i_output += "Description: <input type='text' id='iDesc' value='" + intfData[eName]['description'] + "'><br />";
    // Intferface Mode sections
    if (intfData[eName]['mode'] == 'routed') {
        i_output += "Mode: " + intfData[eName]['mode'] + "<br />";
        // Disable the modifying of a Port's mode
        // i_output += "Mode: <input type='text' id='mode' value='" + iInfo["vlanInformation"]["interfaceMode"] + "'><br />";
        i_output += "IP Address: <input type='text' id='ipAddress' value='" + intfData[eName]["ipAddress"] +"'>";
    }
    else if (intfData[eName]['mode'] == "bridged") {
        i_output += "Mode: access<br />";
        i_output += "Vlan: ";
        i_output += "<select id='accessVlan'>";
        for (i = 0; i < vlns.length; i++) {
            if (vlns[i]['id'] == intfData[eName]['vlanId']) {
                i_output += "<option value='" + vlns[i]['id'] + "' selected>" + vlns[i]['id'] + " - " + vlns[i]['name'] + "</option>";
            }
            else {
                i_output += "<option value='" + vlns[i]['id'] + "'>" + vlns[i]['id'] + " - " + vlns[i]['name'] + "</option>";
            }
        }
        i_output += "</select>";
        
    }
    else if (intfData[eName]['mode'] == 'dataLink') {
        i_output += "Mode: " + intfData[eName]['channelGroup'];
    }
    else {
        i_output += "Mode: trunk<br />";
        i_output += "Native Vlan: <select id='nativeVlan'>";
        if (intfData[eName]['allowedVlans'] == 'all') {
            for (i = 0; i < vlns.length; i++) {
                if (vlns[i]['id'] == intfData[eName]['nativeVlan']) {
                    i_output += "<option value='" + intfData[eName]['nativeVlan'] + "' selected>" + intfData[eName]['nativeVlan'] + " - " + vlnsData[intfData[eName]['nativeVlan']]['name'] + "</option>";
                }
                else {
                    i_output += "<option value='" + vlns[i]['id'] + "'>" + vlns[i]['id'] + " - " + vlns[i]['name'] + "</option>";
                }
            }
            i_output += "</select><br />";
            
        }
        else {
            for (i = 0; i < intfData[eName]['allowedVlans'].length; i++) {
                if (intfData[eName]['allowedVlans'][i] == intfData[eName]['nativeVlan']){
                    i_output += "<option value='" + intfData[eName]['nativeVlan'] + "' selected>" + intfData[eName]['nativeVlan'] + "</option>";
                }
                else {
                    i_output += "<option value='" + intfData[eName]['allowedVlans'][i] + "'>" + intfData[eName]['allowedVlans'][i] + "</option>";
                }
            }
            i_output += "</select><br />";
        }
        i_output += "Allowed Vlans: <br />";
        i_output += "<input style='width:100%' type='text' id='allowVlan' value='" + intfData[eName]['allowedVlans'] + "'>";
    }
    i_output += "<br />";
    i_output += "<input type='button' onclick='formUpdate(\"" + eName + "\")' value='Update Interface'></form>";
    document.getElementById('intfDetail').innerHTML = i_output;
}

function disIntfs(swIntfs) {
    var t_output = "<div class='rTable' style='top:25px;left:17px;'><div class='rTableRow'>";
    var row_top = "", row_bottom="";
    var ethCount = 0;
    for (i = 0; i < swIntfs.length; i++) {
        if (swIntfs[i]['intf'].includes('Ethernet')) {
            ethCount++  ;
        }
    }
    for (i = 0; i <= ethCount; i++) {
        if (swIntfs[i]['intf'].indexOf("Ethernet") > -1) {
            var intfName = swIntfs[i]['intf'];
            var int_status = checkStatus(intfData[intfName]['status']);
            if (int_status) {
                if (i >= 48) {
                    intType = "rQ";
                }
                else {
                    intType = "r";
                }
                if (i % 2 == 0 && i < 47) {
                    if (i == 16 || i == 32) {
                        row_top += "<div class='rIntfBreak'></div>";
                    }
                    row_top += "<div class='" + intType + "Intf" + int_status + "' onclick='disIntfDetail(\"" + intfName + "\")'>" + intfName.replace(/ethernet/i,"") + "<span class='IntfPopTextTOP" + "'>" + intfName + "<br />";
                    row_top += "Desc: " + intfData[intfName]['description'] + "<br />";
                    row_top += "Status: " + intfData[intfName]["status"] + "<br />";
                    row_top += "Bandwidth (In|Out): " + getBW(intfData[intfName]["rBit"]) + " | " + getBW(intfData[intfName]["xBit"]) + "<br />";
                    row_top += "Mode: " + getIntfType(intfName) + "<br />";
                    row_top += "Int Type: " + intfData[intfName]['xcvrType'] + "</span></div>";
                }
                else {
                    if (i == 17 || i == 33 || i == 48) {
                        row_bottom += "<div class='rIntfBreak'></div>";
                    }
                    row_bottom += "<div class='" + intType + "Intf" + int_status + "' onclick='disIntfDetail(\"" + intfName + "\")'>" + intfName.replace(/ethernet/i,"") + "<span class='IntfPopTextBOTTOM" + "'>" + intfName + "<br />";
                    row_bottom += "Desc: " + intfData[intfName]['description'] + "<br />";
                    row_bottom += "Status: " + intfData[intfName]["status"] + "<br />";
                    row_bottom += "Bandwidth (In|Out): " + getBW(intfData[intfName]["rBit"]) + " | " + getBW(intfData[intfName]["xBit"]) + "<br />";
                    row_bottom += "Mode: " + getIntfType(intfName) + "<br />";
                    row_bottom += "Int Type: " + intfData[intfName]['xcvrType'] + "</span></div>";
                }
            }
        }
    }
    t_output += row_top + "</div><div class='rTableRow'>" + row_bottom;
    t_output += "</div></div></div>";
    return t_output;
}
