---
{
  "title": "部分列更新",
  "description": "このドキュメントでは、Unique Key ModelおよびAggregate Key ModelTableに対してDorisで部分的なカラム更新を実行する方法について説明します。",
  "language": "ja"
}
---
部分列更新により、table内のすべてのフィールドを変更することなく、特定のフィールドを更新することができます。このドキュメントでは、Unique Key ModelとAggregate Key Modelの両方のtableに対して部分列更新を実行する方法を説明します。

## 概要

部分列更新は、行全体を更新するのではなく、table行の特定の列のみを更新できる機能です。これは特に以下の用途で有用です：

- リアルタイムの動的列更新で、table内の特定のフィールドの頻繁な更新が必要な場合。例えば、広告・推奨システムでのリアルタイム分析と意思決定のために、ユーザータグtable内の最新のユーザー行動に関連するフィールドを更新する場合。
- 複数のソースtableを1つの大きなワイドtableにマージする場合。
- データ修正。

## Unique Key Modelの部分列更新

Dorisは、unique key modelのロード更新において、行全体を最初に読み取る必要をバイパスして、部分列データを直接挿入または更新する機能を提供し、更新効率を大幅に向上させます。

:::caution Note

1. バージョン2.0では、Unique KeyのMerge-on-Write実装でのみ部分列更新をサポートしています。
2. バージョン2.0.2以降、INSERT INTOを使用した部分列更新がサポートされています。
3. 同期されたマテリアライズドビューを持つtableでは、部分列更新はサポートされていません。
4. スキーマ変更を実行中のtableでは、部分列更新は許可されていません。
:::

### 使用例

Dorisに注文table`order_tbl`があると仮定します。注文idがKey列で、注文ステータスと注文金額がValue列です。データの状態は以下の通りです：

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
ユーザーが支払いをクリックした後、Dorisシステムはorder id '1'の注文の注文ステータスを'Pending Shipment'に変更する必要があります。

### Loadメソッドを使用した部分カラム更新

#### StreamLoad/BrokerLoad/RoutineLoad

以下のCSVファイルを準備してください：

```
1,Pending Shipment
```
ロード時に以下のヘッダーを追加してください：

```sql
partial_columns:true
```
`columns`で読み込む列を指定します（すべてのキー列を含む必要があります）。以下はStream Loadの例です：

```sql
curl --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```
#### INSERT INTO

すべてのデータモデルにおいて、部分的な列が指定された場合の`INSERT INTO`のデフォルトの動作は、行全体を書き込むことです。誤用を防ぐため、Merge-on-Write実装では、`INSERT INTO`はデフォルトで行全体のUPSERTのセマンティクスを維持します。部分列更新を有効にするには、次のセッション変数を設定してください：

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending Shipment');
```
#### Flink Connector

Flink Connectorを使用する場合は、以下の設定を追加してください：

```sql
'sink.properties.partial_columns' = 'true',
```
`sink.properties.column`にロードするカラムを指定します（すべてのキーカラムを含める必要があります）。

### アップデート Result

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

Merge-on-Write実装は、最適なクエリパフォーマンスを確保するために書き込み時にデータの行全体を完了する必要があるため、部分的な列更新に使用すると部分ロードのパフォーマンスが低下する可能性があります。

パフォーマンス最適化の提案：

- NVMeを搭載したSSDまたは高速SSDクラウドディスクを使用してください。データの完了時に大量の履歴データを読み取り、高い読み取りIOPSとスループットを生成するためです。
- 行ストレージを有効にすると、データ完了時に生成されるIOPSを削減でき、ロードパフォーマンスを大幅に向上させることができます。Table作成時に以下のプロパティを設定して行ストレージを有効にしてください：

```Plain
"store_row_column" = "true"
```
現在、同じバッチデータ書き込みタスク（ロードタスクまたは`INSERT INTO`）内のすべての行は、同じカラムのみを更新できます。異なるカラムでデータを更新するには、異なるバッチで書き込む必要があります。

### 柔軟な部分カラム更新

以前、Dorisの部分更新機能では、インポート内のすべての行が同じカラムを更新する必要がありました。現在、Dorisは単一のインポート内で各行が異なるカラムを更新できる、より柔軟な部分更新方法をサポートしています（3.1.0以降でサポート）。

:::caution Note:

1. 現在、Stream Loadインポート方法とStream Loadを使用するツール（例：Doris-Flink-Connector）のみがこの機能をサポートしています。
2. 柔軟なカラム更新を使用する場合、インポートファイルはJSON形式である必要があります。
:::

#### 適用シナリオ

CDCを使用してデータベースシステムからDorisにリアルタイムでデータを同期する場合、ソースシステムが出力するレコードは完全な行データを含まず、主キーと更新されたカラムの値のみを含む場合があります。このような場合、時間ウィンドウ内のデータバッチで更新されるカラムが異なる可能性があります。柔軟なカラム更新を使用して、Dorisにデータをインポートできます。

#### 使用方法

**既存Tableでの柔軟なカラム更新の有効化**

Dorisの古いバージョンで作成された既存のMerge-On-WriteTableについては、アップグレード後、コマンド`ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";`を使用して柔軟な部分更新を有効にできます。このコマンドを実行後、`show create table db1.tbl1`の結果に`"enable_unique_key_skip_bitmap_column" = "true"`が含まれていれば、機能が正常に有効化されています。事前に対象Tableでlight-schema-change機能が有効になっていることを確認してください。

