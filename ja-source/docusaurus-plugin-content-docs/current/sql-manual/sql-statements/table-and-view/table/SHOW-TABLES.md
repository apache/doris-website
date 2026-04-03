---
{
  "title": "SHOW TABLES",
  "language": "ja",
  "description": "このステートメントは、現在のdbの下にあるすべてのテーブルとビューを表示するために使用されます。"
}
---
## 説明

このステートメントは、現在のdb配下のすべてのテーブルとビューを表示するために使用されます。

## 構文

```sql
SHOW [ FULL ] TABLES [ FROM [ <catalog_name>.]<db_name> ][ LIKE <like_condition> ]
```
## オプションパラメータ

**1. `FULL`**
> このパラメータがステートメントに追加された場合、返される結果にはTable_type（テーブルタイプ）、Storage_format（ストレージフォーマット）、Inverted_index_storage_format（転置インデックスストレージフォーマット）という3つの列が追加されます。

**2. `FROM [ <catalog_name>.]<db_name>`**
> FROM句では、クエリ対象のカタログ名とデータベース名を指定できます。

**2. `LIKE <like_condition>`**
> LIKE句では、テーブル名に基づいてあいまい検索を実行できます。

## 戻り値

| Column name (Column) | Type (DataType) | Notes (Notes) |
|:--------------------|:-------------|:----------------------------|
| Tables_in_<db_name> | String | `<db_name>`が配置されているデータベース下のすべてのテーブルとビュー。 |
| Table_type | String | テーブルとビューのタイプ。 |
| Storage_format | String | テーブルとビューのストレージフォーマット。 |
| Inverted_index_storage_format | String | テーブルとビューの転置インデックスストレージフォーマット。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持っている必要があります：

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
|:--------------|:-----------|:------------------|
| SELECT_PRIV | Table (Table), View (View) | クエリ権限を持つテーブルとビューのみが表示可能です。 |

## 使用上の注意

- ステートメントでFROM句が指定されていない場合、実行のために対応するデータベースを使用する必要があります。

## 例

- DB下のすべてのテーブルを表示

     ```sql
     SHOW TABLES;
     ```
     ```text
     +---------------------------------+
     | Tables_in_demo                  |
     +---------------------------------+
     | ads_client_biz_aggr_di_20220419 |
     | cmy1                            |
     | cmy2                            |
     | intern_theme                    |
     | left_table                      |
     +---------------------------------+
     ```
- テーブル名による曖昧検索

     ```sql
     SHOW TABLES LIKE '%cm%'
     ```
     ```text
     +----------------+
     | Tables_in_demo |
     +----------------+
     | cmy1           |
     | cmy2           |
     +----------------+
     ```
- FULLを使用してdb配下のテーブルとビューをクエリする

     ```sql
     SHOW FULL TABLES
     ```
     ```text
     +----------------+------------+----------------+-------------------------------+
     | Tables_in_demo | Table_type | Storage_format | Inverted_index_storage_format |
     +----------------+------------+----------------+-------------------------------+
     | test_table     | BASE TABLE | V2             | V1                            |
     | test_view      | VIEW       | NONE           | NONE                          |
     +----------------+------------+----------------+-------------------------------+
     ```
