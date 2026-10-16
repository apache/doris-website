---
{
    "title": "ランタイム情報の取得（Show Runtime Info Action）",
    "language": "ja",
    "description": "FE の JVM ランタイム情報を取得します。"
}
---

# ランタイム情報の取得（Show Runtime Info Action）

## リクエスト

`GET /api/show_runtime_info`

## 説明

FE の JVM ランタイム情報を取得します。
    
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
    
## 使用例

1. 現在の FE ノードの JVM 情報を取得する

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
