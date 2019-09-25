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
        document.getElementById('eosExtensions').innerHTML = disExt(received_msg[2]['extensions']);
        document.getElementById('eosImage').innerHTML = "<img src='imgs/" + received_msg[2]['swImage'] + "'>";
        r_msg = received_msg[2]["intfStatus"];
        r_idata = received_msg[2]["intfData"]
        c_intfs = gIntfID(res_keys);
        output += disIntfs(r_msg,c_intfs,r_idata);
        document.getElementById('EosOutput').innerHTML = output;
        disIntfDetail('Ethernet1');
    }
    else {
        document.getElementById('lastUpdate').innerHTML = received_msg[1];
        document.getElementById('eosExtensions').innerHTML = disExt(received_msg[2]['extensions']);
        r_msg = received_msg[2]["intfStatus"];
        r_idata = received_msg[2]["intfData"]
        intf_data = received_msg[2]["intfData"];
        c_intfs = gIntfID(res_keys);
        output += disIntfs(r_msg,c_intfs,r_idata);
        document.getElementById('EosOutput').innerHTML = output;
    } 
};

function formUpdate(eName) {
    var upData = {intf: eName, status: document.getElementById("adminStatus").value};
    ws.send(JSON.stringify({type: "IntfUpdate", data: upData}));
}
/*
window.addEventListener("load", function() {

    document.getElementById("EOS_CMD").addEventListener("submit", function (event) {
        event.preventDefault();
        ws.send(document.getElementById('eCmd').value);
    });
});
*/
function disExt(eExt) {
    var e_output = "<table><tr><th>Extension</th><th>Version</th><th>Status</th></tr>";
    // e_output = eExt[0]['version'];
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

function getIntfType(intInfo,intData) {
    var intfFor = intInfo["vlanInformation"]["interfaceForwardingModel"];
    if (intfFor == "dataLink") {
        return intInfo["vlanInformation"]["vlanExplanation"];
    }
    else if (intfFor == "bridged" && intInfo["vlanInformation"]["interfaceMode"] == "bridged") {
        return "Access<br />VLAN: " + intInfo["vlanInformation"]["vlanId"];
    }
    else if (intfFor == "routed") {
        return "Routed<br />IP: " + intData["interfaceAddress"][0]["primaryIp"]["address"] + "/" + intData["interfaceAddress"][0]["primaryIp"]["maskLen"];
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

function disIntfDetail(eName) {
    iInfo = r_msg[eName];
    dInfo = r_idata['interfaces'][eName];
    var i_output = "<b>Interface:</b> " + eName + "<form action='#' method='post' id='fdata'>";
    i_output += "Admin Status: <select id='adminStatus'>";
    if (iInfo['linkStatus'] == 'disabled') {
        i_output +="<option value='shutdown' selected>Shutdown</option><option value='no shutdown'>No Shutdown</option></select>";
    }
    else {
        i_output +="<option value='shutdown'>Shutdown</option><option value='no shutdown' selected>No Shutdown</option></select>";
    }
    i_output += "<br />";
    if (iInfo["vlanInformation"]["interfaceMode"] == 'routed') {
        i_output += "Mode: <input type='text' id='mode' value='" + iInfo["vlanInformation"]["interfaceMode"] + "'><br />";
        i_output += "IP Address: <input type='text' id='ipAddress' value='" + dInfo["interfaceAddress"][0]["primaryIp"]["address"] + "/" + dInfo["interfaceAddress"][0]["primaryIp"]["maskLen"] +"'><br />";
        // console.log(JSON.stringify(dInfo));
    }
    i_output += "<br /><input type='button' onclick='formUpdate(\"" + eName + "\")' value='Update Interface'></form>";
    document.getElementById('intfDetail').innerHTML = i_output;
}

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
                    row_top += "<div class='" + intType + "Intf" + t_class + "' onclick='disIntfDetail(\"" + rIntfs[1][rIntfs[0][i]] + "\")'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextTOP" + "'>" + rIntfs[1][rIntfs[0][i]] + "<br />";
                    row_top += "Desc: " + iInfo['description'] + "<br />";
                    row_top += "Status: " + iInfo["linkStatus"] + "<br />";
                    row_top += "Bandwidth (In|Out): " + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["inBitsRate"]) + " | " + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["outBitsRate"]) + "<br />";
                    row_top += "Mode: " + getIntfType(iInfo,dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]) + "<br />";
                    row_top += "Int Type: " + iInfo['interfaceType'] + "</span></div>";
                }
                else {
                    if (i == 17 || i == 33 || i == 48) {
                        row_bottom += "<div class='rIntfBreak'></div>";
                    }
                    row_bottom += "<div class='" + intType + "Intf" + t_class + "' onclick='disIntfDetail(\"" + rIntfs[1][rIntfs[0][i]] + "\")'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextBOTTOM" + "'>" + rIntfs[1][rIntfs[0][i]] + "<br />";
                    row_bottom += "Desc: " + iInfo['description'] + "<br />";
                    row_bottom += "Status: " + iInfo["linkStatus"] + "<br />";
                    row_bottom += "Bandwidth (In|Out): " + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["inBitsRate"]) + " | " + getBW(dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]["interfaceStatistics"]["outBitsRate"]) + "<br />";
                    row_bottom += "Mode: " + getIntfType(iInfo,dIntfs["interfaces"][rIntfs[1][rIntfs[0][i]]]) + "<br />";
                    row_bottom += "Int Type: " + iInfo['interfaceType'] + "</span></div>";
                }
            }
        }
    }
    t_output += row_top + "</div><div class='rTableRow'>" + row_bottom;
    t_output += "</div></div></div>";
    return t_output;
}
