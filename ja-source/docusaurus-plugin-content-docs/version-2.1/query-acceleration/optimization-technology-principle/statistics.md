---
{
  "title": "統計 | 最適化技術原理",
  "language": "ja",
  "description": "バージョン2.0から、DorisはCost-Based Optimization (CBO)機能をオプティマイザに統合しました。統計情報はCBOの基盤です。",
  "sidebar_label": "Statistics"
}
---
# 統計情報

バージョン2.0から、DorisはオプティマイザーにCost-Based Optimization（CBO）機能を統合しました。統計情報はCBOの基盤であり、その精度がコスト推定の精度を直接決定し、最適な実行計画の選択にとって重要です。このドキュメントは、未リリースの開発バージョンの統計情報使用ガイドとして、収集と管理方法、関連する設定オプション、よくある質問に焦点を当てています。

## 統計情報の収集

Dorisはデフォルトで内部テーブルの自動サンプリング収集を有効にしています。そのため、ほとんどの場合、ユーザーは統計情報の収集に注意を払う必要がありません。Dorisは各テーブルのカラムレベルで統計情報を収集します。収集される情報には以下が含まれます：

| 統計情報 | 説明 |
| ------------------ | ---------------------------------------- |
| row_count          | 行の総数                     |
| data_size          | カラムの総データサイズ            |
| avg_size_byte      | カラムの1行あたりの平均データサイズ |
| ndv                | 個別値数                |
| min                | 最小値                            |
| max                | 最大値                            |
| null_count         | null値の数                    |

現在、システムはBOOLEAN、TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DATE、DATETIME、STRING、VARCHAR、TEXTなどの基本データ型のカラムについてのみ統計情報の収集をサポートしています。

JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2などの複合型のカラムはスキップされます。

統計情報は手動または自動で収集でき、結果は`internal.__internal_schema.column_statistics`テーブルに格納されます。以下のセクションでは、これら2つの収集方法について詳しく説明します。

### 手動収集

DorisではユーザーがANALYZEステートメントを送信することで、統計情報の収集と更新を手動でトリガーできます。

**1. 構文**

```sql
ANALYZE < TABLE table_name > | < DATABASE db_name > 
    [ (column_name [, ...]) ]
    [ [ WITH SYNC ] [ WITH SAMPLE PERCENT | ROWS ] ];
```
パラメータ説明:

- `table_name`: 統計情報を収集する対象テーブルを指定します。

- `column_name`: 統計情報を収集する対象カラムを指定します。これらのカラムは`table_name`に存在する必要があり、複数のカラム名はカンマで区切ります。カラム名が指定されない場合、テーブル内のすべてのカラムの統計情報が収集されます。

- `sync`: 統計情報を同期的に収集するオプションパラメータです。指定された場合、収集完了後に結果が返されます。指定されない場合、操作は非同期で実行され、JOB IDが返されます。このIDは収集タスクのステータス確認に使用できます。

- `sample percent | rows`: 統計情報収集時のサンプリングのオプションパラメータです。サンプリング割合または行数を指定できます。`WITH SAMPLE`が指定されない場合、フルテーブルスキャンが実行されます。大きなテーブル（例：5 GiB以上）の場合、クラスタリソース使用率の観点から一般的にサンプリングが推奨されます。統計情報の精度を確保するため、最低400万行のサンプリングが推奨されます。

**2. 例**

`lineitem`テーブルのすべてのカラムの統計情報を収集:

```sql
ANALYZE TABLE lineitem;
```
`tpch100`データベース内のすべてのテーブルのすべての列について統計情報を収集します：

```sql
ANALYZE DATABASE tpch100;
```
`lineitem`テーブルの`l_orderkey`と`l_linenumber`列の統計情報を100,000行をサンプリングして収集します（注：正しい構文として`WITH SAMPLE ROWS`または`WITH SAMPLE PERCENT`を使用する必要があります）：

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```
### 自動収集

自動収集はバージョン2.0.3以降でサポートされており、一日中デフォルトで有効になっています。ユーザーは`ENABLE_AUTO_ANALYZE`変数を設定することで、この機能の有効化または無効化を制御できます：

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE; // Enable automatic collection  
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; // Disable automatic collection
```
有効にすると、バックグラウンドスレッドがクラスター内の`InternalCatalog`内のすべてのテーブルを定期的にスキャンします。統計情報の収集が必要なテーブルに対して、システムは手動での介入なしに自動的に収集ジョブを作成・実行します。

