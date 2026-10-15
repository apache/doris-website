---
{
    "title": "DESC FUNCTION",
    "language": "ja",
    "description": "DESC FUNCTION を使用して、指定したテーブル値関数のスキーマ情報を取得します。"
}
---

## 説明

DESC FUNCTION ステートメントを使用して、指定したテーブル値関数のスキーマ情報を取得します。

## 構文

```sql
DESC FUNCTION <table_valued_function>
```

## 必須パラメータ

**<table_valued_function>**

> テーブル値関数の名前を指定します（例: CATALOGS）。サポートされているテーブル値関数の一覧については、[テーブル値関数](https://doris.apache.org/docs/dev/lakehouse/file-analysis)を参照してください。

## 例

テーブル値関数 CATALOGS の情報を照会します。

```sql
DESC FUNCTION catalogs();
```

結果は次のとおりです。

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```
