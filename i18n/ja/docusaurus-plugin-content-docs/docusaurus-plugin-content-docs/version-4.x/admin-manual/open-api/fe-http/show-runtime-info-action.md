---
{
  "title": "ランタイム情報表示アクション",
  "language": "ja",
  "description": "FE JVMのランタイム情報を取得するために使用される"
}
---
# Show Runtime Info Action

## リクエスト

`GET /api/show_runtime_info`

## 説明

FE JVMのRuntime情報を取得するために使用されます
    
## パスパラメータ

なし

## クエリパラメータ

なし

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"free_mem": "855642056",
		"total_mem": "1037959168",
		"thread_cnt": "98",
		"max_mem": "1037959168"
	},
	"count": 0
}
```
## 例

1. 現在のFEノードのJVM情報を取得する

    ```
    GET /api/show_runtime_info
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"free_mem": "855642056",
    		"total_mem": "1037959168",
    		"thread_cnt": "98",
    		"max_mem": "1037959168"
    	},
    	"count": 0
    }
    ```