幅の広いテーブルの統計情報収集による過度なリソース使用を避けるため、300列を超えるテーブルはデフォルトでは自動収集されません。ユーザーはセッション変数`auto_analyze_table_width_threshold`を変更することで、この閾値を調整できます：

```sql
SET GLOBAL auto_analyze_table_width_threshold = 350;
```
自動収集のデフォルトのポーリング間隔は5分です（`fe.conf`の`auto_check_statistics_in_minutes`設定で調整可能）。最初の反復は、クラスター起動後5分で開始されます。収集が必要なすべてのテーブルの処理が完了した後、バックグラウンドスレッドは5分間スリープしてから次の反復を開始します。したがって、すべてのテーブルを反復処理する時間は、テーブルの数とサイズに基づいて変動する可能性があるため、テーブルの統計が5分以内に収集される保証はありません。

テーブルがポーリングされると、システムはまず統計収集が必要かどうかを判断します。必要な場合、収集ジョブが作成され実行されます。そうでなければ、テーブルはスキップされます。統計収集が必要なケース：

1. テーブルに統計のない列がある。

2. テーブルのヘルス値がしきい値を下回っている（デフォルト90、`table_stats_health_threshold`で調整可能）。ヘルス値は、前回の統計収集以降に変更されていないデータの割合を示します：100は変更なし、0はすべて変更、90を下回るヘルス値は現在の統計に大きな偏差があることを示し、再収集が必要です。

バックグラウンドジョブのオーバーヘッドを削減し収集速度を向上させるため、自動収集はデフォルトでサンプリングを使用し、4,194,304（`2^22`）行をサンプリングします。ユーザーは、より正確なデータ分布情報を得るために`huge_table_default_sample_rows`を変更してサンプリングサイズを調整できます。

