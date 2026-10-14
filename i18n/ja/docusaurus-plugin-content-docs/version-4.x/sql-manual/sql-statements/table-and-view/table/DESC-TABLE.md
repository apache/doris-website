---
{
    "title": "DESCRIBE",
    "language": "ja",
    "description": "このステートメントは、指定したテーブルのスキーマ情報を表示します。"
}
---

## 説明

このステートメントは、指定したテーブルのスキーマ情報を表示します。

## 構文

```sql
DESC[RIBE] [<ctl_name>.][<db_name>.]<table_name> [ALL];
```
## 必須パラメータ

**1.`<table_name>`**

> テーブルの識別子（名前）を指定します。同じデータベース内で一意である必要があります。
>
> 識別子は英字（Unicode 名のサポートが有効な場合は任意の言語の文字）で始まる必要があります。識別子全体をバッククォートで囲む場合（例：`My Object`）を除き、空白や特殊文字は使用できません。
>
> 予約語は識別子として使用できません。
>
> 詳細については、識別子の要件と予約語を参照してください。

## 省略可能なパラメータ

**1.`<ctl_name>.<db_name>`**

> データカタログとデータベースの識別子（名前）を指定します。
>
> 識別子は英字（Unicode 名のサポートが有効な場合は任意の言語の文字）で始まる必要があります。識別子全体をバッククォートで囲む場合（例：`My Database`）を除き、空白や特殊文字は使用できません。
>
> 予約語は識別子として使用できません。
>
> 詳細については、識別子の要件と予約語を参照してください。

**2.`ALL`**

> 内部テーブルにのみ指定できます。内部テーブルのすべてのインデックス情報を返します。

## 戻り値

`ALL` を指定しない場合、以下の列を返します。

| 列 | 説明 |
| -- |--------------|
| Field | カラム名 |
| Type | データ型 |
| Null | NULL 値を許可するかどうか |
| Key | キーカラムかどうか |
| Default | デフォルト値 |
| Extra | 追加情報を表示 |

バージョン 3.0.7 で、セッション変数 `show_column_comment_in_describe` が追加されました。`true` に設定すると、カラムのコメント情報を表示する `Comment` 列が追加されます。

内部テーブルに対して `ALL` を指定した場合、以下の列を返します。

| 列 | 説明 |
| -- |--------------|
| IndexName | テーブル名 |
| IndexKeysType | テーブルモデル |
| Field | カラム名 |
| Type | データ型 |
| Null | NULL 値を許可するかどうか |
| Key | キーカラムかどうか |
| Default | デフォルト値 |
| Extra | 追加情報を表示 |
| Visible | 表示されるかどうか |
| DefineExpr | 定義式 |
| WhereClause | フィルター条件に関する定義 |

## 権限制御

この SQL コマンドを実行するには、少なくとも以下の権限が必要です。

| 権限 | 対象 | 備考 |
|:--------------| :------------- |:---------------------------------------------|
| SELECT_PRIV   | テーブル    | DESC の実行時には、照会対象のテーブルに対する SELECT_PRIV 権限が必要です |


## 例

準備：以下の例で使用する `test_table` を作成します。

```sql
CREATE TABLE test_table (
  user_id BIGINT NOT NULL COMMENT 'Key1',
  name    VARCHAR(20)     COMMENT 'username',
  age     INT             COMMENT 'user_age'
) ENGINE=OLAP
UNIQUE KEY (user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

1. テーブルの基本スキーマを表示する

```sql
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+
| Field   | Type        | Null | Key   | Default | Extra |
+---------+-------------+------+-------+---------+-------+
| user_id | bigint      | No   | true  | NULL    |       |
| name    | varchar(20) | Yes  | false | NULL    | NONE  |
| age     | int         | Yes  | false | NULL    | NONE  |
+---------+-------------+------+-------+---------+-------+
```

`show_column_comment_in_describe = true`（3.0.7 で導入）に設定すると、出力に `Comment` 列が追加されます。

```sql
SET show_column_comment_in_describe=true;
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+----------+
| Field   | Type        | Null | Key   | Default | Extra | Comment  |
+---------+-------------+------+-------+---------+-------+----------+
| user_id | bigint      | No   | true  | NULL    |       | Key1     |
| name    | varchar(20) | Yes  | false | NULL    | NONE  | username |
| age     | int         | Yes  | false | NULL    | NONE  | user_age |
+---------+-------------+------+-------+---------+-------+----------+
```

2. テーブルのすべてのインデックスのスキーマを表示する

```sql
DESC test_table ALL;
```

```text
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName  | IndexKeysType | Field   | Type        | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| test_table | UNIQUE_KEYS   | user_id | bigint      | bigint       | No   | true  | NULL    |       | true    |            |             |
|            |               | name    | varchar(20) | varchar(20)  | Yes  | false | NULL    | NONE  | true    |            |             |
|            |               | age     | int         | int          | Yes  | false | NULL    | NONE  | true    |            |             |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
```
