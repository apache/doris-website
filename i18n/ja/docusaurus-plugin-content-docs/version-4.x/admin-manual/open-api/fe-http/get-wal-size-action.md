---
{
    "title": "WAL サイズの取得",
    "language": "ja",
    "description": "この HTTP インターフェースを使用すると、指定した BE の WAL ファイル数を取得できます。BE を指定しない場合は、デフォルトですべての BE の WAL ファイル数が返されます。"
}
---

## リクエスト

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## 説明

この HTTP インターフェースを使用すると、指定した BE の WAL ファイル数を取得できます。BE を指定しない場合は、デフォルトですべての BE の WAL ファイル数が返されます。

## パスパラメータ

なし

## クエリパラメータ

* `host_ports`

    BE の IP アドレスと HTTP ポート。

## リクエストボディ

なし

## レスポンス

```
{
"msg": "OK",
"code": 0,
"data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
"count": 0
}
```
    
## 例

1. すべての BE の WAL ファイル数を取得します。

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
    
    返された結果では、各 BE の後ろにある数値が、その BE の WAL ファイル数を表します。

2. 指定した BE の WAL ファイル数を取得します。

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size?host_ports=192.168.10.11:9050"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1"],
    "count": 0
    }
    ```
    
    返された結果では、各 BE の後ろにある数値が、その BE の WAL ファイル数を表します。