自動収集ジョブが業務運用に干渉しないようにするため、ユーザーは`auto_analyze_start_time`と`auto_analyze_end_time`を設定することで、要件に基づいて自動収集の実行ウィンドウを指定できます：

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; // Set the start time to 3 AM  
SET GLOBAL auto_analyze_end_time = "14:00:00"; // Set the end time to 2 PM
```
### 外部テーブルコレクション

外部テーブルには通常、Hive、Iceberg、JDBC、その他のタイプが含まれます。

- 手動コレクション：Hive、Iceberg、JDBCテーブルは手動統計収集をサポートしています。Hiveテーブルは完全収集とサンプル収集の両方をサポートしていますが、IcebergとJDBCテーブルは完全収集のみをサポートしています。その他の外部テーブルタイプは手動収集をサポートしていません。

- 自動コレクション：現在、Hiveテーブルのみがサポートされています。

外部Catalogは、大量の履歴データを含むことが多く、自動収集時に過剰なリソースを消費する可能性があるため、デフォルトでは自動収集に参加しません。ただし、プロパティを設定することで外部Catalogの自動収集を有効または無効にすることができます：

```sql
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='true'); // Enable automatic collection  
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='false'); // Disable automatic collection
```
外部テーブルにはヘルスの概念がありません。Catalogで自動収集が有効になっている場合、システムは頻繁な収集を避けるため、デフォルトで外部テーブルの統計情報を24時間に一度のみ収集します。`external_table_auto_analyze_interval_in_millis`変数を使用して、外部テーブルの最小収集間隔を調整できます。

デフォルトでは、外部テーブルは統計情報を収集しませんが、HiveテーブルとIcebergテーブルについては、システムはHive MetastoreとIceberg APIを通じて行数情報の取得を試行します。

**1. Hiveテーブルの場合：**

DorisはまずHiveテーブルのParametersから`numRows`または`totalSize`の情報を取得しようとします：

- `numRows`が見つかった場合、その値がテーブルの行数として使用されます。

- `numRows`が見つからないが`totalSize`が利用可能な場合、テーブルのスキーマと`totalSize`に基づいて行数が推定されます。

- `totalSize`も利用できない場合、デフォルトでは、システムはHiveテーブルに対応するファイルサイズとそのSchemaに基づいて行数を推定します。ファイルサイズの取得が過剰なリソースを消費する可能性を懸念する場合、以下の変数を設定してこの機能を無効にできます。

  ```sql
  SET GLOBAL enable_get_row_count_from_file_list = FALSE
  ```
**2. Icebergテーブルの場合:**

DorisはIcebergのsnapshot APIを呼び出して`total-records`と`total-position-deletes`の情報を取得し、テーブルの行数を計算します。

**3. Paimonテーブルの場合:**

DorisはPaimonのscan APIを呼び出して各Splitに含まれる行数を取得し、Splitの行数を合計してテーブルの行数を計算します。

**4. JDBCテーブルの場合:**

Dorisはテーブル統計情報を読み取るSQLをリモートデータベースに送信し、テーブルの行数を取得します。これは、リモートデータベースがテーブルの行数情報を収集している場合にのみ実現できます。現在、DorisはMySQL、Oracle、PostgreSQL、SQLServerのテーブルの行数取得をサポートしています。

**5. その他の外部テーブルの場合:**

自動的な行数取得と推定は現在サポートされていません。

ユーザーは以下のコマンドを使用して外部テーブルの推定行数を表示できます（詳細は`テーブル統計情報概要の表示`を参照）:

```sql
SHOW table stats table_name;
```
- `row_count` が `-1` と表示される場合、行数情報を取得できなかったか、テーブルが空です。

## Statistics Job Management

### 統計ジョブの表示

統計収集ジョブの情報を表示するには `SHOW ANALYZE` を使用します。現在、システムは過去20,000件のジョブ情報のみを保持します。このコマンドを使用して表示できるのは非同期ジョブの情報のみであることに注意してください。同期ジョブ（`WITH SYNC` を使用）は過去のジョブ情報を保持しません。

**1. 構文**：

```sql
SHOW [AUTO] ANALYZE < table_name | job_id >
    [ WHERE STATE = < "PENDING" | "RUNNING" | "FINISHED" | "FAILED" > ];
```
- `AUTO`: 過去の自動収集ジョブに関する情報を表示します。未指定の場合、手動の `ANALYZE` 履歴ジョブに関する情報を表示します。

- `table_name`: テーブル名。指定すると、そのテーブルの統計ジョブ情報を表示できます。`db_name.table_name` の形式で指定可能です。未指定の場合、すべての統計ジョブに関する情報を返します。

- `job_id`: 統計ジョブID。非同期 `ANALYZE` 収集の実行時に取得されます。未指定の場合、コマンドはすべての統計ジョブに関する情報を返します。

**2. 出力**:

以下の列を含みます:

| 列名          | 説明                                          |
| ------------- | --------------------------------------------- |
| job_id        | 統計ジョブID                                  |
| catalog_name  | カタログ名                                    |
| db_name       | データベース名                                |
| tbl_name      | テーブル名                                    |
| col_name      | 列名のリスト (index_name:column_name)         |
| job_type      | ジョブタイプ                                  |
| analysis_type | 統計タイプ                                    |
| message       | ジョブ情報                                    |
| state         | ジョブ状態                                    |
| progress      | ジョブ進捗                                    |
| schedule_type | スケジューリングタイプ                        |
| start_time    | ジョブ開始時刻                                |
| end_time      | ジョブ終了時刻                                |

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
### 統計情報表示タスク

各収集ジョブには1つ以上のタスクを含めることができ、各タスクは単一列の収集に対応しています。ユーザーは以下のコマンドを使用して、各列の統計情報収集の完了状況を確認できます。

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
### 統計の表示

ユーザーは`SHOW COLUMN STATS`コマンドを使用して、収集された列統計を表示できます。

**1. 構文:**

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```
ここで：

