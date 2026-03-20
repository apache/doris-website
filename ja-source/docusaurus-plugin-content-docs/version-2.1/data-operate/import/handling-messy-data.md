---
{
  "title": "データ問題の処理",
  "language": "ja",
  "description": "データを読み込む際、ソース列とターゲット列のデータ型が一致しないことがあります。システムはこれらの不一致を修正しようとします。"
}
---
データを読み込む際、ソース列とターゲット列のデータ型が一致しないことがあります。システムはこれらの不一致を修正しようとしますが、型の不正、フィールドが長すぎる、精度の不正などの問題によりエラーが発生する可能性があります。

これらの問題に対処するため、Dorisには2つの主要な設定があります:

- Strict Mode（strict_mode）: エラーのある行を削除するかどうかを決定します。
- Max Filter Ratio（max_filter_ratio）: 読み込み中に削除できるデータの最大許容パーセンテージを設定します。

これにより、データ読み込みの問題を扱いやすくし、データ管理を強固でシンプルに保ちます。

## Strict Mode

Strict modeは主に2つの目的を果たします:
1. 読み込み中に列型変換が失敗したデータ行をフィルタリングする
2. 部分列更新シナリオにおいて、既存の列のみへの更新を制限する

### 列型変換失敗に対するフィルタリング戦略

システムはstrict modeの設定に基づいて異なる戦略を採用します:

- strict modeがOFFの場合: 変換に失敗したフィールドはNULLに設定され、これらのNULL値を含む行は正しいデータ行と一緒に読み込まれます。

- strict modeがONの場合: システムは変換失敗の行をフィルタリングし、正しいデータ行のみを読み込みます。ここで「変換失敗」とは、元のデータがNULLでないにも関わらず、列型変換後にNULLになったケースを特に指します。関数計算によって生成されたNULL値は、この種の変換には含まれないことに注意してください。

- NULL値の処理: 正しいデータ行と異常なデータ行の両方にNULL値が含まれる場合があります。ターゲット列がNOT NULLと定義されている場合、NULL値を含むすべての行がフィルタリングされます。

**1. TinyInt列型の例:**

| 元のデータ型 | 元のデータ例 | TinyInt変換後の値 | Strict Mode | 結果 |
| ----------------- | -------------------- | ----------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                          | ON/OFF      | NULL   |
| Non-NULL          | "abc" or 2000       | NULL                          | ON          | Invalid (Filtered) |
| Non-NULL          | "abc"               | NULL                          | OFF         | NULL    |
| Non-NULL          | 1                   | 1                             | ON/OFF      | Loaded Successfully |

:::tip
1. テーブル内の列はNULL値を許可します

2. `abc`と`2000`の両方は、型や精度の問題によりTinyIntへの変換後にNULLになります。strict modeがONの場合、そのようなデータはフィルタリングされます。OFFの場合、NULLが読み込まれます。
:::

**2. Decimal(1,0)型の例:**

| 元のデータ型 | 元のデータ例 | Decimal変換後の値 | Strict Mode | 結果 |
| ----------------- | -------------------- | ---------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                         | ON/OFF      | NULL   |
| Non-NULL          | aaa                 | NULL                         | ON          | Invalid (Filtered) |
| Non-NULL          | aaa                 | NULL                         | OFF         | NULL    |
| Non-NULL          | 1 or 10             | 1 or 10                      | ON/OFF      | Loaded Successfully |

:::tip
1. テーブル内の列はNULL値を許可します

2. `abc`は型の問題によりDecimalへの変換後にNULLになります。strict modeがONの場合、そのようなデータはフィルタリングされます。OFFの場合、NULLが読み込まれます。

3. `10`は範囲を超えていますが、その型はdecimal要件を満たしているため、strict modeは影響しません。
:::

### 部分列更新を既存列のみに制限

strict modeでは、部分列更新の各行はそのKeyがテーブルに既に存在している必要があります。non-strict modeでは、部分列更新は既存行の更新（Keyが存在する場合）と新しい行の挿入（Keyが存在しない場合）の両方が可能です。

例えば、以下のようなテーブル構造があるとします:

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
テーブルには以下のように1つのレコードが含まれています：

```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time   |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```
strict mode で Insert Into を使用して部分的な列更新を実行する場合、キー `(3)` と `(18)` を持つ2行目と3行目が元のテーブルに存在しないため、挿入は失敗します：

```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = true;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has filtered data in strict mode
```
Insert Into を非厳密モードで使用して部分的な列更新を実行する場合：

```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = false;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```
既存のレコードが更新され、2つの新しいレコードが挿入されます。insert文で指定されていない列については、デフォルト値が定義されている場合はそれが使用され、列がNULL値を許可する場合はNULLが使用され、そうでない場合は挿入が失敗します。

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
### Strict Modeの有効化

Strict mode (strict_mode) はデフォルトでFalseです。異なるロード方法での設定方法は以下の通りです：

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
-H "strict_mode: true" \
-T data.txt \
http://host:port/api/example_db/test_table/_stream_load
```
**Broker Load**

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
**MySQL負荷**

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

Maximum Filter Ratio (max_filter_ratio) は、ロード中にフィルタされたデータと全データの最大許容比率を定義する重要な負荷制御パラメータです。実際のフィルタ比率が設定された最大値を下回る場合、ロードタスクは継続され、フィルタされたデータは無視されます。この比率を超える場合、ロードタスクは失敗します。

### Filter Ratio 計算方法

- Filtered Rows: 品質問題によりフィルタされたデータ。型エラー、精度エラー、文字列長の制限超過、ファイル列数の不一致、対応するパーティションが見つからないためにフィルタされた行を含みます。

- Unselected Rows: [Pre-filtering](./load-data-convert.md#pre-filtering) または [Post-filtering](./load-data-convert.md#post-filtering) 条件によりフィルタされたデータ行。

- Loaded Rows: 正常にロードされたデータ行。

filter ratio は次のように計算されます：

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```
`Unselected Rows`はフィルタ比率の計算に含まれないことに注意してください。

### 最大フィルタ比率の設定
最大フィルタ比率（max_filter_ratio）のデフォルト値は0で、フィルタされたデータは許可されないことを意味します。異なるロード方法での設定方法は以下の通りです：

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
-H "max_filter_ratio: 0.1" \
-T data.txt \
http://host:port/api/example_db/test_table/_stream_load
```
**Broker Load**

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
**MySQL負荷**

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
