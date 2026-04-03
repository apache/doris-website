---
{
  "title": "データ問題の処理",
  "language": "ja",
  "description": "データを読み込む際、ソースとターゲットの列のデータ型が一致しないことがあります。システムはこれらの不一致を修正しようとします。"
}
---
データをロードする際、ソース列とターゲット列のデータ型が一致しない場合があります。システムはこれらの不一致を修正しようとしますが、間違った型、長すぎるフィールド、または間違った精度などの問題がエラーを引き起こす可能性があります。

これらの問題に対処するため、Dorisには2つの重要な設定があります：

- Strict Mode（strict_mode）：エラーのある行を削除するかどうかを決定します。
- Max Filter Ratio（max_filter_ratio）：ロード中に削除できるデータの最大許容パーセンテージを設定します。

これにより、データロードの問題をより簡単に処理でき、データ管理を強固かつシンプルに保つことができます。

## Strict Mode

strict modeの主な機能は、ロード中に列の型変換が失敗したデータ行をフィルタリングすることです。

### 列の型変換失敗に対するフィルタリング戦略

システムはstrict modeの設定に基づいて異なる戦略を採用します：

- strict modeがOFFの場合：変換に失敗したフィールドはNULLに設定され、これらのNULL値を含む行が正しいデータ行と一緒にロードされます。

- strict modeがONの場合：システムは変換に失敗した行をフィルタリングし、正しいデータ行のみをロードします。ここで「変換失敗」とは、元のデータがnon-NULLであるが列の型変換後にNULLになるケースを特に指します。なお、関数計算によるNULL値はこの種の変換には含まれません。

- NULL値の処理：正しいデータ行と異常なデータ行の両方にNULL値が含まれる場合があります。ターゲット列がNOT NULLとして定義されている場合、NULL値を含むすべての行がフィルタリングされます。

**1. TinyInt列型の例：**

| Original Data タイプ | Original Data Example | Value After TinyInt Conversion | Strict Mode | Result |
| ----------------- | -------------------- | ----------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                          | ON/OFF      | NULL   |
| Non-NULL          | "abc" or 2000       | NULL                          | ON          | Invalid (Filtered) |
| Non-NULL          | "abc"               | NULL                          | OFF         | NULL    |
| Non-NULL          | 1                   | 1                             | ON/OFF      | Loaded Successfully |

:::tip
1. テーブルの列はNULL値を許可します

2. `abc`と`2000`の両方は、型または精度の問題によりTinyIntへの変換後にNULLになります。strict modeがONの場合、このようなデータはフィルタリングされます。OFFの場合、NULLがロードされます。
:::

**2. Decimal(1,0)型の例：**

| Original Data タイプ | Original Data Example | Value After Decimal Conversion | Strict Mode | Result |
| ----------------- | -------------------- | ---------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                         | ON/OFF      | NULL   |
| Non-NULL          | aaa                 | NULL                         | ON          | Invalid (Filtered) |
| Non-NULL          | aaa                 | NULL                         | OFF         | NULL    |
| Non-NULL          | 1 or 10             | 1 or 10                      | ON/OFF      | Loaded Successfully |

:::tip
1. テーブルの列はNULL値を許可します

2. `abc`は型の問題によりDecimalへの変換後にNULLになります。strict modeがONの場合、このようなデータはフィルタリングされます。OFFの場合、NULLがロードされます。

3. `10`は範囲を超えていますが、その型がdecimalの要件を満たすため、strict modeは影響しません。
:::

### Strict Modeの有効化

Strict Mode（strict_mode）はデフォルトでFalseです。異なるロード方法での設定方法は以下の通りです：

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

Maximum Filter Ratio (max_filter_ratio) は、ロード中にフィルタリングされたデータと全データの最大許容比率を定義する重要な負荷制御パラメータです。実際のフィルタ比率が設定された最大値を下回る場合、ロードタスクは継続され、フィルタリングされたデータは無視されます。この比率を超える場合、ロードタスクは失敗します。

### Filter Ratio の計算方法

- Filtered Rows: 品質問題によりフィルタリングされたデータ。型エラー、精度エラー、文字列長の制限超過、ファイル列数の不一致、対応するパーティションが存在しないためにフィルタリングされた行が含まれます。

- Unselected Rows: [Pre-filtering](./load-data-convert.md#pre-filtering) または [Post-filtering](./load-data-convert.md#post-filtering) 条件によりフィルタリングされたデータ行。

- Loaded Rows: 正常にロードされたデータ行。

filter ratio は次のように計算されます：

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```
`Unselected Rows`はフィルタ率の計算に含まれないことに注意してください。

### 最大フィルタ率の設定
最大フィルタ率（max_filter_ratio）のデフォルト値は0で、フィルタされたデータは許可されないことを意味します。異なるロード方式での設定方法は以下の通りです：

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
-H "max_filter_ratio: 0.1" \
-T data.txt \
http://host:port/api/example_db/test_table/_stream_load
```
**Broker負荷**

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
