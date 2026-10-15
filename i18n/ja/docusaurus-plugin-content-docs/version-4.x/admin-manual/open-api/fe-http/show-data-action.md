---
{
    "title": "データ量の表示アクション",
    "language": "ja",
    "description": "クラスター全体、または指定したデータベースのデータ量を取得します。単位はバイトです。"
}
---

# データ量の表示アクション

## リクエスト

`GET /api/show_data`

## 説明

クラスター全体、または指定したデータベースのデータ量を取得します。単位はバイトです。
    
## パスパラメータ

なし

## クエリパラメータ

* `db`

    省略可能です。指定すると、そのデータベースのデータ量を取得します。

## リクエストボディ

なし

## レスポンス

1. 指定したデータベースのデータ量

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```
    
2. 合計データ量

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"__total_size": 381
    	},
    	"count": 0
    }
    ```
    
## 例

1. 指定したデータベースのデータ量を取得します。

    ```
    GET /api/show_data?db=db1
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```

2. クラスター全体のデータ量を取得します。

    ```
    GET /api/show_data
        
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"__total_size": 381
    	},
    	"count": 0
    }
    ```
