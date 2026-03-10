---
{
  "title": "SHOW PROC",
  "language": "ja",
  "description": "Procシステムは、Dorisのユニークな機能です。Linuxを使用したことがある学生は、この概念をよりよく理解できるかもしれません。Linuxシステムでは、"
}
---
## 説明

Procシステムは、Dorisの独特な機能です。Linuxを使用したことがある学生であれば、この概念をより良く理解できるでしょう。Linuxシステムでは、procは仮想ファイルシステムであり、通常/procディレクトリにマウントされます。ユーザーはこのファイルシステムを通じて、システムの内部データ構造を表示できます。例えば、/proc/pidを通じて指定されたpidプロセスの詳細を表示できます。

Linuxのprocシステムと同様に、Dorisのprocシステムもディレクトリのような構造に整理されており、ユーザーが指定した「ディレクトリパス（proc path）」に従って異なるシステム情報を表示します。

procシステムは主にシステム管理者向けに設計されており、システム内部の実行状態を便利に表示できます。例えば、テーブルのtabletステータス、クラスターのバランス状態、各種ジョブの状態などです。これは非常に有用な機能です。

Dorisでprocシステムを表示する方法は2つあります。

1. Dorisが提供するWEB UIインターフェースを通じて表示する場合は、次のアドレスにアクセスします：`http://FE_IP:FE_HTTP_PORT`
2. もう一つの方法はコマンドによる方法です

DorisのPROCでサポートされているすべてのコマンドは、` SHOW PROC "/";`を通じて確認できます。

MySQLクライアントを通じてDorisに接続した後、SHOW PROC文を実行して指定されたprocディレクトリの情報を表示できます。procディレクトリは「/」で始まる絶対パスです。

show proc文の結果は二次元テーブルで表示されます。通常、結果テーブルの最初の列はprocの次のサブディレクトリです。

```none
mysql> show proc "/";
+---------------------------+
| name                      |
+---------------------------+
| auth                      |
| backends                  |
| bdbje                     |
| brokers                   |
| catalogs                  |
| cluster_balance           |
| cluster_health            |
| colocation_group          |
| current_backend_instances |
| current_queries           |
| current_query_stmts       |
| dbs                       |
| diagnose                  |
| frontends                 |
| jobs                      |
| load_error_hub            |
| monitor                   |
| resources                 |
| routine_loads             |
| statistic                 |
| stream_loads              |
| tasks                     |
| transactions              |
| trash                     |
+---------------------------+
23 rows in set (0.00 sec)
```
illustrate:

