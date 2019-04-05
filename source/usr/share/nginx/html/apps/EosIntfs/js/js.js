var eosURL = window.location.href;
eosURL = eosURL.replace("https:","wss:")
eosURL = eosURL.replace("apps/EosIntfs/","eos")

var ws = new WebSocket(eosURL);
ws.onopen = function()
{
    // Web Socket is connected, send data using send()
    ws.send("Hello Test");
    // alert("Message is sent...");
};
ws.onmessage = function (evt) 
{ 
    var output = "";
    var i;
    var x;
    var re_data = evt.data;
    var c_intfs;
    var received_msg = JSON.parse(re_data);
    var res_keys = Object.keys(received_msg[2]['intfStatus']);
    
    // Check to see if this is the initial data dump
    if (received_msg[0] == "0") {
        document.getElementById('swHostname').innerHTML = received_msg[2]['hostname'];
        document.getElementById('eosModel').innerHTML = received_msg[2]['system']['modelName'];
        document.getElementById('serialNumber').innerHTML = received_msg[2]['system']['serialNumber'];
        document.getElementById('eosVersion').innerHTML = received_msg[2]['system']['version'];
        document.getElementById('lastUpdate').innerHTML = received_msg[1];
        document.getElementById('eosImage').innerHTML = "<img src='imgs/" + received_msg[2]['swImage'] + "'>";
        r_msg = received_msg[2]["intfStatus"];
        c_intfs = gIntfID(res_keys);
        output += disIntfs(r_msg,c_intfs,received_msg[2]["intfData"]);
        document.getElementById('EosOutput').innerHTML = output;
    }
    else {
        document.getElementById('lastUpdate').innerHTML = received_msg[1];
        r_msg = received_msg[2]["intfStatus"];
        intf_data = received_msg[2]["intfData"];
        c_intfs = gIntfID(res_keys);
        output += disIntfs(r_msg,c_intfs,received_msg[2]["intfData"]);
        document.getElementById('EosOutput').innerHTML = output;
    } 
};
/*
window.addEventListener("load", function() {

    document.getElementById("EOS_CMD").addEventListener("submit", function (event) {
        event.preventDefault();
        ws.send(document.getElementById('eCmd').value);
    });
});
*/
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

function getIntfType(intInfo) {
    var intfFor = intInfo["vlanInformation"]["interfaceForwardingModel"];
    if (intfFor == "dataLink") {
        return intInfo["vlanInformation"]["vlanExplanation"];
    }
    else if (intfFor == "bridged" && intInfo["vlanInformation"]["interfaceMode"] == "bridged") {
        return "Access<br />VLAN: " + intInfo["vlanInformation"]["vlanId"];
    }
    else if (intfFor == "routed") {
        return "Routed";
    }
    else {
        return "Trunk";
    }
}

function getBW(bits) {
    var sizes = ['Bits/s', 'Kb/s', 'Mb/s', 'Gb/s', 'Tb/s'];
    if (bits == 0) return '0 Bit/s';
    var i = parseInt(Math.floor(Math.log(bits) / Math.log(1024)));
    return Math.round(bits / Math.pow(1000, i), 2) + ' ' + sizes[i];
 };

function disIntfs(rData,rIntfs,dIntfs) {
    var t_output = "<div class='rTable' style='top:25px;left:17px;'><div class='rTableRow'>";
    var row_top = "", row_bottom="";
    var i;
    for (i = 0; i <= 49; i++) {
        if (rIntfs[1][rIntfs[0][i]].indexOf("Ethernet") > -1) {
            iInfo = rData[rIntfs[1][rIntfs[0][i]]];
            t_class = checkStatus(iInfo["linkStatus"]);
            if (t_class) {
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
                    row_top += "<div class='" + intType + "Intf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextTOP" + "'>" + rIntfs[1][rIntfs[0][i]] + "<br />";
                    row_top += "Desc: " + iInfo['description'] + "<br />";
                    row_top += "Status: " + iInfo["linkStatus"] + "<br />";
                    row_top += "Bandwidth (In/Out): " + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["inBitsRate"]) + "/" + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["outBitsRate"]) + "<br />";
                    row_top += "Mode: " + getIntfType(iInfo) + "<br />";
                    row_top += "Int Type: " + iInfo['interfaceType'] + "</span></div>";
                }
                else {
                    if (i == 17 || i == 33 || i == 48) {
                        row_bottom += "<div class='rIntfBreak'></div>";
                    }
                    row_bottom += "<div class='" + intType + "Intf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextBOTTOM" + "'>" + rIntfs[1][rIntfs[0][i]] + "<br />";
                    row_bottom += "Desc: " + iInfo['description'] + "<br />";
                    row_bottom += "Status: " + iInfo["linkStatus"] + "<br />";
                    row_bottom += "Bandwidth (In/Out): " + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["inBitsRate"]) + "/" + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["outBitsRate"]) + "<br />";
                    row_bottom += "Mode: " + getIntfType(iInfo) + "<br />";
                    row_bottom += "Int Type: " + iInfo['interfaceType'] + "</span></div>";
                }
            }
        }
    }
    t_output += row_top + "</div><div class='rTableRow'>" + row_bottom;
    t_output += "</div></div></div>";
    return t_output;
}