---
{
  "title": "SHOW PROC",
  "description": "Procシステムは、Dorisのユニークな機能です。Linuxを使用したことがある学生は、この概念をよりよく理解できるでしょう。Linuxシステムでは、",
  "language": "ja"
}
---
## デスクリプション

Procシステムは、Dorisのユニークな機能です。Linuxを使用したことのある学生は、この概念をよく理解できるでしょう。Linuxシステムでは、procは仮想ファイルシステムで、通常`/proc`ディレクトリにマウントされています。ユーザーは、このファイルシステムを通じてシステムの内部データ構造を表示できます。例えば、`/proc/pid`を通じて指定されたpidプロセスの詳細を表示できます。

Linuxのprocシステムと同様に、Dorisのprocシステムも、ユーザーが指定した「ディレクトリパス（proc path）」に従って異なるシステム情報を表示するために、ディレクトリのような構造に整理されています。

procシステムは主にシステム管理者向けに設計されており、システム内部の実行状態を簡単に表示できます。tableのtabletステータス、クラスターバランスステータス、各種ジョブのステータスなど、非常に有用な機能です。

DorisでProcシステムを表示する方法は2つあります。

1. Dorisが提供するWEB UIインターフェースで表示する方法。アドレス：`http://FE_IP:FE_HTTP_PORT`にアクセス
2. もう一つはコマンドによる方法

DorisのPROCでサポートされているすべてのコマンドは`SHOW PROC "/";`で確認できます。

MySQLクライアントを通じてDorisに接続した後、SHOW PROC文を実行して、指定されたprocディレクトリの情報を表示できます。procディレクトリは「/」で始まる絶対パスです。

show proc文の結果は2次元tableで表示されます。通常、結果tableの最初の列は、procの次のサブディレクトリです。

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
2. backends: クラスター内のBEのノードリストを表示、[SHOW BACKENDS](../cluster-management/instance-management/SHOW-BACKENDS)と同等
3. bdbje: bdbjeデータベースリストを表示するには、`fe.conf`ファイルを変更して`enable_bdbje_debug_mode=true`を追加し、`sh start_fe.sh --daemon`を通して`FE`を起動して`debug`モードに入る必要があります。`debug`モードに入ると、`http server`と`MySQLServer`のみが起動され、`BDBJE`インスタンスが開かれますが、メタデータの読み込みとその後の起動プロセスには入りません。
4. binlog: binlog関連情報を表示、binlogレコード数、binlogサイズ（バイト）、binlog時間範囲などの情報を含む。
5. brokers: クラスターbrokerノード情報を表示、[SHOW BROKER](../cluster-management/instance-management/SHOW-BROKER)と同等
6. catalogs: 現在作成されているデータカタログを表示、[SHOW CATALOGS](../catalog/SHOW-CATALOG.md)と同等
7. cluster_balance: クラスターのバランスを確認するには、Data Copy Managementを参照してください
8. cluster_health: <code>SHOW PROC '/cluster_health/tablet_health';</code>文を実行してクラスター全体のレプリカステータスを表示。
9. colocation_group: このコマンドでクラスター内の既存のGroup情報を表示できます。詳細については、[Colocation Join](../../../query-acceleration/colocation-join)の章を参照してください
10. current_backend_instances: 現在ジョブを実行しているbeノードのリストを表示
11. current_queries: 実行中のクエリのリスト、現在実行されているSQL文を表示。
12. current_query_stmts: 現在実行中のクエリを返す。
13. dbs: 主にDorisクラスター内の各データベースとTableのメタデータ情報を表示するために使用されます。この情報には、Table構造、パーティション、マテリアライズドビュー、データシャードとレプリカなどが含まれます。このディレクトリとそのサブディレクトリを通して、クラスター内のTableメタデータを明確に表示し、データスキュー、レプリカ障害などの問題を特定できます。
14. diagnose: クラスター内の一般的な管理・制御の問題を報告・診断します。レプリカのバランスと移行、トランザクション例外などが含まれます。
15. frontends: クラスター内のすべてのFEノード情報を表示、IPアドレス、役割、ステータス、マスターかどうかなどを含む。[SHOW FRONTENDS](../cluster-management/instance-management/SHOW-FRONTENDS)と同等
16. jobs: すべての種類のジョブの統計を表示。特定の`dbId`が指定された場合、そのデータベースの統計データを返します。`dbId`が-1の場合、すべてのデータベースの合計統計データを返します
17. load_error_hub: Dorisはロードジョブによって生成されるエラー情報をエラーハブに集約保存することをサポートしています。その後、<code>SHOW LOAD WARNINGS;</code>文を通してエラーメッセージを直接表示できます。ここではエラーハブの設定情報が表示されます。
18. monitor: FE JVMのリソース使用状況を表示
19. resources: システムリソースを表示、一般アカウントはUSAGE_PRIV権限を持つリソースのみ表示できます。rootとadminアカウントのみがすべてのリソースを表示できます。[SHOW RESOURCES](../cluster-management/compute-management/SHOW-RESOURCES)と同等
20. routine_loads: すべてのroutine loadジョブ情報を表示、ジョブ名、ステータスなどを含む。
21. statistics: 主にDorisクラスター内のデータベース、Table、パーティション、シャード、レプリカの数を集計・表示するために使用されます。また、異常なコピーの数も表示されます。この情報は、クラスターのメタ情報のサイズを全体的に制御するのに役立ちます。全体的な視点からクラスターのシャーディング状況を表示し、クラスターシャーディングの健全性を迅速にチェックできます。これにより、問題のあるデータシャードをさらに特定できます。
22. stream_loads: 実行中のstream loadタスクを返す。
23. tasks: 様々なジョブのタスク総数と失敗数を表示。
24. transactions: 指定されたトランザクションidのトランザクション詳細を表示するために使用、[SHOW TRANSACTION](../transaction/SHOW-TRANSACTION)と同等
25. trash: この文はバックエンドのガベージデータが占有する領域を表示するために使用されます。[SHOW TRASH](../table-and-view/data-and-status-management/SHOW-TRASH)と同等