1. auth: ユーザー名と対応する権限情報
2. backends: クラスター内のBEのノードリストを表示し、[SHOW BACKENDS](../cluster-management/instance-management/SHOW-BACKENDS)と同等
3. bdbje: bdbjeデータベースリストを表示するには、`fe.conf`ファイルを変更して`enable_bdbje_debug_mode=true`を追加し、`sh start_fe.sh --daemon`で`FE`を起動して`debug`モードに入る必要があります。`debug`モードに入ると、`http server`と`MySQLServer`のみが起動され、`BDBJE`インスタンスが開かれますが、メタデータの読み込みとその後の起動プロセスは実行されません。
4. brokers : クラスターのbrokerノード情報を表示し、[SHOW BROKER](../cluster-management/instance-management/SHOW-BROKER)と同等
5. catalogs : 現在作成されているデータカタログを表示し、[SHOW CATALOGS](../catalog/SHOW-CATALOG.md)と同等
6. cluster_balance : クラスターのバランスをチェックするには、[Data Copy Management](../../../admin-manual/maint-monitor/tablet-repair-and-balance.md)を参照してください
7. cluster_health: <code>SHOW PROC '/cluster_health/tablet_health';</code>文を実行して、クラスター全体のレプリカ状態を表示します。
8. colocation_group : このコマンドは、クラスター内の既存のGroup情報を表示できます。詳細は[Colocation Join](../../../query-acceleration/colocation-join)の章を参照してください
9. current_backend_instances : 現在ジョブを実行しているbeノードのリストを表示
10. current_queries : 実行中のクエリのリスト、現在実行中のSQL文を表示
11. current_query_stmts: 現在実行中のクエリを返します。
12. dbs: 主にDorisクラスター内の各データベースとテーブルのメタデータ情報を表示するために使用されます。この情報には、テーブル構造、パーティション、マテリアライズドビュー、データシャードとレプリカなどが含まれます。このディレクトリとそのサブディレクトリを通じて、クラスター内のテーブルメタデータを明確に表示し、データスキュー、レプリカ障害などの問題を特定できます。
13. diagnose: クラスター内の一般的な管理・制御の問題を報告・診断します。これにはレプリカバランスと移行、トランザクション例外などが含まれます。
14. frontends: クラスター内のすべてのFEノード情報（IPアドレス、役割、状態、マスターかどうかなど）を表示し、[SHOW FRONTENDS](../cluster-management/instance-management/SHOW-FRONTENDS)と同等
15. jobs: すべての種類のジョブの統計を表示します。特定の`dbId`が指定された場合、そのデータベースの統計データを返します。`dbId`が-1の場合、すべてのデータベースの合計統計データを返します
16. load_error_hub: Dorisは、ロードジョブで生成されるエラー情報をエラーハブに一元的に保存することをサポートしています。その後、<code>SHOW LOAD WARNINGS;</code>文を通じて直接エラーメッセージを表示できます。ここに表示されるのは、エラーハブの設定情報です。
17. monitor : FE JVMのリソース使用量を表示
18. resources : システムリソースを表示します。通常のアカウントは、USAGE_PRIV権限を持つリソースのみを表示できます。rootおよびadminアカウントのみがすべてのリソースを表示できます。[SHOW RESOURCES](../cluster-management/compute-management/SHOW-RESOURCES)と同等
19. routine_loads: すべてのroutine loadジョブ情報（ジョブ名、状態など）を表示
20. statistics: 主にDorisクラスター内のデータベース、テーブル、パーティション、シャード、レプリカの数を集計・表示するために使用されます。また、不健全なコピーの数も表示されます。この情報により、クラスターのメタ情報のサイズを全般的に把握できます。全体的な観点からクラスターのシャーディング状況を確認し、クラスターシャーディングの健全性を迅速にチェックできます。これにより、問題のあるデータシャードをさらに特定できます。
21. stream_loads: 実行中のstream loadタスクを返します。
22. tasks : 各種ジョブのタスク総数と失敗数を表示
23. transactions : 指定されたトランザクションidのトランザクション詳細を表示するために使用され、[SHOW TRANSACTION](../transaction/SHOW-TRANSACTION)と同等
24. trash: この文はバックエンドのガベージデータが占める容量を表示するために使用されます。[SHOW TRASH](../table-and-view/data-and-status-management/SHOW-TRASH)と同等

## Examples

1. 例えば、"/dbs"はすべてのデータベースを表示し、"/dbs/10002"はid 10002のデータベース下のすべてのテーブルを表示します

   ```sql
   mysql> show proc "/dbs/10002";
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | TableId | TableName            | IndexNum | PartitionColumnName | PartitionNum | State  | Type | LastConsistencyCheckTime | ReplicaCount |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | 10065   | dwd_product_live     | 1        | dt                  | 9            | NORMAL | OLAP | NULL                     | 18           |
   | 10109   | ODS_MR_BILL_COSTS_DO | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10119   | test                 | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10124   | test_parquet_import  | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   4 rows in set (0.00 sec)
   ```
2. クラスター内のすべてのデータベーステーブル数に関する情報を表示します。

   ```sql
   mysql> show proc '/statistic';
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   | DbId  | DbName               | TableNum | PartitionNum | IndexNum | TabletNum | ReplicaNum |
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   | 10002 | default_cluster:test | 4        | 12           | 12       | 21        | 21         |
   | Total | 1                    | 4        | 12           | 12       | 21        | 21         |
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   2 rows in set (0.00 sec)
   ```
3. 以下のコマンドでクラスター内の既存のGroup情報を表示できます。

   ```
   SHOW PROC '/colocation_group';
   
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   | GroupId     | GroupName    | TableIds     | BucketsNum | ReplicationNum | DistCols | IsStable |
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   | 10005.10008 | 10005_group1 | 10007, 10040 | 10         | 3              | int(11)  | true     |
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   ```
- GroupId: グループのクラスター全体で一意な識別子。前半はdb id、後半はgroup idです。
   - GroupName: Groupの完全名。
   - TabletIds: このGroupに含まれるTablesのidリスト。
   - BucketsNum: バケット数。
   - ReplicationNum: レプリカ数。
   - DistCols: 分散カラム、つまりバケットカラムタイプ。
   - IsStable: Groupが安定しているかどうか（安定性の定義については、`Colocation replica balance and repair`セクションを参照してください）。

4. 以下のコマンドを使用して、Groupのデータ分散をさらに詳しく確認します：

   ```sql
   SHOW PROC '/colocation_group/10005.10008';
   
   +-------------+---------------------+
   | BucketIndex | BackendIds          |
   +-------------+---------------------+
   | 0           | 10004, 10002, 10001 |
   | 1           | 10003, 10002, 10004 |
   | 2           | 10002, 10004, 10001 |
   | 3           | 10003, 10002, 10004 |
   | 4           | 10002, 10004, 10003 |
   | 5           | 10003, 10002, 10001 |
   | 6           | 10003, 10004, 10001 |
   | 7           | 10003, 10004, 10002 |
   +-------------+---------------------+
   ```
