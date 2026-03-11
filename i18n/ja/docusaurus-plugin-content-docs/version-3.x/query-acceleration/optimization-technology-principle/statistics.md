---
{
  "title": "統計 | 最適化技術原理",
  "sidebar_label": "統計",
  "description": "バージョン2.0以降、DorisはCost-Based 最適化 (CBO)機能をオプティマイザーに統合しました。統計情報はCBOの基盤となるものです。",
  "language": "ja"
}
---
# Statistics

バージョン2.0から、DorisはオプティマイザーにCost-Based 最適化 (CBO)機能を統合しました。統計情報はCBOの基盤であり、その精度はコスト推定の精度を直接決定し、最適な実行計画の選択において極めて重要です。本ドキュメントは、未リリースの開発バージョンにおける統計情報の使用方法のガイドとして、収集と管理方法、関連する設定オプション、よくある質問に焦点を当てています。

## 統計情報の収集

Dorisは内部tableの自動サンプリング収集をデフォルトで有効にしています。そのため、ほとんどの場合、ユーザーは統計情報の収集に注意を払う必要はありません。Dorisは各tableに対してカラムレベルで統計情報を収集します。収集される情報には以下が含まれます：

| Info of Statistics | デスクリプション                              |
| ------------------ | ---------------------------------------- |
| row_count          | 行の総数                                 |
| data_size          | カラムの総データサイズ                   |
| avg_size_byte      | カラムの1行あたりの平均データサイズ      |
| ndv                | 異なる値の数                             |
| min                | 最小値                                   |
| max                | 最大値                                   |
| null_count         | null値の数                               |

現在、システムはBOOLEAN、TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DATE、DATETIME、STRING、VARCHAR、TEXT等の基本データ型のカラムに対する統計情報の収集のみをサポートしています。

JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2等の複合型のカラムはスキップされます。

統計情報は手動または自動で収集でき、結果は`internal.__internal_schema.column_statistics`tableに格納されます。以下のセクションでは、これら2つの収集方法について詳しく説明します。

### 手動収集

DorisはユーザーがANALYZE文を送信することで、統計情報の収集と更新を手動でトリガーすることを可能にします。

**1. 構文**

SQLマニュアルANALYZEを参照してください

**2. 例**

`lineitem`tableのすべてのカラムの統計情報を収集：

```sql
ANALYZE TABLE lineitem;
```
`tpch100` データベース内のすべてのTableのすべてのカラムについて統計情報を収集します：

```sql
ANALYZE DATABASE tpch100;
```
`lineitem`Tableの`l_orderkey`と`l_linenumber`列の統計情報を100,000行をサンプリングして収集します（注意：正しい構文は`WITH SAMPLE ROWS`または`WITH SAMPLE PERCENT`を使用する必要があります）：

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```
### 自動収集

自動収集はバージョン2.0.3以降でサポートされており、一日を通してデフォルトで有効になっています。ユーザーは`ENABLE_AUTO_ANALYZE`変数を設定することで、この機能の有効化または無効化を制御できます：

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE; // Enable automatic collection  
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; // Disable automatic collection
```
有効にすると、バックグラウンドスレッドがクラスター内の`InternalCatalog`内のすべてのTableを定期的にスキャンします。統計情報の収集が必要なTableについて、システムは手動での介入なしに収集ジョブを自動的に作成し、実行します。

幅の広いTableの統計情報収集による過度なリソース使用を避けるため、300列を超えるTableはデフォルトでは自動収集されません。ユーザーはセッション変数`auto_analyze_table_width_threshold`を変更することで、この閾値を調整できます：

```sql
SET GLOBAL auto_analyze_table_width_threshold = 350;
```
自動収集のデフォルトポーリング間隔は5分です（`fe.conf`の`auto_check_statistics_in_minutes`設定で調整可能）。最初のイテレーションはクラスタ起動の5分後に開始されます。収集が必要なすべてのTableの処理が完了した後、バックグラウンドスレッドは次のイテレーションを開始する前に5分間スリープします。したがって、Tableの数やサイズに基づいてすべてのTableを反復処理する時間が変動するため、Tableの統計が5分以内に収集されることは保証されません。

