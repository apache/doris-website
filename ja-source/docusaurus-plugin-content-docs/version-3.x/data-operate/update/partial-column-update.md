---
{
  "title": "部分的な列の更新",
  "description": "この文書では、Unique Key ModelおよびAggregate Key ModelTableに対してDorisで部分的な列更新を実行する方法について説明します。",
  "language": "ja"
}
---
部分列更新により、table内のすべてのフィールドを変更することなく、特定のフィールドを更新できます。このドキュメントでは、Unique Key ModelとAggregate Key Modelの両方のtableに対して部分列更新を実行する方法について説明します。

## 概要

部分列更新は、行全体を更新するのではなく、table行の特定の列のみを更新できる機能です。これは特に以下の用途で有用です：

- リアルタイム動的列更新。table内の特定フィールドの頻繁な更新が必要な場合。例えば、広告/推薦システムでのリアルタイム分析と意思決定のために、ユーザータグtable内の最新のユーザー行動に関連するフィールドを更新する場合。
- 複数のソースtableを1つの大きなワイドtableにマージする場合。
- データ訂正。

## Unique Key Modelの部分列更新

Dorisはunique key modelのload updateで部分列データを直接insert又はupdateする機能を提供しており、最初に行全体を読み取る必要がないため、更新効率を大幅に向上させます。

:::caution Note

1. バージョン2.0では、Unique KeyのMerge-on-Write実装での部分列更新のみをサポートしています。
2. バージョン2.0.2以降、INSERT INTOを使用した部分列更新がサポートされています。
3. 同期されたマテリアライズドビューを持つtableでは部分列更新はサポートされていません。
4. schema changeを実行中のtableでは部分列更新は許可されていません。
:::

### 使用例

Dorisに注文table`order_tbl`があると仮定します。注文idがKey列で、注文ステータスと注文金額がValue列です。データの状況は以下の通りです：

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
ユーザーが支払いをクリックした後、DorisシステムはorderIDが'1'の注文のorder statusを'Pending Shipment'に変更する必要があります。

### Loadメソッドを使用した部分列更新

#### StreamLoad/BrokerLoad/RoutineLoad

次のCSVファイルを準備してください：

```
1,Pending Shipment
```
読み込み時に以下のヘッダーを追加してください：

```sql
partial_columns:true
```
`columns`で読み込む列を指定します（すべてのキー列を含める必要があります）。以下はStream Loadの例です：

```sql
curl --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```
#### INSERT INTO

すべてのデータモデルにおいて、部分的なカラムが指定された場合の`INSERT INTO`のデフォルト動作は、行全体を書き込むことです。誤用を防ぐため、Merge-on-Write実装では、`INSERT INTO`はデフォルトで行全体のUPSERTのセマンティクスを維持します。部分的なカラム更新を有効にするには、次のセッション変数を設定してください：

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending Shipment');
```
:::caution Note:
セッション変数`enable_insert_strict`はデフォルトでtrueに設定されており、デフォルトでストリクトモードが有効になっていることに注意してください。バージョン3.0.xでは、部分列更新はストリクトモードで存在しないキーの更新を許可しません。部分列更新でinsert文を使用して存在しないキーを挿入するには、`enable_unique_key_partial_update`をtrueに、`enable_insert_strict`をfalseに設定してください。
:::

#### Flink Connector

Flink Connectorを使用する場合は、以下の設定を追加してください：

```sql
'sink.properties.partial_columns' = 'true',
```
`sink.properties.column`でロードする列を指定してください（すべてのキー列を含める必要があります）。

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

Merge-on-Write実装は、最適なクエリパフォーマンスを確保するために書き込み時にデータの全行を完成させる必要があるため、部分的な列更新に使用すると部分ロードパフォーマンスが低下する可能性があります。

パフォーマンス最適化の提案：

- NVMeまたは高速SSDクラウドディスクを搭載したSSDを使用してください。データの完成時に大量の履歴データを読み取り、高い読み取りIOPSとスループットが発生するためです。
- 行ストレージを有効にすると、データ完成時に発生するIOPSを削減でき、ロードパフォーマンスが大幅に向上します。Table作成時に以下のプロパティを設定することで行ストレージを有効にできます：

```Plain
"store_row_column" = "true"
```
現在、同一のバッチデータ書き込みタスク（ロードタスクまたは`INSERT INTO`）内のすべての行は、同じカラムのみを更新することができます。異なるカラムでデータを更新するには、異なるバッチで書き込む必要があります。

### 柔軟な部分カラム更新

以前、Dorisの部分更新機能では、インポート内のすべての行が同じカラムを更新する必要がありました。現在、Dorisは単一のインポート内で各行が異なるカラムを更新できる、より柔軟な部分更新方式をサポートしています（3.1.0以降でサポート）。

:::caution Note:

1. 現在、Stream Loadインポート方式およびStream Loadを使用するツール（例：Doris-Flink-Connector）のみがこの機能をサポートしています。
2. 柔軟なカラム更新を使用する際、インポートファイルはJSON形式である必要があります。
:::

#### 適用シナリオ

CDCを使用してデータベースシステムからDorisにリアルタイムでデータを同期する場合、ソースシステムから出力されるレコードには完全な行データが含まれておらず、主キーと更新されたカラムの値のみが含まれている場合があります。そのような場合、時間ウィンドウ内のバッチデータで更新されるカラムが異なることがあります。柔軟なカラム更新を使用してDorisにデータをインポートすることができます。

#### 使用方法

**既存のTableで柔軟なカラム更新を有効にする**

Dorisの旧バージョンで作成された既存のMerge-On-WriteTableについて、アップグレード後、コマンド`ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";`を使用して柔軟な部分更新を有効にできます。このコマンドの実行後、`show create table db1.tbl1`の結果に`"enable_unique_key_skip_bitmap_column" = "true"`が含まれていれば、機能が正常に有効化されています。ターゲットTableでlight-schema-change機能が事前に有効になっていることを確認してください。

