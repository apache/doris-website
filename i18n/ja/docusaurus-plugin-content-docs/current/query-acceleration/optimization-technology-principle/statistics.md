---
{
    "title": "Doris の統計情報の収集と管理：CBO オプティマイザの設定ガイド",
    "language": "ja",
    "description": "Apache Doris で統計情報を収集、管理、調整する方法を説明します。ANALYZE コマンド、自動収集の仕組み、外部テーブルの統計情報、設定項目、一般的なトラブルシューティングを紹介します。",
    "keywords": ["Doris statistics", "ANALYZE", "CBO", "auto collection", "table stats", "column stats", "auto analyze"],
    "sidebar_label": "統計情報"
}
---

# 統計情報

<!-- Knowledge type: Concept + Operation guide -->
<!-- Applicable scenarios: CBO tuning, statistics collection and management, query performance troubleshooting -->

統計情報は Doris の CBO（コストベースオプティマイザ）によるコスト推定の基礎であり、その正確さはクエリ実行計画の品質に直接影響します。このページでは、統計情報の収集方法、管理コマンド、関連設定、一般的なトラブルシューティング方法を説明します。

**対象バージョン**：Doris 2.0 以降。

## 事前確認チェックリスト

- [ ] 使用している Doris のバージョンを把握している（自動収集機能には 2.0.3 以降が必要です）。
- [ ] 対象の種類（内部テーブル、Hive、Iceberg、Paimon、JDBC など）を確認している。
- [ ] 対象カラムの型を把握している（収集に対応するのは基本型のみです）。
- [ ] 手動で収集を開始するか、自動収集に任せるかを決めている。

## 基本概念

<!-- Knowledge type: Concept -->
<!-- Applicable scenarios: Understanding the role and composition of statistics -->

**一文で表すと**：統計情報は、Doris がテーブルおよびカラム単位で記録するデータ分布のメタデータです。オプティマイザはこれを使用してコストを推定し、最適な実行計画を選択します。

Doris はテーブル内のカラムごとに、次の指標を含む統計情報を収集します。

| 指標            | 説明                                 |
| --------------- | ------------------------------------ |
| `row_count`     | 総行数                               |
| `data_size`     | カラムのデータの合計サイズ           |
| `avg_size_byte` | カラムの各行の平均データサイズ |
| `ndv`           | 異なる値の数（カーディナリティ）     |
| `min`           | 最小値                               |
| `max`           | 最大値                               |
| `null_count`    | NULL 値の数                          |

**対応するカラム型**：BOOLEAN、TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DATE、DATETIME、TIMESTAMP_NS、STRING、VARCHAR、TEXT。

**非対応（自動的にスキップ）**：JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2、VARBINARY。

収集結果は `internal.__internal_schema.column_statistics` テーブルに保存されます。

## 統計情報の収集

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: Manually or automatically triggering statistics collection -->

Doris では内部テーブルの自動サンプリングがデフォルトで有効になっているため、ほとんどの場合、手動で操作する必要はありません。収集を細かく制御する場合は手動収集を使用します。

### 収集方法の比較

| 項目             | 手動収集（ANALYZE）                          | 自動収集（デフォルトで有効）            |
| ---------------- | -------------------------------------------- | --------------------------------------- |
| 開始方法         | ユーザーが実行を開始                         | バックグラウンドスレッドが定期的に走査  |
| 用途             | 緊急の更新、初回の収集、デバッグ             | 日常的な管理、長期的な鮮度の維持        |
| 最小バージョン   | 2.0                                          | 2.0.3                                   |
| サンプリング方法 | 行数または割合を指定                         | デフォルトで 4194304 行（2^22）を抽出  |
| 制御単位         | テーブル／データベース／カラム               | クラスタ単位のスイッチとテーブル単位のポリシー |

### 手動収集

**目的**：テーブルまたはデータベースの統計情報の収集と更新をすぐに開始します。

**コマンド**：`ANALYZE` ステートメントを使用して収集ジョブを手動で送信します。詳しくは SQL マニュアルの [ANALYZE](../../sql-manual/sql-statements/statistics/ANALYZE) を参照してください。

**代表的な例**：

`lineitem` テーブルのすべてのカラムについて全量収集を実行します。

```sql
ANALYZE TABLE lineitem;
```

`tpch100` データベース内のすべてのテーブルのすべてのカラムについて全量収集を実行します。

