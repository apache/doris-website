---
{
  "title": "メタ情報アクション | Fe Http",
  "language": "ja",
  "description": "クラスターのメタデータ情報（データベースリスト、テーブルリスト、テーブルスキーマを含む）を取得するために使用されます。",
  "sidebar_label": "Meta Info Action"
}
---
# Meta Info Action

## Request

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## Description

クラスターに関するメタデータ情報を取得するために使用されます。データベース一覧、テーブル一覧、テーブルスキーマが含まれます。

    
## Path parameters

* `ns`

    クラスター名を指定します。

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
