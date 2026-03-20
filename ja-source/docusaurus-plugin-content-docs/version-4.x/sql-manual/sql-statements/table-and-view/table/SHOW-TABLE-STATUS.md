---
{
  "title": "SHOW TABLE STATUS",
  "description": "この文は、tableまたはビューに関する情報を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、tableまたはビューに関する情報を表示するために使用されます。

## 構文

```sql
SHOW TABLE STATUS [ FROM [ <catalog_name>.]<db_name> ] [ LIKE <like_condition> ]
```
## オプションパラメータ

**1. ` FROM [ <catalog_name>.]<db_name>`**
> FROM句でクエリ対象のカタログ名とデータベース名を指定できます。

**2. `LIKE <like_condition>`**
> LIKE句でTable名に基づくあいまい検索を実行できます。

## 戻り値

| Column              | DataType | 注釈                                                                                                                                                                                                                     |
|:--------------------|:---------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Name                | String   | Table名                                                                                                                                                                                                                |
| Engine              | String   | Tableのストレージエンジン                                                                                                                                                                              |
| Version             | String   | バージョン                                                                                                                                                                                                                   |
| Row_format          | String   | 行フォーマット。MyISAMエンジンの場合、Dynamic、Fixed、またはCompressedの場合があります。Dynamic行はVarcharやBlobタイプフィールドのような可変長です。Fixed行はCharやIntegerタイプフィールドのような固定長です。 |
| Rows                | String   | Table内の行数。非トランザクショナルTableの場合、この値は正確です。トランザクショナルエンジンの場合、この値は通常推定値です。                                                                               |
| Avg_row_length      | Integer  | 行あたりの平均バイト数                                                                                                                                                                           |
| Data_length         | Integer  | Table全体のデータ量（バイト単位）                                                                                                                                                                         |
| Max_data_length     | Integer  | Tableが保持できるデータの最大量                                                                                                                                                                          |
| Index_length        | Integer  | インデックスが占有するディスク容量                                                                                                                                                             |
| Data_free           | Integer  | MyISAMエンジンの場合、割り当て済みだが現在未使用の領域を識別し、削除された行の領域を含みます。                                                                                           |
| Auto_increment      | Integer  | 次のAuto_incrementの値                                                                                                                                                                                      |
| Create_time         | Datetime | Tableの作成時刻                                                                                                                                                                            |
| Update_time         | Datetime | Tableの最終更新時刻                                                                                                                                                                         |
| Check_time          | Datetime | check tableまたはmyisamchkツールを使用してTableをチェックした最終時刻                                                                                                                                                  |
| Collation           | String   | Tableのデフォルト文字セット、現在はutf-8のみサポート                                                                                                                                                     |
| Checksum            | String   | 有効な場合、Table全体のコンテンツに対して計算されるチェックサム                                                                                                                                                          |
| Create_options      | String   | Table作成時のその他すべてのオプションを参照                                                                                                                                                                     |
| Comment             | String   | Tableコメント                                                                                                                                                                                             |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈 |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Table, View | 現在この操作を実行するには**ADMIN**権限のみサポートしています |

## 使用上の注意事項

- このステートメントは主にMySQL構文との互換性のために使用されます。現在、Commentなどの少量の情報のみが表示されます。

## 例

- 現在のデータベース内のすべてのTableの情報を表示

    ```sql
    SHOW TABLE STATUS
    ```
    ```text
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | Name       | Engine | Version | Row_format | Rows | Avg_row_length | Data_length | Max_data_length | Index_length | Data_free | Auto_increment | Create_time         | Update_time         | Check_time | Collation | Checksum | Create_options | Comment |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | test_table | Doris  |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:45:36 | 2025-01-22 11:45:36 | NULL       | utf-8     |     NULL | NULL           |         |
    | test_view  | View   |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:46:32 | NULL                | NULL       | utf-8     |     NULL | NULL           |         |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    ```
指定されたデータベース配下で、名前にexampleを含むTableの情報を表示する

    ```sql
    SHOW TABLE STATUS FROM db LIKE "%test%"
    ```
    ```text
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | Name       | Engine | Version | Row_format | Rows | Avg_row_length | Data_length | Max_data_length | Index_length | Data_free | Auto_increment | Create_time         | Update_time         | Check_time | Collation | Checksum | Create_options | Comment |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | test_table | Doris  |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:45:36 | 2025-01-22 11:45:36 | NULL       | utf-8     |     NULL | NULL           |         |
    | test_view  | View   |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:46:32 | NULL                | NULL       | utf-8     |     NULL | NULL           |         |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    ```
