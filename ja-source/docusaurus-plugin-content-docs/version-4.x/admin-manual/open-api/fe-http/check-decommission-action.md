---
{
  "title": "廃止アクションの確認",
  "language": "ja",
  "description": "指定されたBEが廃止可能かどうかを判定するために使用される。例えば、ノードが廃止された後、"
}
---
# Check Decommission Action

## Request

`GET /api/check_decommission`

## 詳細

指定されたBEがデコミッションできるかどうかを判定するために使用されます。例えば、ノードがデコミッションされた後、残りのノードが容量要件とレプリカ数を満たすことができるかどうかを判定します。
    
## Path parameters

なし

## Query parameters

* `host_ports`

    1つまたは複数のBEをカンマ区切りで指定します。例：`ip1:port1,ip2:port2,...`

    ここでportはBEのハートビートポートです。

## Request body

なし

## Response

デコミッション可能なノードのリストを返します

```
{
	"msg": "OK",
	"code": 0,
	"data": ["192.168.10.11:9050", "192.168.10.11:9050"],
	"count": 0
}
```
## 例

1. 指定されたBEノードがデコミッション可能かどうかを確認する

    ```
    GET /api/check_decommission?host_ports=192.168.10.11:9050,192.168.10.11:9050
    
    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": ["192.168.10.11:9050"],
    	"count": 0
    }
    ```