- `cached`: FE メモリに現在キャッシュされている統計情報を表示します。

- `table_name`: 統計情報が収集された対象テーブル。`db_name.table_name` の形式で指定できます。

- `column_name`: 指定された対象カラム。`table_name` に存在する必要があり、複数のカラム名はカンマで区切ります。未指定の場合、すべてのカラムの情報を表示します。

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
### テーブル統計情報概要の表示

`SHOW TABLE STATS`を使用して、テーブル統計情報収集の概要を表示します。

**1. 構文:**

```sql
SHOW TABLE STATS table_name;
```
項目: `table_name`: 対象テーブル名。`db_name.table_name`の形式で指定可能。

**2. 出力:**

以下の列が含まれます:

| 列名          | 説明                                                         |
| ------------- | ------------------------------------------------------------ |
| updated_rows  | 前回のANALYZE以降にテーブルで更新された行数                   |
| query_times   | 予約列。将来のバージョンでテーブルに対するクエリ数を記録するため |
| row_count     | テーブル内の行数（コマンド実行時の正確な数を反映しない場合があります） |
| updated_time  | 最後の統計更新時刻                                           |
| columns       | 統計が収集された列                                           |
| trigger       | 統計がトリガーされた方法                                     |
| new_partition | 初回データインポートを伴う新しいパーティションがあるかどうか   |
| user_inject   | 統計がユーザーによって手動で注入されたかどうか               |

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

**1. 構文:**

```sql
KILL ANALYZE job_id;
```
ここで：`job_id`：統計ジョブのIDです。これは`ANALYZE`で非同期統計収集を実行する際に返される値、または`SHOW ANALYZE`文を使用して取得される値です。

**2. 例：**

ID 52357の統計ジョブを終了します。

```sql
mysql> KILL ANALYZE 52357;
```
### 統計情報の削除

Catalog、Database、またはTableが削除された場合、ユーザーは手動でその統計情報を削除する必要はありません。バックグラウンドプロセスが定期的にこの情報をクリーンアップします。

ただし、まだ存在しているテーブルについては、システムは自動的にその統計情報をクリアしません。この場合、ユーザーは以下の構文を使用して手動で削除する必要があります：

```sql
DROP STATS table_name
```
## セッション変数と設定オプション

### セッション変数

| セッション変数                    | 説明                                                  | デフォルト値                       |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| auto_analyze_start_time             | 自動統計情報収集の開始時刻               | 0:00:00                             |
| auto_analyze_end_time               | 自動統計情報収集の終了時刻                 | 23:59:59                            |
| enable_auto_analyze                 | 自動収集機能を有効にするかどうか         | TRUE                                |
| huge_table_default_sample_rows      | 大きなテーブルに対してサンプリングする行数                    | 4194304                             |
| table_stats_health_threshold        | 値の範囲は0-100で、前回の統計情報収集以降に更新されたデータの割合を示し、(100 - table_stats_health_threshold)%の時点で統計情報が古いとみなされる | 90                                  |
| auto_analyze_table_width_threshold  | 自動統計情報収集の最大テーブル幅を制御し、この列数を超えるテーブルは自動統計情報収集に参加しない | 300                                 |
| enable_get_row_count_from_file_list | Hiveテーブルの行数をファイルサイズに基づいて推定するかどうか | FALSE（2.1.5以降はデフォルトでTRUE） |

### FE設定

:::info 注記

以下のFE設定オプションは通常、特別な注意を払う必要はありません。

:::

| FE設定オプション                    | 説明                                                  | デフォルト値           |
| ------------------------------------------ | ------------------------------------------------------------ | ----------------------- |
| analyze_record_limit                       | 統計情報ジョブ実行記録の永続化行数を制御 | 20000                   |
| stats_cache_size                           | FE側でキャッシュされる統計情報エントリ数           | 500000                  |
| statistics_simultaneously_running_task_num | 同時に実行可能な非同期統計情報ジョブ数 | 3                       |
| statistics_sql_mem_limit_in_bytes          | 各統計情報SQLが占有できるBEメモリ量を制御 | 2L * 1024 * 1024 (2GiB) |

