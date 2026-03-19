---
{
  "title": "部分カラム更新",
  "language": "ja",
  "description": "この文書では、Unique Key ModelとAggregate Key Modelテーブルにおいて、Dorisで部分的なカラム更新を実行する方法について説明します。"
}
---
部分カラム更新では、すべてのフィールドを変更することなく、テーブル内の特定のフィールドを更新できます。このドキュメントでは、Unique Key ModelとAggregate Key Modelの両方のテーブルに対して部分カラム更新を実行する方法を説明します。

## 概要

部分カラム更新は、行全体を更新するのではなく、テーブル行の特定のカラムのみを更新できる機能です。これは特に以下の場合に有用です：

- リアルタイム動的カラム更新で、テーブル内の特定のフィールドの頻繁な更新が必要な場合。例えば、広告・推薦システムでリアルタイム分析と意思決定のために、ユーザータグテーブルで最新のユーザー行動に関連するフィールドを更新する場合。
- 複数のソーステーブルを1つの大きなワイドテーブルに統合する場合。
- データ修正。

## Unique Key Modelの部分カラム更新

Dorisは、unique key modelの読み込み更新において、最初に行全体を読み取る必要を回避して部分カラムデータを直接挿入または更新する機能を提供し、更新効率を大幅に向上させます。

:::caution Note

1. バージョン2.0では、Unique KeyのMerge-on-Write実装での部分カラム更新のみをサポートしています。
2. バージョン2.0.2以降、INSERT INTOを使用した部分カラム更新がサポートされています。
3. 同期マテリアライズドビューを持つテーブルでは部分カラム更新はサポートされていません。
4. スキーマ変更を実行中のテーブルでは部分カラム更新は許可されていません。
:::

### 使用例

Dorisに注文テーブル`order_tbl`があり、注文idがKeyカラム、注文ステータスと注文金額がValueカラムであるとします。データステータスは以下の通りです：

| Order id | Order Amount | Order Status |
| -------- | -------------| -------------|
| 1        | 100          | Pending Payment |

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | Pending Payment |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```
ユーザーが支払いをクリックした後、Dorisシステムは注文ID '1'の注文のステータスを'Pending Shipment'に変更する必要があります。

### Loadメソッドを使用した部分列更新

#### StreamLoad/BrokerLoad/RoutineLoad

以下のCSVファイルを準備します：

```
1,Pending Shipment
```
読み込み時に以下のヘッダーを追加します：

```sql
partial_columns:true
```
`columns`で読み込む列を指定してください（すべてのキー列を含む必要があります）。以下はStream Loadの例です：

```sql
curl --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```
#### INSERT INTO

すべてのデータモデルにおいて、部分的な列が指定された場合の`INSERT INTO`のデフォルト動作は、行全体を書き込むことです。誤用を防ぐため、Merge-on-Write実装では、`INSERT INTO`はデフォルトで行全体のUPSERTのセマンティクスを維持します。部分的な列の更新を有効にするには、次のセッション変数を設定してください：

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending Shipment');
```
#### Flink Connector

Flink Connectorを使用する場合は、以下の設定を追加してください：

```sql
'sink.properties.partial_columns' = 'true',
```
`sink.properties.column`でロードする列を指定します（すべてのキー列を含める必要があります）。

### 更新結果

更新後の結果は以下の通りです：

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | Pending Shipment |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```
### 使用上の注意

Merge-on-Write実装は最適なクエリパフォーマンスを確保するために書き込み時に完全なデータ行を完成させる必要があるため、部分的な列更新に使用すると部分ロードのパフォーマンスが低下する可能性があります。

パフォーマンス最適化の提案:

- NVMeまたは高速SSDクラウドディスクを搭載したSSDを使用してください。データの完成時に大量の履歴データを読み取り、高い読み取りIOPSとスループットが発生するためです。
- 行ストレージを有効にすることで、データ完成時に発生するIOPSを削減し、ロードパフォーマンスを大幅に改善できます。テーブル作成時に以下のプロパティを設定して行ストレージを有効にしてください:

```Plain
"store_row_column" = "true"
```
現在、同一バッチデータ書き込みタスク（loadタスクまたは`INSERT INTO`のいずれか）内のすべての行は、同じ列のみを更新できます。異なる列でデータを更新するには、異なるバッチで書き込んでください。

### 柔軟な部分列更新

以前、Dorisの部分更新機能では、インポート内のすべての行が同じ列を更新する必要がありました。現在、Dorisは単一インポート内の各行が異なる列を更新できる、より柔軟な部分更新方法をサポートしています（3.1.0以降でサポート）。

:::caution Note:

1. 柔軟な列更新は、Stream Load、Routine Load、およびStream Loadを使用するツール（例：Doris-Flink-Connector）でサポートされています。
2. 柔軟な列更新を使用する場合、インポートファイルはJSON形式である必要があります。
:::

#### 適用可能なシナリオ

CDCを使用してデータベースシステムからDorisにリアルタイムでデータを同期する際、ソースシステムが出力するレコードには完全な行データが含まれていない場合があり、主キーと更新された列の値のみが含まれます。このような場合、時間ウィンドウ内のデータバッチで更新される列が異なる可能性があります。柔軟な列更新を使用してDorisにデータをインポートできます。

#### 使用方法

**既存テーブルでの柔軟な列更新の有効化**

Dorisの古いバージョンで作成された既存のMerge-On-Writeテーブルについて、アップグレード後に次のコマンドを使用して柔軟な部分更新を有効にできます：`ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";`。このコマンドを実行後、`show create table db1.tbl1`の結果に`"enable_unique_key_skip_bitmap_column" = "true"`が含まれていれば、機能が正常に有効化されています。事前に対象テーブルでlight-schema-change機能が有効になっていることを確認してください。

