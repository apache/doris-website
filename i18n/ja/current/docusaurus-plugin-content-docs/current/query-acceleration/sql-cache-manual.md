---
{
  "title": "SQLキャッシュ",
  "language": "ja",
  "description": "SQLキャッシュは、Dorisによって提供されるクエリ最適化メカニズムであり、クエリパフォーマンスを大幅に向上させることができます。"
}
---
## 説明

SQL CacheはDorisが提供するクエリ最適化メカニズムで、クエリパフォーマンスを大幅に向上させることができます。クエリ結果をキャッシュすることで冗長な計算を削減し、データ更新が頻繁でないシナリオに適しています。

SQL Cacheは以下の主要な要因に基づいてキャッシュを保存・取得します：

- SQL Text

- View Definitions

- Table and Partition Versions

- User Variables and Result Values

- Non-deterministic Functions and Result Values

- Row Policy Definitions

- Data Masking Definitions

これらの要因の組み合わせがキャッシュされたデータセットを一意に決定します。SQLの変更、異なるクエリフィールドや条件、データ更新後のバージョン変更など、これらの要因のいずれかが変更された場合、キャッシュはヒットしません。

複数テーブルの結合を含むクエリの場合、テーブルの1つが更新されると、パーティションIDまたはバージョン番号が異なるため、キャッシュミスが発生します。

SQL CacheはT+1更新シナリオに非常に適しています。データは早朝に更新され、最初のクエリはBackend (BE)から結果を取得してキャッシュに保存し、同じ性質の後続クエリはキャッシュから直接結果を取得します。リアルタイムデータ更新でもSQL Cacheを使用できますが、キャッシュヒット率が低くなる可能性があります。

現在、SQL Cacheは内部のOlapTablesと外部のHiveテーブルの両方をサポートしています。

## 使用制限

### 非決定的関数

1. 非決定的関数とは、計算結果が入力パラメータと固定的な関係を形成しない関数を指します。

2. 一般的な関数`select now()`を例に取ります。これは現在の日時を返します。この関数は異なる時刻に実行されると異なる結果を返すため、その戻り値は動的に変化します。`now`関数は秒レベルで時刻を返すため、同じ秒内では前の秒のSQL Cacheを再利用できますが、次の秒には新しいSQL Cacheを作成する必要があります。

3. キャッシュ利用率を最適化するために、このような細かい粒度の時間を`select * from tbl where dt=date(now())`のように粗い粒度の時間に変換することを推奨します。この場合、同じ日内のクエリはSQL Cacheを活用できます。

4. 対照的に、`random()`関数は実行の度に結果が変わるため、キャッシュの利用が困難です。そのため、クエリではこのような非決定的関数の使用を可能な限り避けるべきです。

## 原理

### BE原理

ほとんどの場合、SQL Cache結果はコンシステントハッシュ法によってBEを選択し、そのBEのメモリに保存されます。これらの結果はHashMap構造で保存されます。キャッシュの読み書きリクエストが到着すると、システムはSQL文字列などのメタデータ情報のダイジェストをキーとして使用し、HashMapから結果データを迅速に取得・操作します。

### FE原理

Frontend (FE)がクエリリクエストを受信すると、まずSQL文字列を使用してメモリ内を検索し、同じクエリが以前に実行されたかどうかを判断し、そのクエリのメタデータ情報の取得を試みます。この情報には、クエリに関与するテーブルとパーティションのバージョンが含まれます。

これらのメタデータが変更されていない場合、対応するテーブル内のデータが変更されていないことを示し、以前のSQL Cacheの再利用が可能です。この場合、FEはSQL解析と最適化プロセスをスキップし、コンシステントハッシュアルゴリズムに基づいて対応するBEを直接特定し、そこからクエリ結果の取得を試みます。

- 対象のBEにクエリのキャッシュ結果が含まれている場合、FEは迅速にクライアントに結果を返すことができます。

- 逆に、BEに対応する結果キャッシュが見つからない場合、FEは完全なSQL解析と最適化プロセスを実行し、その後クエリプランをBEに送信して計算・処理を行う必要があります。

BEが計算結果をFEに返すとき、FEはこれらの結果を対応するBEに保存し、このクエリのメタデータ情報をメモリに記録する責任があります。これは、後に同じクエリを受信したときに、FEがBEから直接結果を取得できるようにして、クエリ効率を向上させるためです。

さらに、SQL最適化段階でクエリ結果が0または1行のデータのみを含むと判断された場合、FEは将来の同一クエリに対してより迅速に応答するために、これらの結果をメモリに保存することを選択します。

## 開始方法

### SQL Cacheの有効化と無効化

```sql
-- Enable SQL Cache for the current session, default is disabled  
set enable_sql_cache=true;  
-- Disable SQL Cache for the current session  
set enable_sql_cache=false;  
  
-- Globally enable SQL Cache, default is disabled  
set global enable_sql_cache=true;  
-- Globally disable SQL Cache  
set global enable_sql_cache=false;
```
### クエリがSQL Cacheにヒットするかどうかの確認

Doris バージョン2.1.3以降では、ユーザーは`explain plan`文を実行して、現在のクエリがSQL Cacheに正常にヒットしているかどうかを確認できます。

例に示すように、クエリプランツリーに`LogicalSqlCache`または`PhysicalSqlCache`ノードが含まれている場合、そのクエリがSQL Cacheにヒットしていることを示します。

