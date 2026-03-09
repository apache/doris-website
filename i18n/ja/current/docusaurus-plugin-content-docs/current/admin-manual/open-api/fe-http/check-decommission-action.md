---
{
  "title": "デコミッションアクションを確認",
  "language": "ja",
  "description": "指定されたBEが廃止可能かどうかを判断するために使用されます。例えば、ノードが廃止された後、"
}
---
# Check Decommission Action

## Request

`GET /api/check_decommission`

## Description

指定されたBEを廃止できるかどうかを判断するために使用されます。例えば、ノードが廃止された後、残りのノードが容量要件とレプリカ数を満たすことができるかどうかを確認します。

## Path parameters

なし

## Query parameters

* `host_ports`

    1つ以上のBEを指定し、カンマで区切ります。例：`ip1:port1,ip2:port2,...`

    ここでportはBEのハートビートポートです。

## Request body

なし

## Response

廃止可能なノードのリストを返します

```
{
	"msg": "OK",
	"code": 0,
	"data": ["192.168.10.11:9050", "192.168.10.11:9050"],
	"count": 0
}
```
## 例

1. 指定されたBEノードが廃止可能かどうかを確認する

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