**新規テーブルでの柔軟な列更新の使用**

新規テーブルで柔軟な列更新機能を使用するには、テーブル作成時に以下のテーブルプロパティを指定してMerge-on-Writeを有効にし、柔軟な列更新に必要な隠し bitmap列を含めてください：

```Plain
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```
**StreamLoad**

Stream Loadを使用する場合は、以下のヘッダーを追加してください：

```Plain
unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS
```
**Flink Doris Connector**

Flink Doris Connectorを使用する場合は、以下の設定を追加してください：

```Plain
'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'
```
**Routine Load**

Routine Loadを使用する場合は、`PROPERTIES`句に以下のプロパティを追加してください：

```sql
CREATE ROUTINE LOAD db1.job1 ON tbl1
PROPERTIES (
    "format" = "json",
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
)
FROM KAFKA (
    "kafka_broker_list" = "localhost:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```
また、`ALTER ROUTINE LOAD`を使用して既存のRoutine Loadジョブの更新モードを変更することもできます：

```sql
-- Pause the job first
PAUSE ROUTINE LOAD FOR db1.job1;

-- Alter the update mode
ALTER ROUTINE LOAD FOR db1.job1
PROPERTIES (
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
);

-- Resume the job
RESUME ROUTINE LOAD FOR db1.job1;
```
:::caution Routine Load制限事項
Routine Loadで`UPDATE_FLEXIBLE_COLUMNS`モードを使用する場合、以下の制限が適用されます：
- データ形式はJSON（`"format" = "json"`）である必要があります
- `jsonpaths`プロパティは指定できません
- `fuzzy_parse`オプションは有効にできません
- `COLUMNS`句は使用できません
- `WHERE`句は使用できません
:::

#### 例

以下のテーブルを想定します：

```sql
CREATE TABLE t1 (
  `k` int(11) NULL, 
  `v1` BIGINT NULL,
  `v2` BIGINT NULL DEFAULT "9876",
  `v3` BIGINT NOT NULL,
  `v4` BIGINT NOT NULL DEFAULT "1234",
  `v5` BIGINT NULL
) UNIQUE KEY(`k`) DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES(
"replication_num" = "3",
"enable_unique_key_merge_on_write" = "true",
"enable_unique_key_skip_bitmap_column" = "true");
```
テーブル内の元のデータは以下の通りです：

```sql
MySQL root@127.1:d1> select * from t1;
+---+----+----+----+----+----+
| k | v1 | v2 | v3 | v4 | v5 |
+---+----+----+----+----+----+
| 0 | 0  | 0  | 0  | 0  | 0  |
| 1 | 1  | 1  | 1  | 1  | 1  |
| 2 | 2  | 2  | 2  | 2  | 2  |
| 3 | 3  | 3  | 3  | 3  | 3  |
| 4 | 4  | 4  | 4  | 4  | 4  |
| 5 | 5  | 5  | 5  | 5  | 5  |
+---+----+----+----+----+----+
```
では、柔軟なカラム更新を使用していくつかのフィールドを更新します：

```shell
$ cat test1.json
```
```json
{"k": 0, "__DORIS_DELETE_SIGN__": 1}
{"k": 1, "v1": 10}
{"k": 2, "v2": 20, "v5": 25}
{"k": 3, "v3": 30}
{"k": 4, "v4": 20, "v1": 43, "v3": 99}
{"k": 5, "v5": null}
{"k": 6, "v1": 999, "v3": 777}
{"k": 2, "v4": 222}
{"k": 1, "v2": 111, "v3": 111}
```
```shell
curl --location-trusted -u root: \
-H "strict_mode:false" \
-H "format:json" \
-H "read_json_by_line:true" \
-H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
-T test1.json \
-XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```
アップデート後、テーブル内のデータは以下のとおりです：

```sql
MySQL root@127.1:d1> select * from t1;
+---+-----+------+-----+------+--------+
| k | v1  | v2   | v3  | v4   | v5     |
+---+-----+------+-----+------+--------+
| 1 | 10  | 111  | 111 | 1    | 1      |
| 2 | 2   | 20   | 2   | 222  | 25     |
| 3 | 3   | 3    | 30  | 3    | 3      |
| 4 | 43  | 4    | 99  | 20   | 4      |
| 5 | 5   | 5    | 5   | 5    | <null> |
| 6 | 999 | 9876 | 777 | 1234 | <null> |
+---+-----+------+-----+------+--------+
```
#### 制限と考慮事項