```sql
> explain plan select * from t2;  
  
+------------------------------------------------------------------------------------------------------------+  
| Explain String (Nereids Planner)                                                                           |  
+------------------------------------------------------------------------------------------------------------+  
| ========== PARSED PLAN (time: 28ms) ==========                                                             |  
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
|                                                                                                            |  
| ========== ANALYZED PLAN ==========                                                                        |  
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
|                                                                                                            |  
| ========== REWRITTEN PLAN ==========                                                                       |  
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
|                                                                                                            |  
| ========== OPTIMIZED PLAN ==========                                                                       |  
| PhysicalSqlCache[3] ( queryId=711dea740e4746e6-8bc11afe08f6542c, backend=192.168.126.3:9051, rowCount=12 ) |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
+------------------------------------------------------------------------------------------------------------+
```
Doris 2.1.3より前のバージョンでは、ユーザーはクエリがSQL Cacheにヒットしたかどうかを確認するためにProfile情報をチェックする必要があります。Profile情報で、`Is Cached:`フィールドが`Yes`と表示されている場合、クエリがSQL Cacheに正常にヒットしたことを示します。

```sql
Execution  Summary:
      -  Parse  SQL  Time:  18ms
      -  Nereids  Analysis  Time:  N/A
      -  Nereids  Rewrite  Time:  N/A
      -  Nereids  Optimize  Time:  N/A
      -  Nereids  Translate  Time:  N/A
      -  Workload  Group:  normal
      -  Analysis  Time:  N/A
      -  Wait  and  Fetch  Result  Time:  N/A
      -  Fetch  Result  Time:  0ms
      -  Write  Result  Time:  0ms
      -  Doris  Version:  915138e801
      -  Is  Nereids:  Yes
      -  Is  Cached:  Yes
      -  Total  Instances  Num:  0
      -  Instances  Num  Per  BE:  
      -  Parallel  Fragment  Exec  Instance  Num:  1
      -  Trace  ID:  
      -  Transaction  Commit  Time:  N/A
      -  Nereids  Distribute  Time:  N/A
```
両方の方法は、ユーザーがクエリがSQL Cacheを利用しているかどうかを検証するための効果的な手段を提供し、ユーザーがクエリパフォーマンスをより良く評価し、クエリ戦略を最適化するのに役立ちます。

## Metrics and Monitor

**1. FEのHTTPインターフェース `http://${FE_IP}:${FE_HTTP_PORT}/metrics` は2つの関連するmetricsを返します:** この指標はヒット数をカウントし、増加のみで減少することはありません。FEが再起動されると、カウントは0から開始されます。

```Plain
# Represents that 1 SQL has been written to the cache  
doris_fe_cache_added{type="sql"} 1  
  
# Represents that the SQL Cache has been hit twice  
doris_fe_cache_hit{type="sql"} 2
```
**2. BE の HTTP インターフェース `http://${BE_IP}:${BE_HTTP_PORT}/metrics` は関連情報を返します:** 異なるキャッシュが異なる BE に保存される可能性があるため、完全な情報を取得するにはすべての BE からメトリクスを収集する必要があります。

```Plain
# Represents that there are 1205 caches in the memory of the current BE  
doris_be_query_cache_sql_total_count 1205  
  
# The current total memory occupied by all caches in the BE is 44k  
doris_be_query_cache_memory_total_byte 44101
```
## Memory Control

### FE Memory Control

FEでは、Cacheのメタデータ情報は弱参照に設定されています。FEメモリが不足すると、システムは最近最も使用されていないCacheメタデータを自動的に解放します。さらに、ユーザーは以下のSQL文を実行することでFEメモリ使用量をさらに制限できます。この設定はリアルタイムで有効になり、各FEに対して設定する必要があります。永続的な設定の場合は、fe.confファイルに保存する必要があります。

```sql
-- Store up to 100 Cache metadata items, automatically releasing the least recently used ones when exceeded. The default value is 100.  
ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num'='100');  
  
-- Automatically release Cache metadata after 300 seconds of inactivity. The default value is 300.  
ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second'='300');
```
### BE Memory Control

be.confファイルで以下の設定を変更し、BEを再起動後に変更が有効になります：

```sql
-- When the Cache memory exceeds query_cache_max_size_mb + query_cache_elasticity_size_mb,  
-- release the least recently used Cache until the memory usage is below query_cache_max_size_mb.  
query_cache_max_size_mb = 256  
query_cache_elasticity_size_mb = 128
```
さらに、結果の行数やサイズが特定の閾値を超える場合にSQL Cacheの作成を回避するために、FEで設定を行うことができます：

```sql
-- By default, do not create SQL Cache for results exceeding 3000 rows.  
ADMIN SET FRONTEND CONFIG ('cache_result_max_row_count'='3000');  
  
-- By default, do not create SQL Cache for results exceeding 30MB.  
ADMIN SET FRONTEND CONFIG ('cache_result_max_data_size'='31457280');
```
## Cache Missのトラブルシューティング

キャッシュ無効化の理由は通常以下のものが含まれます：

1. テーブル/ビュー構造の変更。例：`drop table`、`replace table`、`alter table`、`alter view`の実行。

2. テーブルデータの変更。例：`insert`、`delete`、`update`、`truncate`の実行。

3. ユーザー権限の削除。例：`revoke`の実行。

4. 評価値が変わる非決定的関数の使用。例：`select random()`の実行。

5. 値が変わる変数の使用。例：`select * from tbl where dt = @dt_var`の実行。

6. Row PolicyやData Maskingの変更。例：特定のテーブルデータをユーザーに見えないよう設定。

7. 結果行数がFEで設定された`cache_result_max_row_count`を超過。デフォルト値は3000行。

8. 結果サイズがFEで設定された`cache_result_max_data_size`を超過。デフォルト値は30MB。
