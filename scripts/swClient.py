import socket, json
from pprint import pprint as pp

HOST='localhost'
PORT= 50019

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect((HOST, PORT))
s.sendall("Hello World")
data = s.recv(1024)
print(data)



fData = json.loads(data)
pp(fData)