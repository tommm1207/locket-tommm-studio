import urllib.request
import urllib.parse
import json

with urllib.request.urlopen('http://192.168.50.20:8080/list?path=%2F', timeout=5) as r:
    items = json.loads(r.read().decode('utf-8'))

for it in items:
    if 'Locket_Super' in it['name'] or 'Locket_Tommm' in it['name']:
        data = urllib.parse.urlencode({'path': it['path']}).encode('utf-8')
        req = urllib.request.Request('http://192.168.50.20:8080/delete', data=data, method='POST')
        urllib.request.urlopen(req, timeout=5)
        print('Deleted:', it['path'])

with open(r'D:\Locket_Gold_Tommm\Locket_Tommm_Private.conf', 'rb') as f:
    conf_bytes = f.read()

boundary = b'----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    b'--' + boundary + b'\r\n'
    b'Content-Disposition: form-data; name="path"\r\n\r\n'
    b'/\r\n'
    b'--' + boundary + b'\r\n'
    b'Content-Disposition: form-data; name="files[]"; filename="Locket_Tommm_Private.conf"\r\n'
    b'Content-Type: application/octet-stream\r\n\r\n'
    + conf_bytes + b'\r\n'
    b'--' + boundary + b'--\r\n'
)
req = urllib.request.Request(
    'http://192.168.50.20:8080/upload',
    data=body,
    headers={'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'},
    method='POST'
)
with urllib.request.urlopen(req, timeout=15) as r:
    print('Upload Locket_Tommm_Private.conf response:', r.status, r.read().decode('utf-8'))

with urllib.request.urlopen('http://192.168.50.20:8080/list?path=%2F', timeout=5) as r:
    print('Updated Shadowrocket files:', r.read().decode('utf-8'))
