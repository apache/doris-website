---
{
  "title": "データ問題の処理",
  "description": "データを読み込む際、ソース列とターゲット列のデータ型が一致しない場合があります。システムはこれらの不整合を修正しようとします。",
  "language": "ja"
}
---
データをロードする際、ソース列とターゲット列のデータ型が一致しないことがあります。システムはこれらの不一致を修正しようとしますが、間違った型、フィールドが長すぎる、または精度が間違っているなどの問題によりエラーが発生する可能性があります。

これらの問題に対処するため、Dorisには2つの重要な設定があります：

- Strict Mode (strict_mode)：エラーのある行を除去するかどうかを決定します。
- Max Filter Ratio (max_filter_ratio)：ロード中に除去できるデータの最大許可割合を設定します。

これにより、データロードの問題をより簡単に処理でき、データ管理を強固でシンプルに保つことができます。

## Strict Mode

Strict modeには2つの主要な目的があります：
1. ロード中に列の型変換が失敗したデータ行をフィルタリングする
2. 部分列更新シナリオにおいて既存の列のみへの更新を制限する（3.0.x以前では、3.1.0以降はこの動作はload property/session var `partial_update_new_key_behavior`によって制御されます）

### 列型変換失敗のフィルタリング戦略

システムはstrict modeの設定に基づいて異なる戦略を採用します：

- strict modeがOFFの場合：変換に失敗したフィールドはNULLに設定され、これらのNULL値を含む行は正しいデータ行と共にロードされます。

- strict modeがONの場合：システムは変換失敗した行をフィルタリングし、正しいデータ行のみをロードします。ここで「変換失敗」とは、元のデータがnon-NULLであるが列型変換後にNULLになるケースを特に指します。関数計算によって生じるNULL値は、この種の変換には含まれないことに注意してください。

- NULL値の処理：正しいデータ行と異常なデータ行の両方にNULL値が含まれる場合があります。ターゲット列がNOT NULLとして定義されている場合、NULL値を含むすべての行がフィルタリングされます。

**1. TinyInt列型の例：**

| 元のデータ型 | 元のデータ例 | TinyInt変換後の値 | Strict Mode | 結果 |
| ----------------- | -------------------- | ----------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                          | ON/OFF      | NULL   |
| Non-NULL          | "abc" or 2000       | NULL                          | ON          | Invalid (Filtered) |
| Non-NULL          | "abc"               | NULL                          | OFF         | NULL    |
| Non-NULL          | 1                   | 1                             | ON/OFF      | Loaded Successfully |

:::tip
1. table内の列はNULL値を許可します

2. `abc`と`2000`の両方が型や精度の問題によりTinyIntへの変換後にNULLになります。strict modeがONの場合、そのようなデータはフィルタリングされます。OFFの場合、NULLがロードされます。
:::

**2. Decimal(1,0)型の例：**

| 元のデータ型 | 元のデータ例 | Decimal変換後の値 | Strict Mode | 結果 |
| ----------------- | -------------------- | ---------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                         | ON/OFF      | NULL   |
| Non-NULL          | aaa                 | NULL                         | ON          | Invalid (Filtered) |
| Non-NULL          | aaa                 | NULL                         | OFF         | NULL    |
| Non-NULL          | 1 or 10             | 1 or 10                      | ON/OFF      | Loaded Successfully |

:::tip
1. table内の列はNULL値を許可します

2. `abc`は型の問題によりDecimalへの変換後にNULLになります。strict modeがONの場合、そのようなデータはフィルタリングされます。OFFの場合、NULLがロードされます。

3. `10`は範囲を超えていますが、その型がdecimalの要件を満たしているため、strict modeはそれに影響しません。
:::

### 部分列更新を既存列のみに制限

:::tip
3.0.x以前では、3.1.0以降はこの動作はload property/session var `partial_update_new_key_behavior`によって制御されます
:::

strict modeでは、部分列更新における各行は、そのKeyがtableに既に存在している必要があります。non-strict modeでは、部分列更新は既存行の更新（Keyが存在する場合）と新規行の挿入（Keyが存在しない場合）の両方を行うことができます。

例えば、以下のようなtable構造が与えられた場合：

```sql
CREATE TABLE user_profile
(
    id               INT,
    name             VARCHAR(10),
    age              INT,
    city             VARCHAR(10),
    balance          DECIMAL(9, 0),
    last_access_time DATETIME
) ENGINE=OLAP
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```
Tableには以下のように1つのレコードが含まれています：

```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time   |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```
strict modeでInsert Intoを使用して部分的な列更新を実行する場合、キー`(3)`と`(18)`を持つ2番目と3番目の行が元のTableに存在しないため、挿入は失敗します：

```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = true;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has filtered data in strict mode
```
non-strict mode で Insert Into を使用して部分的な列更新を実行する場合：

```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = false;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```
既存のレコードが更新され、2つの新しいレコードが挿入されます。insert文で指定されていない列については、デフォルト値が定義されている場合はそれが使用され、列がNULL値を許可している場合はNULLが使用されます。それ以外の場合、挿入は失敗します。

クエリ結果は以下の通りです：

```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|    3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
|   18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+------+-------+------+----------+---------+---------------------+
```
### Strict Modeを有効にする

Strict mode（strict_mode）のデフォルト値はFalseです。異なるロード方法でこれを設定する方法は以下の通りです：

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
-H "strict_mode: true" \
-T data.txt \
http://host:port/api/example_db/test_table/_stream_load
```
**ブローカー負荷**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "strict_mode" = "true"
);
```
**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA (...);
```
**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "strict_mode" = "true"
);
```
**Insert Into**

```sql
SET enable_insert_strict = true;
INSERT INTO test_table ...;
```
## Maximum Filter Ratio

Maximum Filter Ratio (max_filter_ratio) は、ロード中のフィルタされたデータと総データの最大許容比を定義する重要な負荷制御パラメータです。実際のフィルタ比が設定された最大値を下回る場合、ロードタスクは継続され、フィルタされたデータは無視されます。この比を超える場合、ロードタスクは失敗します。

### Filter Ratio 計算方法

- Filtered Rows: 品質問題によりフィルタされたデータ。型エラー、精度エラー、文字列長の制限超過、ファイル列数の不一致、対応するパーティションが存在しないことによりフィルタされた行を含みます。

- Unselected Rows: Pre-filtering または Post-filtering 条件によりフィルタされたデータ行。

- Loaded Rows: 正常にロードされたデータ行。

フィルタ比は次のように計算されます：

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```
`Unselected Rows`はフィルター比率の計算には含まれないことに注意してください。

### 最大フィルター比率の設定
最大フィルター比率（max_filter_ratio）のデフォルト値は0で、これはフィルターされたデータが許可されないことを意味します。異なるロード方式での設定方法は以下の通りです：

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
-H "max_filter_ratio: 0.1" \
-T data.txt \
http://host:port/api/example_db/test_table/_stream_load
```
**ブローカー負荷**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```
**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
)
FROM KAFKA (...);
```
**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```
**Insert Into**

```sql
SET insert_max_filter_ratio = 0.1;
INSERT INTO test_table FROM S3/HDFS/LOCAL();```

:::tip
For Insert Into statements, `insert_max_filter_ratio` only takes effect when `enable_insert_strict = false`, and only applies to `INSERT INTO FROM S3/HDFS/LOCAL()` syntax. The default value is 1.0, which means that all abnormal data are allowed to be filtered.
:::