**新しいTableでの柔軟なカラム更新の使用**

新しいTableで柔軟なカラム更新機能を使用するには、Table作成時に以下のTableプロパティを指定して、Merge-on-Writeを有効にし、柔軟なカラム更新に必要な隠しbitmapカラムを含めます：

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
#### Example

以下のTableを想定します：

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
Table内の元のデータは以下の通りです：

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
次に、flexible column updatesを使用していくつかのフィールドを更新します：

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
アップデート後、Table内のデータは以下の通りです：

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
#### 制限事項と考慮事項

1. 以前の部分更新と同様に、柔軟な列更新では、インポートされるデータの各行にすべてのキー列が含まれている必要があります。この要件を満たさない行はフィルタリングされ、フィルター行としてカウントされます。フィルタリングされた行の数がこのインポートの`max_filter_ratio`閾値を超えた場合、インポート全体が失敗し、フィルタリングされたデータはエラーログを生成します。

2. 柔軟な部分更新ロードでは、各JSONオブジェクトのキーと値のペアは、キーがターゲットTableの列名と一致する場合のみ有効です。この要件を満たさないキーと値のペアは無視されます。`__DORIS_VERSION_COL__`、`__DORIS_ROW_STORE_COL__`、または`__DORIS_SKIP_BITMAP_COL__`をキーとするペアも無視されます。

3. 柔軟な部分更新はVariant列を持つTableではサポートされていません。

4. 柔軟な部分更新は同期マテリアライズドビューを持つTableではサポートされていません。

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

### 部分列更新での新しい行の処理

セッション変数またはインポートプロパティ`partial_update_new_key_behavior`は、部分列更新中に新しい行を挿入する際の動作を制御します。

`partial_update_new_key_behavior=ERROR`の場合、挿入される各行はTableに既に存在するキーを持つ必要があります。`partial_update_new_key_behavior=APPEND`の場合、部分列更新は一致するキーを持つ既存の行を更新するか、Tableに存在しないキーを持つ新しい行を挿入することができます。

例として、以下のTable構造を考えてみましょう：

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
Tableに以下のデータが含まれているとします：

```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```
`partial_update_new_key_behavior=ERROR`で部分的な列更新に`Insert Into`を使用し、以下のデータを挿入しようとした場合、キー`(3)`と`(18)`が元のTableに存在しないため、操作は失敗します：

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
(1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error: [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR. Row with key=[3] is not in table., host: 127.0.0.1")
```
`partial_update_new_key_behavior=APPEND`を使用して、同じ部分的なカラム更新を実行する場合：

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```
既存の行は更新され、2つの新しい行が挿入されます。挿入されるデータで指定されていない列については、デフォルト値が定義されている場合はデフォルト値が使用され、列がnullableの場合はNULLが使用され、それ以外の場合は挿入が失敗します。

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
## Aggregate Key ModelにおけるPartial Column アップデート

AggregateTableは主にデータ更新シナリオではなく事前集計シナリオで使用されますが、集計関数をREPLACE_IF_NOT_NULLに設定することでpartial column updateを実現できます。

### Create Table

更新が必要なフィールドの集計関数を`REPLACE_IF_NOT_NULL`に設定します。

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

Stream Load、Broker Load、Routine Load、または`INSERT INTO`のいずれであっても、更新するフィールドのデータを直接書き込みます。

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
### 部分列更新に関する注意事項

Aggregate Keyモデルは書き込み処理中に追加の処理を実行しないため、書き込みパフォーマンスは影響を受けず、通常のデータロードと同じです。ただし、クエリ時の集約のコストは比較的高く、典型的な集約クエリのパフォーマンスはUnique KeyモデルのMerge-on-Write実装より5-10倍低くなります。

`REPLACE_IF_NOT_NULL`集約関数は値がNULLでない場合にのみ有効になるため、ユーザーはフィールド値をNULLに変更することができません。
