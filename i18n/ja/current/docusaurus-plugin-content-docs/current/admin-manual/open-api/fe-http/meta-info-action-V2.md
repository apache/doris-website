---
{
  "title": "Meta Info Action V2 | Fe Http",
  "language": "ja",
  "description": "クラスターに関するメタデータ情報（データベース一覧、テーブル一覧、テーブルschemaを含む）を取得するために使用されます。",
  "sidebar_label": "Meta Info Action V2"
}
---
# Meta Info Action

## Request

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## Description

データベース一覧、テーブル一覧、テーブルスキーマを含む、クラスターに関するメタデータ情報を取得するために使用されます。

    
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
