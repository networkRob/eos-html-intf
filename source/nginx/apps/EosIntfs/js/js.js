var ws = new WebSocket("wss://192.168.50.189/eos")
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
    document.getElementById('EosOutput').innerHTML = received_msg;
    
};

window.addEventListener("load", function() {
    document.getElementById("EOS_CMD").addEventListener("submit", function (event) {
        event.preventDefault();
        ws.send(document.getElementById('eCmd').value);
    });
});