Tableがポーリングされると、システムはまず統計収集が必要かどうかを判断します。必要であれば収集ジョブが作成され実行されます。そうでなければTableはスキップされます。統計収集は以下の場合に必要となります：

1. Tableに統計のない列がある。

2. Tableのヘルスが閾値を下回っている（デフォルト90、`table_stats_health_threshold`で調整可能）。ヘルスは前回の統計収集以降に変更されていないデータの割合を示します：100は変更なし、0はすべて変更、90を下回るヘルスは現在の統計に大きな偏差があることを示し、再収集が必要です。

3. 内部Tableの場合、データは変更されているが、過去24時間以内に統計情報が収集されていない

バックグラウンドジョブのオーバーヘッドを削減し収集速度を向上させるため、自動収集はデフォルトでサンプリングを使用し、4,194,304（`2^22`）行をサンプリングします。ユーザーはより正確なデータ分布情報のため、`huge_table_default_sample_rows`を変更してサンプリングサイズを調整できます。

自動収集ジョブがビジネス運用に干渉することを防ぐため、ユーザーは`auto_analyze_start_time`と`auto_analyze_end_time`を設定して要件に基づいて自動収集の実行ウィンドウを指定できます：

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; // Set the start time to 3 AM  
SET GLOBAL auto_analyze_end_time = "14:00:00"; // Set the end time to 2 PM
```
### External Table Collection

外部Tableには通常、Hive、Iceberg、JDBC、その他のタイプが含まれます。

- 手動収集：Hive、Iceberg、JDBCTableは手動統計収集をサポートしています。HiveTableは完全収集とサンプル収集の両方をサポートしていますが、IcebergとJDBCTableは完全収集のみをサポートしています。その他の外部Tableタイプは手動収集をサポートしていません。

- 自動収集：現在、HiveTableのみがサポートされています。

外部カタログは、大量の履歴データを含むことが多く、自動収集時に過剰なリソースを消費する可能性があるため、デフォルトでは自動カラム統計収集に参加しません。実際に必要な場合は、プロパティを設定することで外部カタログの自動カラム統計収集を有効または無効にすることができます：

```sql
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='true'); // Enable automatic column statistics collection
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='false'); // Disable automatic column statistics collection
```
Catalog全体を制御する粒度が大きすぎる場合、Tableレベルでの列統計収集の有効化と無効化もサポートしています。

 ```sql
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "enable"); // Enable automatic collection of column statistical for this table (the priority is higher than the enable.auto.analyze property of the カタログ).
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "disable"); // Disnable automatic collection of column statistical for this table (the priority is higher than the enable.auto.analyze property of the カタログ).
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "base_on_catalog"); // It is determined by the enable.auto.analyze property of the table's カタログ.
 ```
外部Tableにはヘルスの概念がありません。カタログ/Tableで自動収集列統計が有効になっている場合、システムは頻繁な収集を避けるため、外部Tableの統計を最大24時間に1回収集するよう既定で設定されています。`external_table_auto_analyze_interval_in_millis`変数を使用して、外部Tableの最小収集間隔を調整できます。

既定では、外部Tableは列統計を収集せず、システムはTableの行数情報の取得のみを試行します。異なる外部Tableの行数情報を収集する方法は以下の通りです。

**1. Hive Tablesの場合:**

Dorisは最初にHiveTableのParametersから`numRows`または`totalSize`情報の取得を試行します：

- `numRows`が見つかった場合、その値がTableの行数として使用されます。

- `numRows`が見つからないが`totalSize`が利用可能な場合、Tableのスキーマと`totalSize`に基づいて行数が推定されます。

- `totalSize`も利用できない場合、既定では、システムはHiveTableに対応するファイルサイズとそのSchemaに基づいて行数を推定します。ファイルサイズの取得が過度なリソースを消費する懸念がある場合、以下の変数を設定してこの機能を無効にできます。

  ```sql
  SET GLOBAL enable_get_row_count_from_file_list = FALSE
  ```
**2. IcebergTableの場合:**

DorisはIcebergのsnapshotAPIを呼び出して`total-records`と`total-position-deletes`の情報を取得し、Tableの行数を計算します。

**3. PaimonTableの場合:**

DorisはPaimonのscan APIを呼び出して各Splitに含まれる行数を取得し、Splitの行数を合計してTableの行数を計算します。

**4. JDBCTableの場合:**

DorisはTable統計を読み取るSQLをリモートデータベースに送信してTableの行数を取得します。これは、リモートデータベースがTableの行数情報を収集している場合にのみ実現できます。現在、DorisはMySQL、Oracle、PostgreSQL、SQLServerのTableの行数取得をサポートしています。

**5. その他の外部Tableの場合:**

自動的な行数取得と推定は現在サポートされていません。

ユーザーは以下のコマンドを使用して外部Tableの推定行数を確認できます（詳細は`Viewing Table Statistics 概要`を参照）：

```sql
SHOW table stats table_name;
```
- `row_count` が `-1` と表示される場合、行数情報を取得できなかったか、Tableが空です。

## 統計ジョブ管理

### 統計ジョブの表示

統計収集ジョブの情報を表示するには `SHOW ANALYZE` を使用します。現在、システムは20,000件の履歴ジョブの情報のみを保持します。このコマンドで表示できるのは非同期ジョブの情報のみであることに注意してください。同期ジョブ（`WITH SYNC` を使用）は履歴ジョブ情報を保持しません。

**1. 構文**:

SQL manual SHOW ANALYZE を参照してください

**2. 出力**:

以下の列を含みます:

| Column Name   | デスクリプション                                   |
| ------------- | --------------------------------------------- |
| job_id        | Statistics job ID                             |
| catalog_name  | カタログ name                                  |
| db_name       | Database name                                 |
| tbl_name      | Table name                                    |
| col_name      | List of column names (index_name:column_name) |
| job_type      | Job type                                      |
| analysis_type | Statistics type                               |
| message       | Job information                               |
| state         | Job state                                     |
| progress      | Job progress                                  |
| schedule_type | Scheduling type                               |
| start_time    | Job start time                                |
| end_time      | Job end time                                  |

**3. 例:**

```sql
mysql show analyze 245073\G;
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

