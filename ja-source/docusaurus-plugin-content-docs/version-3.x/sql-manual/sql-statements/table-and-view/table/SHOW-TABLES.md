---
{
  "title": "SHOW TABLES",
  "description": "この文は、現在のdb配下のすべてのtableとビューを表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、現在のdb配下のすべてのtableとビューを表示するために使用されます。

## 構文

```sql
SHOW [ FULL ] TABLES [ FROM [ <catalog_name>.]<db_name> ][ LIKE <like_condition> ]
```
## オプションパラメータ

**1. `FULL`**
> このパラメータをステートメントに追加すると、返される結果にTable_type（Tableタイプ）、Storage_format（ストレージフォーマット）、Inverted_index_storage_format（転置インデックスストレージフォーマット）の3つの列が追加されます。

**2. `FROM [ <catalog_name>.]<db_name>`**
> FROM句では、クエリ対象のカタログ名とデータベース名を指定できます。

**2. `LIKE <like_condition>`**
> LIKE句では、Table名に基づいてあいまい検索を実行できます。

## 戻り値

| Column name (Column) | タイプ (DataType) | 注釈 (注釈) |
|:--------------------|:-------------|:----------------------------|
| Tables_in_<db_name> | String | `<db_name>`が配置されているデータベース下のすべてのTableとビュー。 |
| Table_type | String | Tableとビューのタイプ。 |
| Storage_format | String | Tableとビューのストレージフォーマット。 |
| Inverted_index_storage_format | String | Tableとビューの転置インデックスストレージフォーマット。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege (Privilege) | Object (Object) | 注釈 (注釈) |
|:--------------|:-----------|:------------------|
| SELECT_PRIV | Table (Table), View (View) | クエリ権限を持つTableとビューのみ表示できます。 |

## 使用上の注意

- ステートメントでFROM句が指定されていない場合、実行には対応するデータベースを使用する必要があります。

## 例

- DB下のすべてのTableを表示

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
- Table名による曖昧検索

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
- db配下のTableとビューをクエリするにはFULLを使用する

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
