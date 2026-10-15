---
{
    "title": "SHOW TABLES",
    "language": "ja",
    "description": "現在のデータベースにあるすべてのテーブルとビューを表示します。"
}
---

## 説明

現在のデータベースにあるすべてのテーブルとビューを表示します。

## 構文

```sql
SHOW [ FULL ] TABLES [ FROM [ <catalog_name>.]<db_name> ][ LIKE <like_condition> ]
```

## 任意パラメータ

**1. `FULL`**
> このパラメータを追加すると、結果に Table_type（テーブル種別）、Storage_format（ストレージ形式）、Inverted_index_storage_format（転置インデックスのストレージ形式）の三つの列が追加されます。

**2. `FROM [ <catalog_name>.]<db_name>`**
> FROM 句で照会するカタログ名とデータベース名を指定できます。

**2. `LIKE <like_condition>`**
> LIKE 句でテーブル名を条件とするあいまい検索ができます。

## 戻り値

| 列名（Column） | 型（DataType） | 説明（Notes） |
|:--------------------|:-------------|:----------------------------|
| Tables_in_<db_name> | String | `<db_name>` で指定したデータベース内のすべてのテーブルとビュー。 |
| Table_type | String | テーブルまたはビューの種別。 |
| Storage_format | String | テーブルまたはビューのストレージ形式。 |
| Inverted_index_storage_format | String | テーブルまたはビューの転置インデックスのストレージ形式。 |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限（Privilege） | 対象（Object） | 説明（Notes） |
|:--------------|:-----------|:------------------|
| SELECT_PRIV | テーブル（Table）、ビュー（View） | クエリ権限のあるテーブルとビューのみを表示できます。 |

## 使用上の注意

- FROM 句を省略する場合は、事前に対象のデータベースを選択する必要があります。

## 例

- データベース内のすべてのテーブルを表示します

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

- テーブル名であいまい検索します

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

- FULL を使用してデータベース内のテーブルとビューを照会します

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