各コレクションジョブには1つ以上のタスクを含めることができ、各タスクは単一列のコレクションに対応します。ユーザーは以下のコマンドを使用して、各列の統計情報収集の完了状況を表示できます。

**1. 構文:**

```sql
SHOW ANALYZE TASK STATUS [job_id]
```
**2. 例:**

```sql
mysql> show analyze task status 93021;
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| task_id | col_name    | index_name | message | last_state_change_time | time_cost_in_ms | state    |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| 93022   | r_regionkey | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93023   | r_comment   | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93024   | r_name      | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
```
### 統計情報の表示

ユーザーは `SHOW COLUMN STATS` コマンドを使用して収集された列統計情報を表示できます。

**1. 構文:**

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```
各項目の説明:

- `cached`: FEメモリに現在キャッシュされている統計情報を表示します。

- `table_name`: 統計情報が収集された対象Table。`db_name.table_name`の形式で指定できます。

- `column_name`: 指定された対象カラム。`table_name`に存在する必要があり、複数のカラム名はカンマで区切ります。未指定の場合、すべてのカラムの情報を表示します。

**2. 例:**

```sql
mysql> show column stats region (r_regionkey)\G
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
### Table統計の概要の表示

`SHOW TABLE STATS` を使用してTable統計収集の概要を表示します。

**1. 構文:**

```sql
SHOW TABLE STATS table_name;
```
場所: `table_name`: 対象Table名。`db_name.table_name`の形式で指定できます。