1. 以前の部分更新と同様に、柔軟なカラム更新では、インポートされるデータの各行にすべてのキーカラムが含まれている必要があります。この要件を満たさない行はフィルタリングされ、フィルター行としてカウントされます。フィルタリングされた行数が今回のインポートの`max_filter_ratio`しきい値を超えた場合、インポート全体が失敗し、フィルタリングされたデータによりエラーログが生成されます。

2. 柔軟な部分更新ロードでは、各JSONオブジェクト内のキー・バリューペアは、キーがターゲットテーブルのカラム名と一致する場合のみ有効です。この要件を満たさないキー・バリューペアは無視されます。`__DORIS_VERSION_COL__`、`__DORIS_ROW_STORE_COL__`、または`__DORIS_SKIP_BITMAP_COL__`のキーを持つペアも無視されます。

3. 柔軟な部分更新は、Variantカラムを持つテーブルではサポートされていません。

4. 柔軟な部分更新は、同期マテリアライズドビューを持つテーブルではサポートされていません。

5. 柔軟な部分更新を使用する場合、以下のインポートパラメータは指定または有効化できません：
    - `merge_type`パラメータは指定できません。
    - `delete`パラメータは指定できません。
    - `fuzzy_parse`パラメータは有効化できません。
    - `columns`パラメータは指定できません。
    - `jsonpaths`パラメータは指定できません。
    - `hidden_columns`パラメータは指定できません。
    - `function_column.sequence_col`パラメータは指定できません。
    - `sql`パラメータは指定できません。
    - `memtable_on_sink_node`オプションは有効化できません。
    - `group_commit`パラメータは指定できません。
    - `where`パラメータは指定できません。

### 部分カラム更新における新しい行の処理

セッション変数またはインポートプロパティ`partial_update_new_key_behavior`は、部分カラム更新中に新しい行を挿入する際の動作を制御します。

`partial_update_new_key_behavior=ERROR`の場合、挿入される各行はテーブル内に既に存在するキーを持つ必要があります。`partial_update_new_key_behavior=APPEND`の場合、部分カラム更新は一致するキーを持つ既存の行を更新するか、テーブル内に存在しないキーを持つ新しい行を挿入することができます。

例えば、以下のテーブル構造を考えてみましょう：

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
テーブルに以下のデータが含まれているとします：

```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```
`partial_update_new_key_behavior=ERROR`を指定して部分的な列更新に`Insert Into`を使用し、以下のデータを挿入しようとした場合、キー`(3)`と`(18)`が元のテーブルに存在しないため、操作は失敗します：

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
(1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error: [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR. Row with key=[3] is not in table., host: 127.0.0.1")
```
`partial_update_new_key_behavior=APPEND`を使用して、同じ部分列更新を実行する場合：

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```
既存の行は更新され、2つの新しい行が挿入されます。挿入されるデータで指定されていない列については、デフォルト値が定義されている場合はデフォルト値が使用され、列がnullableの場合はNULLが使用されます。それ以外の場合、挿入は失敗します。

クエリ結果は以下のようになります：

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
## Aggregate Key モデルの部分列更新

Aggregate テーブルは主にデータ更新シナリオではなく事前集計シナリオで使用されますが、集計関数を REPLACE_IF_NOT_NULL に設定することで部分列更新を実現できます。

### テーブル作成

更新が必要なフィールドの集計関数を `REPLACE_IF_NOT_NULL` に設定します。

```sql
CREATE TABLE order_tbl (
  order_id int(11) NULL,
  order_amount int(11) REPLACE_IF_NOT_NULL NULL,
  order_status varchar(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```
### データ挿入

Stream Load、Broker Load、Routine Load、または`INSERT INTO`のいずれであっても、更新対象のフィールドのデータを直接書き込みます。

### 例

前の例と同様に、対応するStream Loadコマンドは以下の通りです（追加のヘッダーは不要）：

```shell
$ cat update.csv

1,To be shipped

curl  --location-trusted -u root: -H "column_separator:," -H "columns:order_id,order_status" -T ./update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```
対応する`INSERT INTO`文は次のとおりです（追加のセッション変数設定は不要）：

```sql
INSERT INTO order_tbl (order_id, order_status) values (1,'Shipped');
```
### 部分カラム更新に関する注意事項

Aggregate Keyモデルは書き込み処理中に追加処理を実行しないため、書き込みパフォーマンスは影響を受けず、通常のデータロードと同じです。ただし、クエリ時の集約コストは比較的高く、典型的な集約クエリのパフォーマンスは、Unique KeyモデルのMerge-on-Write実装よりも5-10倍低くなります。

`REPLACE_IF_NOT_NULL`集約関数は値がNULLでない場合にのみ効力を発揮するため、ユーザーはフィールド値をNULLに変更することはできません。