## 詳細説明
1. /binlog

BinlogはDorisの重要な機能で、データ変更を記録し、クラスター間データ同期（CCR）などのシナリオで使用できます。このコマンドを通して、管理者はBinlogのステータスを監視し、正常な動作を確保し、ストレージ容量を合理的に計画できます。

| フィールド名 | データ型 | 説明 |
|------------|-----------|-------------|
| Name | String | データベース名またはTable名 |
| タイプ | String | データオブジェクトの種類、値は"db"（データベース）または"table"（Table） |
| Id | Number | データベースIDまたはTableID |
| Dropped | Boolean | データベースまたはTableが削除されているかどうか。"true"値はオブジェクトがDorisから削除されたが、そのBinlogレコードがまだ保持されていることを示す；"false"値はオブジェクトがシステム内にまだ存在することを示す。データベースまたはTableが削除されても、システムはTTLが期限切れになるか手動でクリーンアップされるまで一定期間Binlogレコードを保持する |
| BinlogLength | Number | このデータベースまたはTableのバイナリログエントリの総数 |
| BinlogSize | Number | バイナリログの総サイズ（バイト） |
| FirstBinlogCommittedTime | Number | 最初のバイナリログコミットのタイムスタンプ（Unixタイムスタンプ、ミリ秒） |
| ReadableFirstBinlogCommittedTime | String | 最初のバイナリログのコミット時刻（可読形式） |
| LastBinlogCommittedTime | Number | 最後のバイナリログコミットのタイムスタンプ（Unixタイムスタンプ、ミリ秒） |
| ReadableLastBinlogCommittedTime | String | 最後のバイナリログのコミット時刻（可読形式） |
| BinlogTtlSeconds | Number | バイナリログの有効期間（秒）、この時間を超えるログはクリーンアップされる可能性がある |
| BinlogMaxBytes | Number | バイナリログの最大サイズ（バイト）、このサイズを超えるとクリーンアップがトリガーされる可能性がある |
| BinlogMaxHistoryNums | Number | 保持するバイナリログ履歴レコードの最大数、この数を超えるとクリーンアップがトリガーされる可能性がある |

注意事項：
- バイナリログが有効化されているデータベースとTableのみが、このコマンドの出力に表示されます
- データベースレベルのバイナリログが有効化されている場合、データベースのバイナリログ情報が表示されます；そうでない場合、そのデータベース内でバイナリログが有効化されている個別のTableの情報が表示されます

## 例

1. 例えば、"/dbs"はすべてのデータベースを表示し、"/dbs/10002"はid 10002のデータベース下のすべてのTableを表示します

   ```sql
   mysql> show proc "/dbs/10002";
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | TableId | TableName            | IndexNum | PartitionColumnName | PartitionNum | State  | タイプ | LastConsistencyCheckTime | ReplicaCount |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | 10065   | dwd_product_live     | 1        | dt                  | 9            | NORMAL | OLAP | NULL                     | 18           |
   | 10109   | ODS_MR_BILL_COSTS_DO | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10119   | test                 | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10124   | test_parquet_import  | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   4 rows in set (0.00 sec)
   ```
2. クラスター内のすべてのデータベースTable数に関する情報を表示します。

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
3. 以下のコマンドでクラスター内の既存のGroup情報を確認できます。

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
   - TabletIds: このGroupに含まれるTableのidリスト。
   - BucketsNum: バケット数。
   - ReplicationNum: レプリカ数。
   - DistCols: 分散カラム、つまりバケットカラムの型。
   - IsStable: Groupが安定しているかどうか（安定性の定義については`Colocation replica balance and repair`セクションを参照）。

4. 以下のコマンドを使用してGroupのデータ分散をさらに詳しく確認します：

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

5. 様々なジョブのタスクの総数と失敗数を表示します。

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
DbId が 25852112 などのデータベースの下で、レプリカステータスを表示します。

   ```sql
   mysql> show proc '/cluster_health/tablet_health/25852112';
   ```
7. クラスタ管理の問題の報告と診断

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
View replicaバランス移行の問題

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
## Keywords

    SHOW, PROC

## Best Practice