**2. 出力:**

以下のカラムを含みます:

| Column Name   | デスクリプション                                                  |
| ------------- | ------------------------------------------------------------ |
| updated_rows  | 最後のANALYZE以降にTableで更新された行数   |
| query_times   | 予約カラム。将来のバージョンでTableに対するクエリ数を記録するため |
| row_count     | Tableの行数（コマンド実行時の正確な数を反映していない場合があります） |
| updated_time  | 最後の統計更新時刻                           |
| columns       | 統計が収集されたカラム             |
| trigger       | 統計がトリガーされた方法                    |
| new_partition | 初回データインポートを含む新しいパーティションがあるかどうか |
| user_inject   | ユーザーによって統計が手動で注入されたかどうか        |

**3. 例:**

```sql
mysql> show column stats region (r_regionkey)\G
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
### 統計ジョブの停止

現在実行中の非同期統計ジョブを終了するには、`KILL ANALYZE`を使用します。

**1. 構文：**

```sql
KILL ANALYZE job_id;
```
Where: `job_id`: 統計ジョブのID。これは`ANALYZE`で非同期統計収集を実行したときに返される値、または`SHOW ANALYZE`文を使用して取得される値です。

**2. 例:**

ID 52357の統計ジョブを終了します。

```sql
mysql> KILL ANALYZE 52357;
```
### 統計情報の削除

カタログ、Database、またはTableが削除された場合、ユーザーは手動でその統計情報を削除する必要はありません。バックグラウンドプロセスが定期的にこの情報をクリーンアップするためです。

ただし、まだ存在するTableについては、システムは自動的にその統計情報をクリアしません。この場合、ユーザーは以下の構文を使用して手動で削除する必要があります：

```sql
DROP STATS table_name
```
## Session Variables と 構成 Options

### Session Variables

| Session Variable                    | 説明                                                  | デフォルト値                       |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| auto_analyze_start_time             | 自動統計収集の開始時刻               | 0:00:00                             |
| auto_analyze_end_time               | 自動統計収集の終了時刻                 | 23:59:59                            |
| enable_auto_analyze                 | 自動収集機能を有効にするかどうか         | TRUE                                |
| huge_table_default_sample_rows      | 大きなTableに対してサンプリングする行数                    | 4194304                             |
| table_stats_health_threshold        | 値の範囲は0-100で、前回の統計収集以降に更新されたデータの割合を示し、(100 - table_stats_health_threshold)%で統計が古いとみなされる | 90                                  |
| auto_analyze_table_width_threshold  | 自動統計収集の最大Table幅を制御し、この列数を超えるTableは自動統計収集に参加しない | 300                                 |
| enable_get_row_count_from_file_list | ファイルサイズに基づいてHiveTableの行数を推定するかどうか | FALSE (2.1.5以降はデフォルトでTRUE) |

### FE 構成

:::info Note

以下のFE設定オプションは通常、特別な注意を必要としません。

:::

| FE 構成 Option                    | 説明                                                  | デフォルト値           |
| ------------------------------------------ | ------------------------------------------------------------ | ----------------------- |
| analyze_record_limit                       | 統計ジョブ実行記録の永続化行数を制御する | 20000                   |
| stats_cache_size                           | FE側でキャッシュされる統計エントリ数           | 500000                  |
| statistics_simultaneously_running_task_num | 同時に実行できる非同期統計ジョブ数 | 3                       |
| statistics_sql_mem_limit_in_bytes          | 各統計SQLが占有できるBEメモリ量を制御する | 2L * 1024 * 1024 (2GiB) |

## FAQs

### Q1: Tableに統計が収集されているか、および内容が正しいかを確認するにはどうすればよいですか？

まず、`show column stats table_name`を実行して、統計の出力があるかを確認します。

次に、`show column cached stats table_name`を実行して、Tableの統計がキャッシュにロードされているかを確認します。

```sql
mysql> show column stats test_table\G
Empty set (0.02 sec)