```sql
ANALYZE DATABASE tpch100;
```

`lineitem` テーブルから 100000 行をサンプリングして収集します。

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

`l_orderkey` カラムと `l_linenumber` カラムについて、`lineitem` テーブルから 100000 行をサンプリングして収集します。

```sql
ANALYZE TABLE lineitem (l_orderkey, l_linenumber) WITH SAMPLE ROWS 100000;
```

#### 頻出値の収集

頻出値は、カラム内で頻繁に現れる値としてカラム統計情報に記録されます。データに偏りがある場合、オプティマイザが述語をより正確に推定するのに役立ちますが、カーディナリティの高いカラムでは収集時のメモリ使用量が増えることがあります。

手動の全量収集で頻出値も収集するには、`WITH HOT VALUE` を使用します。

```sql
ANALYZE TABLE lineitem WITH SYNC WITH HOT VALUE;
```

`WITH HOT VALUE` と `WITH SAMPLE` を併用しないでください。サンプリング収集では常に頻出値が収集されるため、`WITH SAMPLE` にこのオプションを指定すると拒否されます。`WITH HOT VALUE` を指定しない場合、Doris は従来の動作を維持します。

| 収集方法             | 頻出値の収集           |
| -------------------- | ---------------------- |
| 全量収集             | 無効                   |
| サンプリング収集     | 常に有効               |

### 自動収集

**目的**：バックグラウンドスレッドで定期的に走査し、統計情報を自動的に最新の状態に保ちます。

