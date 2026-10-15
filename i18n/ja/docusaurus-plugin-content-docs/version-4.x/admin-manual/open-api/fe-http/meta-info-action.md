---
{
    "title": "メタ情報アクション | FE HTTP",
    "language": "ja",
    "description": "メタ情報アクションは、データベースの一覧やテーブル構造など、クラスター内のメタデータ情報を取得するために使用します。",
    "sidebar_label": "メタ情報アクション"
}
---

# メタ情報アクション

メタ情報アクションは、データベースの一覧やテーブル構造など、クラスター内のメタデータ情報を取得するために使用します。

## データベースの一覧

### リクエスト

```
GET /api/meta/namespaces/<ns_name>/databases
```

### 説明

すべてのデータベース名をアルファベット順に並べた一覧を取得します。
    
### パスパラメータ

なし

### クエリパラメータ

* `limit`

    返される結果の行数を制限します。
    
* `offset`

    ページネーションに使用します。`limit` と併用する必要があります。
    
### リクエストボディ

なし

### レスポンス

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

* data フィールドには、データベース名の一覧が返されます。

## テーブルの一覧

### リクエスト

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables
```

### 説明

指定したデータベース内のテーブルをアルファベット順に並べた一覧を取得します。
    
### パスパラメータ

* `<db_name>`

    データベースを指定します。

### クエリパラメータ

* `limit`

    返される結果の行数を制限します。
    
* `offset`

    ページネーションに使用します。`limit` と併用する必要があります。

### リクエストボディ

なし

### レスポンス

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

* data フィールドには、テーブル名の一覧が返されます。

## スキーマ情報

### リクエスト

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables/<tbl_name>/schema
```

### 説明

指定したデータベース内の指定したテーブルの構造情報を取得します。
    
### パスパラメータ

* `<db_name>`

    データベース名を指定します。
    
* `<tbl_name>`

    テーブル名を指定します。

### クエリパラメータ

* `with_mv`

    省略可能です。指定しない場合、デフォルトではベーステーブルの構造を返します。指定した場合、すべてのロールアップインデックスも返します。

### リクエストボディ

なし

### レスポンス

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
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema?with_mv=1

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

* data フィールドには、ベーステーブルまたはロールアップテーブルの構造情報が返されます。
