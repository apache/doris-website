---
{
  "title": "プロセスアクションを表示",
  "language": "ja",
  "description": "PROC情報を取得するために使用されます。"
}
---
# Show Proc Action

## Request

`GET /api/show_proc`

## Description

PROC情報を取得するために使用されます。
    
## Path parameters

なし

## Query parameters

* path

    Proc Pathを指定します
    
* forward

    実行のためにMaster FEに転送するかどうか

## Request body

なし

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": [
		proc infos ...
	],
	"count": 0
}
```
## 例

1. `/statistic` 情報を表示する

    ```
    GET /api/show_proc?path=/statistic
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```
2. 実行のためにMasterに転送する

    ```
    GET /api/show_proc?path=/statistic&forward=true
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```