**新しいTableで柔軟なカラム更新を使用する**

新しいTableについて、柔軟なカラム更新機能を使用するには、Table作成時に以下のTableプロパティを指定してMerge-on-Writeを有効にし、柔軟なカラム更新に必要な隠しbitmapカラムを含める必要があります：

```Plain
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```
**StreamLoad**

Stream Loadを使用する際は、以下のヘッダーを追加してください：

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
現在、柔軟な列更新を使用していくつかのフィールドを更新します：

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
更新後、Table内のデータは次のとおりです：

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

1. 以前の部分更新と同様に、柔軟な列更新では、インポートされるデータの各行にすべてのキー列が含まれている必要があります。この要件を満たさない行はフィルタリングされ、フィルタ行としてカウントされます。フィルタリングされた行数がこのインポートの`max_filter_ratio`閾値を超える場合、インポート全体が失敗し、フィルタリングされたデータはエラーログを生成します。

2. 柔軟な部分更新ロードでは、各JSONオブジェクト内のキーと値のペアは、キーがターゲットTableの列名と一致する場合のみ有効です。この要件を満たさないキーと値のペアは無視されます。`__DORIS_VERSION_COL__`、`__DORIS_ROW_STORE_COL__`、または`__DORIS_SKIP_BITMAP_COL__`をキーとするペアも無視されます。

3. 柔軟な部分更新はVariant列を持つTableではサポートされていません。

4. 柔軟な部分更新は同期マテリアライズドビューを持つTableではサポートされていません。

5. 柔軟な部分更新を使用する際、以下のインポートパラメータは指定または有効化することができません：
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

### 部分列更新における新規行の処理

3.0.xシリーズでは、インポート時にstrict modeが有効化されているかどうかが、Partial Column Updateにおける新たに挿入される行の動作を制御します。詳細については、[Strict Mode](../import/handling-messy-data.md#restricting-partial-column-updates-to-existing-columns-only)のドキュメントを参照してください。
バージョン3.1.0以降では、セッション変数またはインポートプロパティ`partial_update_new_key_behavior`が部分列更新時に新しい行を挿入する際の動作を制御します。

`partial_update_new_key_behavior=ERROR`の場合、挿入される各行はTableに既に存在するキーを持つ必要があります。`partial_update_new_key_behavior=APPEND`の場合、部分列更新は一致するキーを持つ既存の行を更新するか、Tableに存在しないキーを持つ新しい行を挿入することができます。

例えば、以下のTable構造を考えてみます：

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
表に以下のデータが含まれているとします：

```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```
`partial_update_new_key_behavior=ERROR`で`Insert Into`を部分的な列更新に使用し、以下のデータを挿入しようとする場合、キー`(3)`と`(18)`が元のTableに存在しないため、操作は失敗します：

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
(1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error: [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR. Row with key=[3] is not in table., host: 127.0.0.1")
```
`partial_update_new_key_behavior=APPEND`を使用して同じ部分列更新を実行する場合：

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```
既存の行は更新され、2つの新しい行が挿入されます。挿入データで指定されていない列については、デフォルト値が定義されている場合はデフォルト値が使用され、列がnullableの場合はNULLが使用され、そうでなければ挿入は失敗します。

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
## Aggregate Key モデルの部分的カラム更新

AggregateTableは主にデータ更新シナリオではなく事前集計シナリオで使用されますが、集計関数をREPLACE_IF_NOT_NULLに設定することで部分的カラム更新を実現できます。

### Table作成

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

Stream Load、Broker Load、Routine Load、または`INSERT INTO`のいずれの場合でも、更新するフィールドのデータを直接書き込みます。

### 例

前の例と同様に、対応するStream Loadコマンドは以下の通りです（追加のヘッダーは不要）：

```shell
$ cat update.csv

1,To be shipped

curl  --location-trusted -u root: -H "column_separator:," -H "columns:order_id,order_status" -T ./update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```
対応する `INSERT INTO` ステートメントは以下の通りです（追加のセッション変数設定は不要）：

```sql
INSERT INTO order_tbl (order_id, order_status) values (1,'Shipped');
```
### 部分列更新に関する注意事項

Aggregate Keyモデルは書き込み処理中に追加の処理を実行しないため、書き込みパフォーマンスは影響を受けず、通常のデータロードと同じです。しかし、クエリ時の集約のコストは比較的高く、典型的な集約クエリのパフォーマンスはUnique KeyモデルのMerge-on-Write実装より5-10倍低くなります。

`REPLACE_IF_NOT_NULL`集約関数は値がNULLでない場合にのみ有効になるため、ユーザーはフィールド値をNULLに変更することはできません。
