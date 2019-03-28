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
            }
        }
        else if (received_msg[0] == "mode" ||
        received_msg[0] == "status") {
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