---
{
  "title": "行数アクション",
  "language": "ja",
  "description": "指定されたテーブルの行数統計を手動で更新するために使用されます。行数の統計を更新している間、"
}
---
# Row Count Action

## リクエスト

`GET /api/rowcount`

## 説明

指定されたテーブルの行数統計を手動で更新するために使用されます。行数の統計を更新する際、テーブルとrollupに対応する行数もJSON形式で返されます。

## パスパラメータ

なし

## クエリパラメータ

* `db`

    データベースを指定

* `table`

    テーブルを指定

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": 10000
	},
	"count": 0
}
```
## 例

1. 指定されたTableの行数を更新して取得する

    ```
    GET /api/rowcount?db=example_db&table=tbl1
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"tbl1": 10000
    	},
    	"count": 0
    }
    ```
