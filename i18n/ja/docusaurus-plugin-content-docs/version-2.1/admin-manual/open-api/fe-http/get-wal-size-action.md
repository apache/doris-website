---
{
  "title": "WALサイズを取得",
  "language": "ja",
  "description": "ユーザーはこのHTTPインターフェースを通じて指定されたBEのWALファイル数を取得できます。BEが指定されていない場合は、デフォルトですべてのBEのWALファイル数が返されます。"
}
---
## Request

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## Description

ユーザーはこのHTTPインターフェースを通じて指定されたBEのWALファイルの数を取得できます。BEを指定しない場合、デフォルトですべてのBEのWALファイルの数が返されます。

## Path parameters

なし

## Query parameters

* `host_ports`

    BEのIPとHTTPポート。

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
## 例

1. 全てのBEのWALファイル数を取得する。

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
返された結果において、BEに続く数字が対応するBEのWALファイル数になります。

2. 指定されたBEのWALファイル数を取得します。

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
返された結果において、BEの後に続く数字が対応するBEのWALファイル数となります。
