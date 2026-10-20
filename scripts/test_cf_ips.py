import socket
import ssl
import time

cf_ips = [
    '104.21.79.198',   # Current assigned 1
    '172.67.147.208',  # Current assigned 2
    '104.21.64.1',
    '104.21.32.1',
    '172.67.180.1',
    '172.67.130.1',
    '188.114.97.1',
    '188.114.96.1',
    '104.16.132.229',
    '104.16.133.229'
]

domain = 'mastersofthewild.ru'
path = '/assets/vendor-pixi-9br39sRK.js'

for ip in cf_ips:
    start = time.time()
    try:
        sock = socket.create_connection((ip, 443), timeout=3)
        ctx = ssl.create_default_context()
        ssock = ctx.wrap_socket(sock, server_hostname=domain)
        req = f"GET {path} HTTP/1.1\r\nHost: {domain}\r\nUser-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n"
        ssock.sendall(req.encode('utf-8'))
        
        # Read first 100 KB
        total = 0
        ssock.settimeout(3.0)
        while True:
            chunk = ssock.recv(16384)
            if not chunk:
                break
            total += len(chunk)
            if total >= 100000:
                break
        ssock.close()
        elapsed = time.time() - start
        print(f"[SUCCESS] {ip:16} - read {total} bytes in {elapsed:.2f}s ({total/elapsed/1024:.1f} KB/s)")
    except Exception as e:
        print(f"[FAIL]    {ip:16} - {e}")
