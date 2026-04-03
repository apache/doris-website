---
{
  "title": "メタ情報アクション | Fe Http",
  "language": "ja",
  "description": "クラスターに関するメタデータ情報（データベースリスト、テーブルリスト、テーブルスキーマを含む）を取得するために使用されます。",
  "sidebar_label": "Meta Info Action"
}
---
# Meta Info Action

## Request

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## 詳細

データベース一覧、テーブル一覧、テーブルschemaを含む、クラスタに関するメタデータ情報を取得するために使用されます。

    
## Path parameters

* `ns`

    クラスタ名を指定します。

* `db`

    データベース名を指定します。

* `tbl`

    テーブル名を指定します。

## Query parameters

なし

## Request body

なし

## Response

```
{
    "msg":"success",
    "code":0,
    "data":["database list" / "table list" / "table schema"],
    "count":0
}
```