**スイッチ**：`ENABLE_AUTO_ANALYZE` 変数で制御します。

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE;  -- Enable auto collection
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; -- Disable auto collection
```

#### 動作の仕組み

有効にすると、バックグラウンドスレッドが `InternalCatalog` 内のすべてのデータベースとテーブルを定期的に走査します。各巡回で再収集するかどうかは、次の条件で判断します。

1. 統計情報がないカラムがテーブルに存在する。
2. テーブルの健全度がしきい値を下回る（デフォルトは 90、`table_stats_health_threshold` で制御）。健全度が 100 に近いほどデータの変化は小さく、90 未満の場合は統計情報との乖離が大きいため再収集が必要です。
3. 内部テーブルでデータが変化したものの、過去 24 時間に統計情報が収集されていない。

**走査間隔**：デフォルトは 5 分です（`auto_check_statistics_in_minutes` を `fe.conf` で設定）。最初の巡回はクラスタの起動から 5 分後に始まり、各巡回の完了後、スレッドは 5 分間待ってから次の巡回を開始します。

:::caution 注意
各巡回にかかる時間はテーブル数とデータ量に依存します。特定のテーブルが 5 分以内に収集される保証はありません。
:::

#### 主なパラメータ

| パラメータ                           | 用途                                | デフォルト     |
| ------------------------------------ | ----------------------------------- | -------------- |
| `auto_analyze_table_width_threshold` | 自動収集の対象となる最大カラム数    | 300            |
| `huge_table_default_sample_rows`     | 自動収集でサンプリングする行数      | 4194304 (2^22) |
| `auto_analyze_start_time`            | 自動収集の開始時刻                  | 0:00:00        |
| `auto_analyze_end_time`              | 自動収集の終了時刻                  | 23:59:59       |

**幅の広いテーブルの上限を調整**（幅の広いテーブルによる過剰なリソース消費を防ぐ）：

```sql
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**負荷の低い時間帯に実行**（業務への影響を抑える）：

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; -- Start time: 3:00 AM
SET GLOBAL auto_analyze_end_time   = "14:00:00"; -- End time: 2:00 PM
```

データ分布に関する情報の精度を高めるには、`huge_table_default_sample_rows` を増やしてサンプリングする行数を増やします。

### 外部テーブルの統計情報収集

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: Statistics for external tables such as Hive / Iceberg / JDBC / Paimon -->

**外部テーブルの種類**：主に Hive、Iceberg、JDBC、Paimon などです。

#### 対応状況

| 外部テーブルの種類 | 手動の全量収集 | 手動のサンプリング | 自動収集   |
| ------------------ | -------------- | ------------------ | ---------- |
| Hive               | 対応           | 対応               | 対応       |
| Iceberg            | 対応           | 非対応             | 非対応     |
| JDBC               | 対応           | 非対応             | 非対応     |
| その他             | 非対応         | 非対応             | 非対応     |

#### デフォルトの動作

外部カタログでは、大量の過去データを走査しないよう、デフォルトではカラム統計情報の自動収集を行わず、テーブルの行数のみを収集します。カラム統計情報の自動収集を有効にするには、次を実行します。

```sql
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='true');  -- Enable
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='false'); -- Disable
```

**テーブル単位での制御**（カタログのプロパティより優先されます）：

```sql
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "enable");          -- Enable
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "disable");         -- Disable
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "base_on_catalog"); -- Follow the catalog
```

外部テーブルには健全度という概念がありません。自動収集を有効にした場合、デフォルトでは外部テーブルの自動収集は 24 時間に一度だけ行われます。最小間隔は `external_table_auto_analyze_interval_in_millis` で調整できます。

#### 行数の推定方法

| 外部テーブルの種類 | 推定方法                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Hive               | まず Parameters の `numRows` を使用します。なければ `totalSize` とスキーマから推定し、それもなければファイルサイズに基づいて推定します。 |
| Iceberg            | スナップショット API を呼び出し、`total-records` と `total-position-deletes` を取得して計算します。 |
| Paimon             | スキャン API を呼び出し、各 split の行数を合計します。                                        |
| JDBC               | バックエンドデータベースの行数取得ステートメントで取得します（MySQL、Oracle、PostgreSQL、SQLServer に対応）。 |
| その他             | 自動取得と推定は現時点で非対応です。                                                         |

ファイルサイズの走査によるリソース消費が気になる場合は、Hive でファイルサイズに基づく推定を無効にできます。

```sql
SET GLOBAL enable_get_row_count_from_file_list = FALSE;
```

外部テーブルの推定行数を表示します。

```sql
SHOW TABLE STATS table_name;
```

:::tip ヒント
`row_count` が `-1` の場合、行数を取得できなかったか、テーブルが空であることを意味します。
:::

## 統計情報ジョブの管理

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: View, terminate, and delete statistics jobs and statistics results -->

### 統計情報ジョブの表示

**目的**：送信済みの非同期統計情報収集ジョブを表示します（同期ジョブの履歴は保持されません）。

**コマンド**：

```sql
SHOW ANALYZE [job_id];
```

詳しくは [SHOW ANALYZE](../../sql-manual/sql-statements/statistics/SHOW-ANALYZE) を参照してください。

**注意**：システムが保持するジョブ履歴は最大 20000 件です。出力カラムの意味は次のとおりです。

| カラム          | 説明                                       |
| --------------- | ------------------------------------------ |
| `job_id`        | 統計情報ジョブの ID                        |
| `catalog_name`  | カタログ名                                 |
| `db_name`       | データベース名                             |
| `tbl_name`      | テーブル名                                 |
| `col_name`      | カラム名の一覧（`index_name:column_name`） |
| `job_type`      | ジョブの種類                               |
| `analysis_type` | 統計情報の種類                             |
| `message`       | ジョブのメッセージ                         |
| `state`         | ジョブの状態                               |
| `progress`      | ジョブの進捗                               |
| `schedule_type` | スケジュールの種類                         |
| `start_time`    | ジョブの開始時刻                           |
| `end_time`      | ジョブの終了時刻                           |

**例**：

```sql
mysql> SHOW ANALYZE 245073\G
*************************** 1. row ***************************
              job_id: 93021
        catalog_name: internal
             db_name: tpch
            tbl_name: region
            col_name: [region:r_regionkey,region:r_comment,region:r_name]
            job_type: MANUAL
       analysis_type: FUNDAMENTALS
             message:
               state: FINISHED
            progress: 3 Finished  |  0 Failed  |  0 In Progress  |  3 Total
       schedule_type: ONCE
          start_time: 2024-07-11 15:15:00
            end_time: 2024-07-11 15:15:33
```

### 統計情報タスクの表示

**目的**：ジョブには複数のタスクを含めることができ、各タスクは単一のカラムに対応します。タスク単位の進捗を確認できます。

**コマンド**：

```sql
SHOW ANALYZE TASK STATUS [job_id];
```

**例**：

```sql
mysql> SHOW ANALYZE TASK STATUS 93021;
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| task_id | col_name    | index_name | message | last_state_change_time | time_cost_in_ms | state    |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| 93022   | r_regionkey | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93023   | r_comment   | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93024   | r_name      | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
```

### カラム統計情報の表示

**目的**：収集されたカラム単位の統計情報を表示します。

**コマンド**：

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```

