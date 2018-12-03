var ws = new WebSocket("wss://rtr-02.rob.lab:50019")
ws.onopen = function()
{
    // Web Socket is connected, send data using send()
    ws.send("Hello Test");
    alert("Message is sent...");
};
ws.onmessage = function (evt) 
{ 
    var received_msg = evt.data;
    alert("Message is received...");
    
};