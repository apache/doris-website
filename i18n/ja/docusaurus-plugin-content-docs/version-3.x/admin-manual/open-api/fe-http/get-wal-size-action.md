---
{
  "title": "WALサイズを取得",
  "language": "ja",
  "description": "Users can retrieve the number of WAL files for a specified BE through this HTTP interface. If no BE is specified, it returns the number of WAL files for all BEs by default."
}
---
## Request

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## Description

ユーザーはこのHTTPインターフェースを通じて、指定されたBEのWALファイルの数を取得できます。BEを指定しない場合は、デフォルトですべてのBEのWALファイルの数を返します。

## Path parameters

なし

## Query parameters

* `host_ports`

    BEのIPとhttpポート。

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

1. すべてのBEのWALファイルの数を取得します。

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
返された結果において、BEの後に続く数字が対応するBEのWALファイル数です。

2. 指定されたBEのWALファイル数を取得する。

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
返された結果において、BEに続く数字が対応するBEのWALファイル数となります。