**パラメータ**：

| パラメータ    | 説明                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| `cached`      | FE のメモリキャッシュ内にある統計情報のみを表示します。                             |
| `table_name`  | 対象テーブル。`db_name.table_name` 形式でも指定できます。                           |
| `column_name` | 対象カラム。カンマ区切りで複数指定できます。省略するとすべてのカラムを表示します。 |

**例**：

```sql
mysql> SHOW COLUMN STATS region (r_regionkey)\G
*************************** 1. row ***************************
  column_name: r_regionkey
   index_name: region
        count: 5.0
          ndv: 5.0
     num_null: 0.0
    data_size: 20.0
avg_size_byte: 4.0
          min: 0
          max: 4
       method: FULL
         type: FUNDAMENTALS
      trigger: MANUAL
  query_times: 0
 updated_time: 2024-07-11 15:15:33
1 row in set (0.36 sec)
```

### テーブル統計情報の概要表示

**目的**：テーブル単位で統計情報の収集状況を表示します。

**コマンド**：

```sql
SHOW TABLE STATS table_name;
```

`table_name` は `db_name.table_name` 形式でも指定できます。

**出力カラム**：

| カラム          | 説明                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `updated_rows`  | 前回の ANALYZE 以降にこのテーブルで更新された行数                     |
| `query_times`   | 将来のバージョンでクエリ回数を記録するための予約済みカラム             |
| `row_count`     | テーブルの行数（コマンド実行時の正確な行数を反映しない場合があります） |
| `updated_time`  | 統計情報が最後に更新された時刻                                        |
| `columns`       | 統計情報が収集されたカラム                                            |
| `trigger`       | 統計情報の収集を開始した方法                                          |
| `new_partition` | 新しいパーティションに初めてデータがロードされたかどうか              |
| `user_inject`   | ユーザーが統計情報を手動で設定したかどうか                              |

### 統計情報ジョブの終了

**目的**：実行中の非同期統計情報ジョブを終了します。

**コマンド**：

```sql
KILL ANALYZE job_id;
```

`job_id` は非同期の `ANALYZE` 実行時に返される値で、`SHOW ANALYZE` でも確認できます。

**例**：ID が 52357 の統計情報ジョブを終了します。

```sql
mysql> KILL ANALYZE 52357;
```

### 統計情報の削除

**目的**：存在するテーブルの統計情報を手動で削除します。削除済みのオブジェクトの統計情報はバックグラウンドで定期的に削除されるため、手動操作は不要です。

**コマンド**：

```sql
DROP STATS table_name;
```

## セッション変数と設定項目

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Tuning auto collection and statistics storage -->

### セッション変数

| セッション変数                        | 説明                                                                  | デフォルト                        |
| ------------------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| `auto_analyze_start_time`             | 自動収集の開始時刻                                                    | `0:00:00`                         |
| `auto_analyze_end_time`               | 自動収集の終了時刻                                                    | `23:59:59`                        |
| `enable_auto_analyze`                 | 自動収集を有効にするかどうか                                          | `TRUE`                            |
| `huge_table_default_sample_rows`      | 大きなテーブルからサンプリングする行数                                | `4194304`                         |
| `table_stats_health_threshold`        | 範囲は 0～100。データの (100 - threshold)% が変化すると統計情報を古いと見なします。 | `90`              |
| `auto_analyze_table_width_threshold`  | 自動収集の対象となる最大カラム数。この数を超えるテーブルは除外されます。 | `300`                          |
| `enable_get_row_count_from_file_list` | ファイルサイズから Hive テーブルの行数を推定するかどうか              | `TRUE`（`FALSE` がデフォルトだったのは 2.1.5 より前） |

### FE の設定項目

:::info 注意
通常、次の FE 設定項目を特別に調整する必要はありません。
:::

| FE の設定項目                               | 説明                                                      | デフォルト               |
| ------------------------------------------- | --------------------------------------------------------- | ------------------------ |
| `analyze_record_limit`                      | 永続化する統計情報ジョブの実行履歴の件数を制御します。    | `20000`                  |
| `stats_cache_size`                          | FE 側の統計情報キャッシュのエントリ数                     | `500000`                 |
| `statistics_simultaneously_running_task_num` | 同時に実行できる非同期統計情報ジョブの数                | `3`                      |
| `statistics_sql_mem_limit_in_bytes`         | 統計情報収集 SQL が使用できる BE メモリ量                 | `2L * 1024 * 1024` (2 GiB) |

