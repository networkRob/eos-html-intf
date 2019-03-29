var ws = new WebSocket("wss://rtr-02.rob.lab/eos")
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
    var res_keys = Object.keys(received_msg[1]);
    if (received_msg == "INIT") {
        output = "<p>Welcome to Arista EOS</p>";
    }
    else {
        output += "<h3>" + received_msg[0] + "</h3>";
        r_msg = received_msg[1];

        // Evaluate if Interface Data
        if (received_msg[0] == "intfs") {
            c_intfs = gIntfID(received_msg[0],res_keys);
            output += disIntfs(received_msg[0],r_msg,c_intfs);
            /*
            for (i in c_intfs[0]) {
                output += "<b>" + c_intfs[1][c_intfs[0][i]] + ":</b><br />";
                var tmp_keys = Object.keys(r_msg[c_intfs[1][c_intfs[0][i]]]);
                for (x in tmp_keys) {
                    if (tmp_keys[x] == "vlanInformation") {
                        output += tmp_keys[x] + ":<br />";
                        var y;
                        var v_keys = Object.keys(r_msg[res_keys[i]][tmp_keys[x]]);
                        for (y in v_keys) {
                            output += "&nbsp&nbsp&nbsp" + v_keys[y] + ": " + r_msg[res_keys[i]][tmp_keys[x]][v_keys[y]] + "<br />";
                        }
                    }
                    else {
                        output += tmp_keys[x] + ": " + r_msg[c_intfs[1][c_intfs[0][i]]][tmp_keys[x]] + "<br />";
                    }
                }
            }*/
        }
        else if (received_msg[0] == "status") {
            c_intfs = gIntfID(received_msg[0],res_keys);
            output += dis48Intfs(received_msg[0],r_msg,c_intfs);
        }
        else if (received_msg[0] == "mode") {
            c_intfs = gIntfID(received_msg[0],res_keys);
            for (i in c_intfs[0]) {
                output += c_intfs[1][c_intfs[0][i]] + ": " + r_msg[c_intfs[1][c_intfs[0][i]]]+ "<br />";
            }
        }
        // All other data
        else {
            for (i in res_keys) {
                if (received_msg[0] == "extensions") {
                    output += "<b>" + res_keys[i] + ":</b><br />";
                }
                var tmp_keys = Object.keys(r_msg[res_keys[i]]);
                for (x in tmp_keys) {
                    if (tmp_keys[x] == "rpms") {
                        output += tmp_keys[x] + ":<br />";
                        var y;
                        var v_keys = Object.keys(r_msg[res_keys[i]][tmp_keys[x]]);
                        for (y in v_keys) {
                            output += "&nbsp&nbsp&nbsp" + v_keys[y] + ": " + r_msg[res_keys[i]][tmp_keys[x]][v_keys[y]] + "<br />";
                        }
                    }
                    else {
                        output += tmp_keys[x] + ": " + r_msg[res_keys[i]][tmp_keys[x]] + "<br />";
                    }
                }
            }
    
        }
       
    }

    document.getElementById('EosOutput').innerHTML = output;
    
};

window.addEventListener("load", function() {

    document.getElementById("EOS_CMD").addEventListener("submit", function (event) {
        event.preventDefault();
        ws.send(document.getElementById('eCmd').value);
    });
});

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

function gIntfID(rType,iList) {
    var cList = [];
    var cDict = {};
    var i;
    if (rType != "intfs") {
        for (i in iList) {
            tmpInt = conInt(iList[i]);
            cDict[tmpInt[0]] = tmpInt[1];
            cList.push(tmpInt[0]);
        }
    }
    else {
        for (i in iList) {
            tmpInt = conInt(iList[i]);
            cDict[tmpInt[0]] = tmpInt[1];
            cList.push(tmpInt[0]);
        }
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

function disIntfs(rType,rData,rIntfs) {
    var t_output = "<div class='rTable'><div class='rTableRow'>";
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
                if (i % 2 == 0) {
                    row_top += "<div class='" + intType + "Intf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextTOP" + "'>" + rIntfs[1][rIntfs[0][i]] + "<br />";
                    row_top += "Desc: " + iInfo['description'] + "<br />";
                    row_top += "Int Type: " + iInfo['interfaceType'] + "</span></div>";
                }
                else {
                    row_bottom += "<div class='" + intType + "Intf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextBOTTOM" + "'>" + rIntfs[1][rIntfs[0][i]] + "<br />";
                    row_bottom += "Desc: " + iInfo['description'] + "<br />";
                    row_bottom += "Int Type: " + iInfo['interfaceType'] + "</span></div>";
                }
            }
        }
    }
    t_output += row_top + "</div><div class='rTableRow'>" + row_bottom;
    t_output += "</div></div>";
    return t_output;
}

function dis48Intfs(rType,rData,rIntfs) {
    var t_output = "<div class='rTable'><div class='rTableRow'>";
    var i;
    for (i = 0; i <= 46; i += 2) {
        t_class = checkStatus(rData[rIntfs[1][rIntfs[0][i]]]);
        if (t_class) {
            t_output += "<div class='rIntf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextTOP'>" + rIntfs[1][rIntfs[0][i]] + "</span></div>";
        }
    }
    t_output += "<div class='rIntfBreak'></div>";
    for (i = 48; i <= 54; i += 2) {
        var t_class;
        if (rIntfs[1][rIntfs[0][i]].indexOf("Ethernet") > -1) {
            t_class = checkStatus(rData[rIntfs[1][rIntfs[0][i]]]);
        }        
        else {
            t_class = "";
        }
        if (t_class) {
            t_output += "<div class='rQIntf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextTOP'>" + rIntfs[1][rIntfs[0][i]] + "</span></div>";
        }
    }
    t_output += "</div><div class='rTableRow'>";
    for (i = 1; i <= 47; i += 2) {
        t_class = checkStatus(rData[rIntfs[1][rIntfs[0][i]]]);
        if (t_class) {
            t_output += "<div class='rIntf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextBOTTOM'>" + rIntfs[1][rIntfs[0][i]] + "</span></div>";
        }
    }
    t_output += "<div class='rIntfBreak'></div>";
    for (i = 49; i <= 54; i += 2) {
        var t_class;
        if (rIntfs[1][rIntfs[0][i]].indexOf("Ethernet") > -1) {
            t_class = checkStatus(rData[rIntfs[1][rIntfs[0][i]]]);
        }        
        else {
            t_class = "";
        }
        if (t_class) {
            t_output += "<div class='rQIntf" + t_class + "'>" + rIntfs[1][rIntfs[0][i]].replace(/ethernet/i,"") + "<span class='IntfPopTextBOTTOM'>" + rIntfs[1][rIntfs[0][i]] + "</span></div>";
        }
    }
    t_output += "</div></div>";
    return t_output;
}