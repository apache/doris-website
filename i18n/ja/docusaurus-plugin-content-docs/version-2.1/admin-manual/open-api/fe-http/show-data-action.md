---
{
  "title": "データ表示アクション",
  "language": "ja",
  "description": "クラスター全体のデータ容量または指定されたデータベースのデータ容量を取得するために使用されます。単位はbyteです。"
}
---
# Show Data Action

## Request

`GET /api/show_data`

## Description

クラスターの総データ量または指定されたデータベースのデータ量を取得するために使用します。単位はbyteです。
    
## Path parameters

なし

## Query parameters

* `db`

    オプション。指定された場合、指定されたデータベースのデータ量を取得します。

## Request body

なし

## Response

1. データベース内のデータ量を指定します。

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
2. 総データ

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

1. 指定されたデータベースのデータ量を取得する

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
2. クラスターの総データ量を取得する

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
