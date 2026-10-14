---
{
    "title": "メタ情報の取得（Meta Info Action V2） | FE HTTP",
    "language": "ja",
    "description": "データベース一覧、テーブル一覧、テーブルスキーマなど、クラスターのメタデータ情報を取得します。",
    "sidebar_label": "メタ情報の取得（Meta Info Action V2）"
}
---

# メタ情報の取得（Meta Info Action）

## リクエスト

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## 説明

データベース一覧、テーブル一覧、テーブルスキーマなど、クラスターのメタデータ情報を取得します。

    
## パスパラメータ

* `ns`

    クラスター名を指定します。

* `db`

    データベース名を指定します。

* `tbl`

    テーブル名を指定します。

## クエリパラメータ

なし

## リクエストボディ

なし

## レスポンス

```
{
    "msg":"success",
    "code":0,
    "data":["database list" / "table list" / "table schema"],
    "count":0
}
```