- BucketIndex: バケットシーケンスのインデックス。
   - BackendIds: バケット内のデータシャードが配置されているBEノードIDのリスト。

5. 各種ジョブのタスク総数と失敗数を表示します。

   ```sql
   mysql> show proc '/tasks';
   +-------------------------+-----------+----------+
   | TaskType                | FailedNum | TotalNum |
   +-------------------------+-----------+----------+
   | CREATE                  | 0         | 0        |
   | DROP                    | 0         | 0        |
   | PUSH                    | 0         | 0        |
   | CLONE                   | 0         | 0        |
   | STORAGE_MEDIUM_MIGRATE  | 0         | 0        |
   | ROLLUP                  | 0         | 0        |
   | SCHEMA_CHANGE           | 0         | 0        |
   | CANCEL_DELETE           | 0         | 0        |
   | MAKE_SNAPSHOT           | 0         | 0        |
   | RELEASE_SNAPSHOT        | 0         | 0        |
   | CHECK_CONSISTENCY       | 0         | 0        |
   | UPLOAD                  | 0         | 0        |
   | DOWNLOAD                | 0         | 0        |
   | CLEAR_REMOTE_FILE       | 0         | 0        |
   | MOVE                    | 0         | 0        |
   | REALTIME_PUSH           | 0         | 0        |
   | PUBLISH_VERSION         | 0         | 0        |
   | CLEAR_ALTER_TASK        | 0         | 0        |
   | CLEAR_TRANSACTION_TASK  | 0         | 0        |
   | RECOVER_TABLET          | 0         | 0        |
   | STREAM_LOAD             | 0         | 0        |
   | UPDATE_TABLET_META_INFO | 0         | 0        |
   | ALTER                   | 0         | 0        |
   | INSTALL_PLUGIN          | 0         | 0        |
   | UNINSTALL_PLUGIN        | 0         | 0        |
   | Total                   | 0         | 0        |
   +-------------------------+-----------+----------+
   26 rows in set (0.01 sec)
   ```
5. クラスター全体のレプリカステータスを表示します。

   ```sql
   mysql> show proc '/cluster_health/tablet_health';
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   | DbId     | DbName                    | TabletNum | HealthyNum | ReplicaMissingNum | VersionIncompleteNum | ReplicaRelocatingNum | RedundantNum | ReplicaMissingInClusterNum | ReplicaMissingForTagNum | ForceRedundantNum | ColocateMismatchNum | ColocateRedundantNum | NeedFurtherRepairNum | UnrecoverableNum | ReplicaCompactionTooSlowNum | InconsistentNum | OversizeNum | CloningNum |
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   | 25852112 | default_cluster:bowen     | 1920      | 1920       | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
   | 25342914 | default_cluster:bw        | 128       | 128        | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
   | 2575532  | default_cluster:cps       | 1440      | 1440       | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 16          | 0          |
   | 26150325 | default_cluster:db        | 38374     | 38374      | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 453         | 0          |
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   4 rows in set (0.01 sec)
   ```
DbIdが25852112のようなデータベースの下で、レプリカのステータスを確認してください。

   ```sql
   mysql> show proc '/cluster_health/tablet_health/25852112';
   ```
7. クラスター管理の問題を報告し診断する

	```
	MySQL > show proc "/diagnose";
	+-----------------+----------+------------+
	| Item            | ErrorNum | WarningNum |
	+-----------------+----------+------------+
	| cluster_balance | 2        | 0          |
	| Total           | 2        | 0          |
	+-----------------+----------+------------+

	2 rows in set
	```
レプリカバランス移行の問題を表示する

	```sql
	MySQL > show proc "/diagnose/cluster_balance";
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+
	| Item                  | Status | Content                                                                                                     | Detail Cmd                                                          | Suggestion |
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+
	| Tablet Health         | ERROR  | healthy tablet num 691 < total tablet num 1014                                                              | show 	proc "/cluster_health/tablet_health";                          | <null>     |
	| BeLoad Balance        | ERROR  | backend load not balance for tag {"location" : "default"}, low load backends [], high load backends 	[10009] | show proc "/cluster_balance/cluster_load_stat/location_default/HDD" | <null>     |
	| Disk Balance          | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	| Colocate Group Stable | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	| History Tablet Sched  | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+

	5 rows in set
	```
## キーワード

    SHOW, PROC

## ベストプラクティス