mysql> show column cached stats test_table\G
Empty set (0.00 sec)
```
空の結果は、現在`test_table`に対する統計情報が存在しないことを示しています。統計情報が存在する場合、結果は以下のようになります：

```sql
mysql> show column cached stats mvTestDup;
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
統計情報が存在する場合、SQLクエリを手動で実行してその正確性を検証することができます。

```sql
Select count(1), ndv(col1), min(col1), max(col1) from table
```
`count`と`ndv`のエラーが1桁以内の範囲にある場合、精度は一般的に許容可能です。

### Q2: Tableの統計情報が自動収集されないのはなぜですか？

まず、自動収集が有効になっているかどうかを確認してください：

```sql
Show variables like "enable_auto_analyze";  // If false, set it to true:  

Set global enable_auto_analyze = true
```
既にtrueの場合は、Table内のカラム数を確認してください。`auto_analyze_table_width_threshold`を超えている場合、そのTableは自動収集に参加しません。この値をTableの現在のカラム数より大きくなるように変更してください：

```sql
Show variables like "auto_analyze_table_width_threshold"  

// If the value is less than the width of the table, you can modify it:

Set global auto_analyze_table_width_threshold=350
```
カラム数が閾値を超えない場合は、`show auto analyze`を実行して他のコレクションタスクが実行中（running状態）かどうかを確認してください。自動収集は単一スレッドによってシリアルに実行されるため、すべてのデータベースとTableをポーリングすることで実行サイクルが長くなる可能性があります。

### Q3: 一部のカラムで統計が利用できないのはなぜですか？

現在、システムは基本データ型のカラムに対してのみ統計収集をサポートしています。JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2などの複合型については、システムはそれらをスキップします。

### Q4: エラー: "Stats table not available, please make sure your cluster status is normal"

このエラーは通常、内部統計Tableが正常でない状態にあることを示しています。

まず、クラスター内のすべてのBE（Backend）が正常な状態にあるかを確認し、それらがすべて正しく機能していることを確かめてください。

次に、以下のステートメントを実行してすべての`tabletId`（出力の最初のカラム）を取得してください：

```sql
show tablets from internal.__internal_schema.column_statistics;
```
その後、各タブレットの`tablet_id`を使用してステータスを確認します：

```sql
ADMIN DIAGNOSE TABLET tablet_id
```
異常なtabletが見つかった場合は、統計を再収集する前にまずそれらを修復してください。

### Q5: 統計収集のタイミングが適切でない問題にはどのように対処できますか？

自動収集の間隔は不確実で、システム内のTableの数とサイズに依存します。緊急の場合は、Tableに対して手動で`analyze`操作を実行してください。

大量のデータをインポートした後に自動収集がトリガーされない場合は、`table_stats_health_threshold`パラメータの調整を検討してください。デフォルト値は90で、これはTableのデータの10%以上（100 - 90）が変更された時に自動収集がトリガーされることを意味します。この値を例えば95に増加させることで、Tableのデータの5%以上が変更された時に統計が再収集されるようになります。

### Q6: 自動収集時の過剰なリソース使用量にはどのように対処できますか？

自動収集はサンプリングを使用し、フルTableスキャンは不要で、タスクは単一のスレッドによって順次実行されます。通常、システムリソースの使用量は管理可能で、通常のクエリタスクに影響を与えません。

多くのパーティションを持つTableや個別のtabletが大きいTableなど、一部の特殊なTableでは、メモリ使用量が高くなる可能性があります。

Table作成時にtabletの数を合理的に計画し、過大なtabletの作成を避けることを推奨します。tabletの構造が容易に調整できない場合は、ビジネス運用への影響を避けるため、オフピーク時間に自動収集を有効にするか、大きなTableの統計を手動で収集することを検討してください。Doris 3.xシリーズでは、このようなシナリオに対する最適化を行う予定です。