## よくある質問（FAQ）

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Common troubleshooting for statistics-related issues -->

### Q1：テーブルの統計情報が収集されているか確認するには？

**ステップ 1**：収集結果があるか確認します。

```sql
SHOW COLUMN STATS table_name;
```

**ステップ 2**：統計情報が FE のキャッシュに読み込まれているか確認します。

```sql
SHOW COLUMN CACHED STATS table_name;
```

両方とも空の場合、そのテーブルには現在、統計情報がありません。統計情報が収集されている場合の出力例を次に示します。

```sql
mysql> SHOW COLUMN CACHED STATS mvTestDup;
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
| column_name | index_name | count | ndv  | num_null | data_size | avg_size_byte | min  | max  | method | type         | trigger | query_times | updated_time        |
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
| key1        | mvTestDup  | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 1    | 1001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| key2        | mvTestDup  | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 2    | 2001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value2      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 4    | 4001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value1      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 3    | 3001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| mv_key1     | mv1        | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 1    | 1001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value3      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 5    | 5001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
6 rows in set (0.00 sec)
```

**ステップ 3**：SQL を手動で実行し、精度を検証します。

```sql
SELECT count(1), ndv(col1), min(col1), max(col1) FROM table;
```

`count` と `ndv` の差が一桁以内であれば、精度は許容範囲内です。

### Q2：テーブルの統計情報が自動収集されないのはなぜですか？

**確認事項 1**：自動収集のスイッチがオンになっているか確認します。

```sql
SHOW VARIABLES LIKE "enable_auto_analyze";
-- If false, enable it:
SET GLOBAL enable_auto_analyze = TRUE;
```

**確認事項 2**：テーブルのカラム数が `auto_analyze_table_width_threshold`（デフォルトは 300）を超えていないか確認します。超えているテーブルは自動収集から除外されます。

```sql
SHOW VARIABLES LIKE "auto_analyze_table_width_threshold";
-- If smaller than the table width, adjust:
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**確認事項 3**：ほかのジョブが実行中か確認します。

```sql
SHOW AUTO ANALYZE;
```

自動収集は単一のスレッドで直列に実行され、すべてのデータベースとテーブルを巡回するため、巡回に時間がかかる場合があります。

### Q3：統計情報がないカラムがあるのはなぜですか？

統計情報を収集できるのは基本型のカラムだけです。複雑な型（JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2、VARBINARY など）は自動的にスキップされます。

### Q4：エラー `Stats table not available, please make sure your cluster status is normal`

通常、このエラーは内部の統計情報テーブルが正常でないことを意味します。次の手順で調査してください。

**ステップ 1**：すべての BE が正常な状態か確認します。

**ステップ 2**：統計情報テーブルのすべての `tabletId` を取得します。

```sql
SHOW TABLETS FROM internal.__internal_schema.column_statistics;
```

**ステップ 3**：tablet を順に診断します。

```sql
ADMIN DIAGNOSE TABLET tablet_id;
```

**ステップ 4**：異常な tablet を修復した後、統計情報を再収集します。

### Q5：統計情報の収集が間に合わない場合は？

- **緊急の場合**：対象テーブルで `ANALYZE` を手動で実行します。
- **健全度のしきい値を調整**：デフォルトの `table_stats_health_threshold = 90` では、データの 10% を超える変化があった場合にのみ収集が開始されます。95 に上げると、5% を超える変化で収集が開始されます。

```sql
SET GLOBAL table_stats_health_threshold = 95;
```

### Q6：自動収集でリソースを大量に消費する場合は？

自動収集はサンプリングを使用し、単一のスレッドで直列に実行されるため、通常はリソース使用量を制御できます。ただし、次のような場合はメモリ使用量が増えることがあります。

- パーティション数が多いテーブル。
- 個々の tablet が非常に大きいテーブル。

**改善案**：

1. テーブル作成時に tablet 数を適切に計画し、大きすぎる tablet を避けます。
2. システムの負荷が低い時間帯に自動収集を有効にします（`auto_analyze_start_time`／`auto_analyze_end_time` を参照）。
3. 大きなテーブルは負荷が低い時間帯に手動で収集します。
4. Doris 3.x シリーズでは、このような状況への対処がさらに最適化される予定です。