## よくある質問

### Q1: テーブルに統計情報が収集されているか、および内容が正しいかを確認するにはどうすればよいですか？

まず、`show column stats table_name`を実行して統計情報の出力があるかを確認します。

次に、`show column cached stats table_name`を実行してテーブルの統計情報がキャッシュに読み込まれているかを確認します。

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
統計情報が存在する場合、SQLクエリを手動で実行してその精度を検証することができます。

```sql
Select count(1), ndv(col1), min(col1), max(col1) from table
```
`count`と`ndv`のエラーが1桁以内であれば、精度は一般的に許容範囲です。

### Q2: テーブルの統計情報が自動収集されないのはなぜですか？

まず、自動収集が有効になっているかを確認してください：

```sql
Show variables like "enable_auto_analyze";  // If false, set it to true:  

Set global enable_auto_analyze = true
```
既にtrueの場合は、テーブルの列数を確認してください。`auto_analyze_table_width_threshold`を超えている場合、そのテーブルは自動収集に参加しません。この値をテーブルの現在の列数より大きくなるよう変更してください：

```sql
Show variables like "auto_analyze_table_width_threshold"  

// If the value is less than the width of the table, you can modify it:

Set global auto_analyze_table_width_threshold=350
```
カラム数が閾値を超えない場合は、`show auto analyze` を実行して他のコレクションタスクが実行中（running状態）かどうかを確認してください。自動コレクションは単一スレッドでシリアルに実行されるため、すべてのデータベースとテーブルをポーリングすることで実行サイクルが長くなる可能性があります。

### Q3: 一部のカラムで統計が利用できないのはなぜですか？

現在、システムは基本データ型のカラムの統計収集のみをサポートしています。JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2などの複合型については、システムはそれらをスキップします。

### Q4: エラー: "Stats table not available, please make sure your cluster status is normal"

このエラーは通常、内部統計テーブルが不健全な状態にあることを示しています。

まず、クラスター内のすべてのBE（Backend）が正常な状態にあるかどうかを確認し、それらがすべて正しく機能していることを確認してください。

次に、以下のステートメントを実行してすべての`tabletId`（出力の最初の列）を取得してください：

```sql
show tablets from internal.__internal_schema.column_statistics;
```
次に、`tablet_id`を使用して各タブレットのステータスを確認します：

```sql
ADMIN DIAGNOSE TABLET tablet_id
```
異常なtabletが見つかった場合は、統計の再収集を行う前に、まずそれらを修復してください。

### Q5: 統計収集のタイミングが適切でない問題にはどのように対処すればよいですか？

自動収集の間隔は不確実で、システム内のテーブルの数とサイズに依存します。緊急の場合は、テーブルに対して手動で`analyze`操作を実行してください。

大量のデータをインポートした後に自動収集がトリガーされない場合は、`table_stats_health_threshold`パラメータの調整を検討してください。デフォルト値は90で、テーブルのデータの10%以上（100 - 90）が変更された時に自動収集がトリガーされることを意味します。この値を例えば95に増加させることで、テーブルのデータの5%以上が変更された時に統計が再収集されるようになります。

### Q6: 自動収集中の過度なリソース使用にはどのように対処すればよいですか？

自動収集はサンプリングを使用し、フルテーブルスキャンは必要なく、タスクは単一スレッドによって順次実行されます。通常、システムリソースの使用量は管理可能で、通常のクエリタスクに影響を与えません。

多くのパーティションを持つテーブルや個々のtabletが大きいテーブルなど、一部の特殊なテーブルでは、メモリ使用量が高くなる可能性があります。

テーブル作成時にtablet数を合理的に計画し、過大なtabletの作成を避けることを推奨します。tabletの構造が調整しにくい場合は、ビジネス運営への影響を避けるため、オフピーク時間中に自動収集を有効にするか、大きなテーブルの統計を手動で収集することを検討してください。Doris 3.xシリーズでは、このようなシナリオに対する最適化を行う予定です。
