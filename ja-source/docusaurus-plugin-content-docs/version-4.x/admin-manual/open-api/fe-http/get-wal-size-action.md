---
{
  "title": "WALサイズを取得",
  "language": "ja",
  "description": "ユーザーは、このHTTPインターフェースを通じて指定されたBEのWALファイル数を取得できます。BEを指定しない場合は、デフォルトですべてのBEのWALファイル数を返します。"
}
---
## Request

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## 詳細

ユーザーはこのHTTPインターフェースを通じて、指定したBEのWALファイル数を取得できます。BEを指定しない場合は、デフォルトですべてのBEのWALファイル数を返します。

## Path parameters

なし

## Query parameters

* `host_ports`

    BEのipとhttpポート。

## Request body

なし

## Response

```
{
"msg": "OK",
"code": 0,
"data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
"count": 0
}
```
## Examples

1. 全てのBEのWALファイルの数を取得する。

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
    "count": 0
    }
    ```
返されるレスルトにおいて、BEに続く数字が対応するBEのWALファイル数です。

2. 指定したBEのWALファイル数を取得する。

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size?192.168.10.11:9050"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1"],
    "count": 0
    }
    ```
返された結果において、BEに続く数字が対応するBEのWALファイル数を示しています。
