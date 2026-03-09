---
{
  "title": "Meta Info Action | Fe Http",
  "language": "ja",
  "description": "Meta Info Actionは、クラスター内のメタデータ情報を取得するために使用されます。データベース一覧やテーブル構造などです。",
  "sidebar_label": "Meta Info Action"
}
---
# Meta Action

Meta Info Actionは、クラスター内のメタデータ情報を取得するために使用されます。データベース一覧、テーブル構造などです。

## List Database

### Request

```
GET /api/meta/namespaces/<ns_name>/databases
```
### 説明

すべてのデータベース名のリストをアルファベット順に取得します。

### Path parameters

なし

### Query parameters

* `limit`

    返される結果行数を制限します
    
* `offset`

    ページネーション情報、`limit`と組み合わせて使用する必要があります
    
### Request body

なし

### Response

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "db1", "db2", "db3", ...  
	],
	"count": 3
}
```
* dataフィールドはデータベース名のリストを返します。

## List Table

### Request

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables
```
### 説明

指定されたデータベース内のテーブル一覧をアルファベット順に取得します。

### Pathパラメータ

* `<db_name>`

    データベースを指定

### Queryパラメータ

* `limit`

    返される結果行数を制限

* `offset`

    ページネーション情報、`limit`と組み合わせて使用する必要があります

### Request body

なし

### Response

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "tbl1", "tbl2", "tbl3", ...  
	],
	"count": 0
}
```
* dataフィールドはテーブル名のリストを返します。

## Schema Info

### Request

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables/<tbl_name>/schema
```
### Description

指定されたデータベース内の指定されたテーブルのテーブル構造情報を取得します。
    
### Path parameters

* `<db_name>`

    データベース名を指定します
    
* `<tbl_name>`

    テーブル名を指定します

### Query parameters

* `with_mv`

    オプション。指定されない場合、デフォルトでベーステーブルのテーブル構造が返されます。指定された場合、すべてのrollup indexも返されます。

### Request body

なし

### Response

```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		}
	},
	"count": 0
}
```
```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema?with_mv?=1

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		},
		"rollup1": {
			"schema": [{
				"Field": "k1",
				"Type": "INT",
				"Null": "Yes",
				"Extra": "",
				"Default": null,
				"Key": "true"
			}],
			"is_base": false
		}
	},
	"count": 0
}
```
* dataフィールドは、ベーステーブルまたはrollupテーブルのテーブル構造情報を返します。
