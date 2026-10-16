---
{
    "title": "カラム更新",
    "language": "ja",
    "description": "Apache Doris の部分カラム更新ガイド。Unique Key モデルと Aggregate Key モデルで指定したカラムを効率的に更新する方法を、Stream Load、INSERT INTO、Flink Connector、柔軟なカラム更新のシナリオとともに説明します。"
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Real-time field updates / Multi-source wide-table joining / Data correction -->

データ更新のワークフローでは、ビジネス要件により、行の一部のフィールドだけを変更する必要がよくあります。たとえば、次のような場合です。

- **リアルタイムで高頻度のフィールド更新**：ユーザータグテーブルの行動関連フィールドをリアルタイムで最新の状態に保ち、広告システムやレコメンドシステムがリアルタイムで分析と意思決定を行えるようにします。
- **複数ソースからのワイドテーブル結合**：複数のソーステーブルのデータを主キーで結合して一つのワイドテーブルにまとめます。各ソーステーブルが提供するのは一部のカラムだけです。
- **データ修正**：バッチ処理で一部のレコードの特定フィールドの値を修正し、その他のフィールドは変更しません。

従来の `UPDATE` 文では、通常、行全体を読み取ってから行全体を書き戻す必要があります。この「読み取り・変更・書き込み」トランザクションは、大量の書き込み時に性能が低下し、高スループットの要件を満たせません。

**Doris の部分カラム更新機能**を使用すると、ロード時に行全体を先に読み取ることなく、変更が必要なカラムだけを書き込めるため、更新効率が大幅に向上します。このドキュメントでは、**Unique Key モデル**と**Aggregate Key モデル**で部分カラム更新を行う方法を説明します。

## 機能の概要

<!-- Knowledge type: Capability definition -->

| データモデル | 実装方式 | 書き込み性能 | クエリ性能 | ユースケース |
| --- | --- | --- | --- | --- |
| Unique Key（Merge-on-Write） | 書き込み時に行全体を補完 | 中程度（IO の影響を受ける） | 高い | リアルタイム更新、クエリ性能が重要なシナリオ |
| Aggregate Key（`REPLACE_IF_NOT_NULL`） | クエリ時に集約 | 高い（通常のロードと同程度） | 低い（集約クエリは MoW より 5～10 倍遅い） | 書き込みスループットが重要で、クエリ性能の低下を許容できるシナリオ |

## Unique Key モデルでのカラム更新

<!-- Knowledge type: Operating procedure -->

Unique Key モデルへのロード時、Doris は行全体を先に読み取ることなく、一部のカラムのデータを直接挿入または更新できます。これにより、更新効率が大幅に向上します。

:::caution 注意

1. バージョン 2.0 では、部分カラム更新は Unique Key の Merge-on-Write 実装でのみサポートされます。
2. バージョン 2.0.2 以降は、`INSERT INTO` を使用して部分カラム更新を実行できます。
3. 同期マテリアライズドビューを持つテーブルでは、部分カラム更新はサポートされません。
4. スキーマ変更中のテーブルでは、部分カラム更新はサポートされません。

:::

### 例

注文テーブル `order_tbl` が Doris にあり、注文 ID が Key カラム、注文ステータスと注文金額が Value カラムだとします。現在のデータは次のとおりです。

| 注文 ID | 注文金額 | 注文ステータス |
| --- | --- | --- |
| 1 | 100 | Pending payment |

```sql
+----------+--------------+------------------+
| order_id | order_amount | order_status     |
+----------+--------------+------------------+
| 1        |          100 | Pending payment  |
+----------+--------------+------------------+
1 row in set (0.01 sec)
```

ユーザーが支払いをクリックしたとき、注文金額のフィールドを変更せずに、注文 ID `1` のステータスを `Pending shipment` に変更する必要があります。

### ロードによる部分カラム更新

#### Stream Load / Broker Load / Routine Load

次の CSV ファイルを用意します。

```text
1,Pending shipment
```

ロード時に次のヘッダーを追加します。

```text
partial_columns:true
```

`columns` パラメータで、ロードするカラムを指定します（**すべての Key カラムを含める必要があります**。含めない場合は更新できません）。次は Stream Load の例です。

```shell
curl --location-trusted -u root: \
    -H "partial_columns:true" \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T /tmp/update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

#### INSERT INTO

すべてのデータモデルで、一部のカラムを指定した `INSERT INTO` のデフォルト動作は行全体の書き込みです。誤用を防ぐため、Merge-on-Write 実装でも `INSERT INTO` はデフォルトで行全体の UPSERT セマンティクスを使用します。部分カラム更新のセマンティクスを有効にするには、まず次のセッション変数を設定します。

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

#### Flink Connector

Flink Connector を使用する場合は、次の設定を追加します。

```text
'sink.properties.partial_columns' = 'true'
```

`sink.properties.column` でロードするカラムを指定します（**すべての Key カラムを含める必要があります**。含めない場合は更新できません）。

### 更新結果

更新後の結果は次のとおりです。

```sql
+----------+--------------+-------------------+
| order_id | order_amount | order_status      |
+----------+--------------+-------------------+
| 1        |          100 | Pending shipment  |
+----------+--------------+-------------------+
1 row in set (0.01 sec)
```

### 注意事項

<!-- Knowledge type: Performance tuning -->

Merge-on-Write 実装では、最適なクエリ性能を保証するため、書き込み時に行全体を補完する必要があります。そのため、Merge-on-Write による部分カラム更新では、ロード性能がある程度低下します。

**書き込み性能を最適化するための推奨事項：**

- **高性能 SSD を使用する**：NVMe SSD または高速なクラウド SSD を推奨します。行の補完では大量の履歴データを読み取るため、高い読み取り IOPS と読み取りスループットが発生します。
- **行ストアを有効にする**：行の補完時に発生する IOPS を大幅に減らし、ロード性能を明確に改善できます。テーブル作成時に次のプロパティで有効にします。

    ```text
    "store_row_column" = "true"
    ```

**バッチの制約：** 同じバッチ書き込みタスク（ロードタスクまたは `INSERT INTO`）内のすべての行は、同じカラムの組み合わせしか更新できません。異なるカラムを更新するには、データを複数のバッチに分けます。以下で説明する柔軟なカラム更新機能を使用すると、この制約を解消できます。

### 柔軟なカラム更新

<!-- Knowledge type: Feature description -->
<!-- Use cases: Real-time CDC sync / Scenarios where the updated columns differ row by row -->

従来、Doris の部分カラム更新機能では、一回のロードに含まれるすべての行で同じカラムの組み合わせを更新する必要がありました。**バージョン 3.1.0 以降**は、より柔軟な更新方法がサポートされ、**一回のロード内で行ごとに異なるカラムの組み合わせを更新できます**。

:::caution 注意

1. 柔軟なカラム更新は、Stream Load、Routine Load、および内部で Stream Load を使用するツール（Doris Flink Connector など）をサポートします。
2. 柔軟なカラム更新を使用する場合、ロードファイルは JSON 形式でなければなりません。

:::

#### ユースケース

CDC を使用して別のシステムから Doris にデータをリアルタイムで同期する場合、ソースシステムが出力するレコードには、行全体ではなく主キーと更新されたカラムだけが含まれることがあります。この場合、一定の時間枠内のバッチに含まれる行がそれぞれ異なるカラムを更新する可能性があり、柔軟なカラム更新を使用してそのデータを Doris にロードできます。

#### 使用方法

##### 1. 柔軟なカラム更新を有効にする

**新規テーブル：** テーブル作成時に次のプロパティを指定し、Merge-on-Write を有効にして、柔軟なカラム更新に必要な `bitmap` 隠しカラムを追加します。

```text
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**既存テーブル：** 古いバージョンの Doris で作成した既存の Merge-on-Write テーブルでは、Doris をアップグレードした後、次の文で柔軟なカラム更新を有効にできます。

```sql
ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";
```

実行後に `SHOW CREATE TABLE db1.tbl1` を実行します。結果に `"enable_unique_key_skip_bitmap_column" = "true"` が含まれていれば、この機能は正常に有効化されています。

:::tip
既存テーブルにこの方法を使用する前に、対象テーブルで light-schema-change が有効になっていることを確認してください。
:::

##### 2. ロードタスクで有効にする

ロード方法ごとの設定は次のとおりです。

| ロード方法 | 設定項目 | 値 |
| --- | --- | --- |
| Stream Load | ヘッダー | `unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS` |
| Flink Doris Connector | sink プロパティ | `'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'` |
| Routine Load | `PROPERTIES` | `"unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"` |

**Routine Load の完全な例：**

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

`ALTER ROUTINE LOAD` を使用して、既存の Routine Load ジョブの更新モードを変更することもできます。

```sql
-- 1. Pause the job
PAUSE ROUTINE LOAD FOR db1.job1;

-- 2. Change the update mode
ALTER ROUTINE LOAD FOR db1.job1
PROPERTIES (
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
);

-- 3. Resume the job
RESUME ROUTINE LOAD FOR db1.job1;
```

:::caution Routine Load の制限

Routine Load で `UPDATE_FLEXIBLE_COLUMNS` モードを使用する場合、次の制限があります。

- データ形式は JSON（`"format" = "json"`）でなければなりません。
- `jsonpaths` プロパティは指定できません。
- `fuzzy_parse` オプションは有効にできません。
- `COLUMNS` 句は使用できません。
- `WHERE` 句は使用できません。

:::

#### 完全な例

**ステップ 1：テストテーブルを作成する**

```sql
CREATE TABLE t1 (
    `k`  INT NULL,
    `v1` BIGINT NULL,
    `v2` BIGINT NULL DEFAULT "9876",
    `v3` BIGINT NOT NULL,
    `v4` BIGINT NOT NULL DEFAULT "1234",
    `v5` BIGINT NULL
) UNIQUE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "3",
    "enable_unique_key_merge_on_write" = "true",
    "enable_unique_key_skip_bitmap_column" = "true"
);
```

**ステップ 2：テーブル内の既存データ**

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

**ステップ 3：柔軟なカラム更新用のデータを用意する**

行ごとに異なるカラムの組み合わせを更新できます。

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

**ステップ 4：Stream Load でロードする**

```shell
curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode:false" \
    -H "format:json" \
    -H "read_json_by_line:true" \
    -H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
    -T test1.json \
    -XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```

**ステップ 5：更新結果を確認する**

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

#### 制限と注意事項

1. 通常の部分カラム更新と同様に、柔軟なカラム更新では各行に**すべての Key カラム**が含まれている必要があります。この条件を満たさない行はフィルタリングされ、`filter rows` に計上されます。`filtered rows` がロードの `max_filter_ratio` で許容される上限を超えると、ロード全体が失敗します。フィルタリングされた各行はエラーログに記録されます。
2. JSON オブジェクト内のキーと値のペアのうち、キーが対象テーブルのカラム名と一致するものだけが有効です。それ以外は無視されます。また、キーが `__DORIS_VERSION_COL__`、`__DORIS_ROW_STORE_COL__`、`__DORIS_SKIP_BITMAP_COL__` のペアも無視されます。
3. Variant カラムを含むテーブルでは、柔軟なカラム更新はサポートされません。
4. 同期マテリアライズドビューを持つテーブルでは、柔軟なカラム更新はサポートされません。
5. 柔軟なカラム更新を使用する場合、次のロードパラメータは**指定または有効化できません**。
    - `merge_type`
    - `delete`
    - `fuzzy_parse`
    - `columns`
    - `jsonpaths`
    - `hidden_columns`
    - `function_column.sequence_col`
    - `sql`
    - `memtable_on_sink_node` move-forward
    - `group_commit`
    - `where`

### 新規挿入行の動作制御

<!-- Knowledge type: Configuration parameter -->

セッション変数またはロードプロパティ `partial_update_new_key_behavior` は、部分カラム更新と柔軟なカラム更新における**新規挿入行**の動作を制御します。

| 値 | 動作 |
| --- | --- |
| `ERROR` | すべての行の Key がテーブルにすでに存在する必要があります。存在しない場合はロードが失敗します。 |
| `APPEND` | 既存行の更新と、Key が存在しない新規行の挿入の両方を許可します。 |

#### テーブルスキーマの例

```sql
CREATE TABLE user_profile (
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

テーブル内の既存データ：

```sql
mysql> select * from user_profile;
+----+-------+-----+----------+---------+---------------------+
| id | name  | age | city     | balance | last_access_time    |
+----+-------+-----+----------+---------+---------------------+
|  1 | kevin |  18 | shenzhen |     400 | 2023-07-01 12:00:00 |
+----+-------+-----+----------+---------+---------------------+
```

#### シナリオ 1：`ERROR` モード（新規行を拒否）

二行目と三行目の Key（`3` と `18`）は元のテーブルに存在しないため、この挿入は失敗します。

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');

-- Error:
-- (1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error:
-- [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR.
-- Row with key=[3] is not in table., host: 127.0.0.1")
```

#### シナリオ 2：`APPEND` モード（新規行を許可）

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');
```

実行後、既存の行が更新され、新しい行が二行追加されます。ユーザーが指定しなかったカラムには、次の規則が適用されます。

1. カラムに**デフォルト値がある**場合は、その値を使用します。
2. それ以外で、カラムが **NULL を許可する**場合は、NULL を使用します。
3. いずれにも該当しない場合は、挿入が失敗します。

クエリ結果：

```sql
mysql> select * from user_profile;
+----+-------+------+----------+---------+---------------------+
| id | name  | age  | city     | balance | last_access_time    |
+----+-------+------+----------+---------+---------------------+
|  1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|  3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
| 18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+----+-------+------+----------+---------+---------------------+
```

## Aggregate Key モデルでのカラム更新

<!-- Knowledge type: Operating procedure -->
<!-- Use cases: Sensitive to write throughput, lower query performance is acceptable -->

Aggregate テーブルは主に事前集約に使用されますが、集約関数を `REPLACE_IF_NOT_NULL` に設定することで、部分カラム更新と同様の効果も得られます。

### テーブルを作成する

カラム更新が必要な各フィールドの集約関数を `REPLACE_IF_NOT_NULL` に設定します。

```sql
CREATE TABLE order_tbl (
    order_id     INT(11) NULL,
    order_amount INT(11) REPLACE_IF_NOT_NULL NULL,
    order_status VARCHAR(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### データを書き込む

Stream Load、Broker Load、Routine Load、`INSERT INTO` のどれを使用する場合も、更新するフィールドのデータを書き込むだけです。**追加のパラメータは不要です。**

### 例

例は前述のものと同じです。対応する Stream Load コマンドは次のとおりです（追加のヘッダーは不要です）。

```shell
$ cat update.csv
1,Pending shipment

curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T ./update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

対応する `INSERT INTO` 文は次のとおりです（追加のセッション変数は不要です）。

```sql
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

### 注意事項

- **書き込み性能**：Aggregate Key モデルでは書き込み時に追加の処理を行わないため、書き込み性能は通常のデータロードと同じです。
- **クエリ性能**：クエリ時の集約には高いコストがかかります。Unique Key モデルの Merge-on-Write 実装と比較すると、一般的な集約クエリは **5～10 倍**遅くなります。
- **NULL 値の制限**：`REPLACE_IF_NOT_NULL` 集約関数は NULL 以外の値に対してのみ作用するため、**フィールドの値を NULL に変更することはできません**。
