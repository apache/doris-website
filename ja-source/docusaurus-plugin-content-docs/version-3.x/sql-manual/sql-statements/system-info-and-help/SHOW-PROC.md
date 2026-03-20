---
{
  "title": "SHOW PROC",
  "description": "Procシステムは、Dorisの独自機能です。Linuxを使用したことがある学生は、この概念をよりよく理解できるでしょう。Linuxシステムでは、",
  "language": "ja"
}
---
## 説明

Procシステムは、Dorisの独自機能です。Linuxを使用した経験のある学生であれば、この概念をよりよく理解できるでしょう。Linuxシステムでは、procは仮想ファイルシステムであり、通常/procディレクトリにマウントされます。ユーザーはこのファイルシステムを通じて、システムの内部データ構造を確認できます。例えば、/proc/pidを通じて指定されたpidプロセスの詳細を確認できます。

Linuxのprocシステムと同様に、Dorisのprocシステムもディレクトリのような構造で整理されており、ユーザーが指定した「ディレクトリパス（proc path）」に応じて異なるシステム情報を確認できます。

procシステムは主にシステム管理者向けに設計されており、システム内部の実行状態を簡単に確認できるようになっています。例えば、tableのtablet状態、クラスターバランス状態、様々なジョブの状態などです。これは非常に有用な機能です。

DorisでProcシステムを確認する方法は2つあります。

1. Dorisが提供するWEB UIインターフェースから確認する。アドレス：`http://FE_IP:FE_HTTP_PORT`
2. もう一つの方法はコマンドです

Doris PROCがサポートするすべてのコマンドは、` SHOW PROC "/";`で確認できます。

MySQLクライアントを通じてDorisに接続した後、SHOW PROC文を実行して指定されたprocディレクトリの情報を確認できます。procディレクトリは「/」から始まる絶対パスです。

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
2. backends: クラスター内のBEのノードリストを表示し、[SHOW BACKENDS](../cluster-management/instance-management/SHOW-BACKENDS)と同等
3. bdbje: bdbjeデータベースリストを表示するには、`fe.conf`ファイルを変更して`enable_bdbje_debug_mode=true`を追加し、`sh start_fe.sh --daemon`を通じて`FE`を開始して`debug`モードに入る必要があります。`debug`モードに入ると、`http server`と`MySQLServer`のみが開始され、`BDBJE`インスタンスが開かれますが、メタデータの読み込みとその後の起動プロセスには入りません。
4. binlog: binlog関連情報を表示し、binlogレコード数、binlogサイズ（バイト単位）、binlog時間範囲などの情報を含みます。
5. brokers : クラスターbrokerノード情報を表示し、[SHOW BROKER](../cluster-management/instance-management/SHOW-BROKER)と同等
6. catalogs : 現在作成されているデータカタログを表示し、[SHOW CATALOGS](../catalog/SHOW-CATALOG.md)と同等
7. cluster_balance : クラスターのバランスを確認するには、Data Copy Managementを参照してください
8. cluster_health: <code>SHOW PROC '/cluster_health/tablet_health';</code>文を実行して、クラスター全体のレプリカステータスを表示します。
9. colocation_group : このコマンドでクラスター内の既存のGroup情報を表示できます。詳細については、Colocation Joinの章を参照してください
10. current_backend_instances : 現在ジョブを実行しているbeノードのリストを表示
11. current_queries : 実行中のクエリリストと現在実行中のSQL文を表示します。
12. current_query_stmts: 現在実行中のクエリを返します。
13. dbs: 主にDorisクラスター内の各データベースとTableのメタデータ情報を表示するために使用されます。この情報には、Table構造、パーティション、マテリアライズドビュー、データシャード、レプリカなどが含まれます。このディレクトリとそのサブディレクトリを通じて、クラスター内のTableメタデータを明確に表示し、データスキュー、レプリカ障害などの問題を特定できます。
14. diagnose: クラスター内の一般的な管理制御問題を報告・診断し、レプリカバランスと移行、トランザクション例外などを含みます。
15. frontends: クラスター内のすべてのFEノード情報を表示し、IPアドレス、ロール、ステータス、マスターかどうかなどを含み、[SHOW FRONTENDS](../cluster-management/instance-management/SHOW-FRONTENDS)と同等
16. jobs: すべての種類のジョブの統計を表示します。特定の`dbId`が指定された場合、そのデータベースの統計データを返します。`dbId`が-1の場合、すべてのデータベースの合計統計データを返します
17. load_error_hub: Dorisは、ロードジョブによって生成されたエラー情報をエラーハブに集中保存することをサポートしています。その後、<code>SHOW LOAD WARNINGS;</code>文を通じてエラーメッセージを直接表示できます。ここにはエラーハブの設定情報が表示されます。
18. monitor : FE JVMのリソース使用状況を表示
19. resources : システムリソースを表示し、一般アカウントはUSAGE_PRIV権限を持つリソースのみ表示できます。rootおよびadminアカウントのみがすべてのリソースを表示できます。[SHOW RESOURCES](../cluster-management/compute-management/SHOW-RESOURCES)と同等
20. routine_loads: すべてのroutine loadジョブ情報を表示し、ジョブ名、ステータスなどを含みます。
21. statistics: 主にDorisクラスター内のデータベース、Table、パーティション、シャード、レプリカの数と異常なコピーの数をまとめて表示するために使用されます。この情報は、クラスターメタ情報のサイズを全体的に制御するのに役立ちます。全体的な視点からクラスターシャーディング状況を表示し、クラスターシャーディングの健全性を迅速にチェックできます。これにより、問題のあるデータシャードをさらに特定できます。
22. stream_loads: 実行中のstream loadタスクを返します。
23. tasks : 各種ジョブの総タスク数と失敗数を表示します。
24. transactions : 指定されたトランザクションidのトランザクション詳細を表示するために使用され、[SHOW TRANSACTION](../transaction/SHOW-TRANSACTION)と同等
25. trash: この文はバックエンドのガベージデータが占める容量を表示するために使用されます。[SHOW TRASH](../table-and-view/data-and-status-management/SHOW-TRASH)と同等


## 詳細説明
1. /binlog

BinlogはDorisの重要な機能で、データ変更を記録するために使用され、クラスター間データ同期（CCR）などのシナリオに使用できます。このコマンドを通じて、管理者はBinlogのステータスを監視し、正常な動作を確保し、ストレージ容量を合理的に計画できます。

| フィールド名 | データ型 | 説明 |
|------------|-----------|-------------|
| Name | String | データベースまたはTable名。 |
| タイプ | String | データオブジェクトのタイプ、値は"db"（データベース）または"table"（Table）が可能 |
| Id | Number | データベースIDまたはTableID |
| Dropped | Boolean | データベースまたはTableが削除されているかどうか。"true"の値はオブジェクトがDorisから削除されているが、そのBinlogレコードは依然として保持されていることを示し、"false"の値はオブジェクトがシステムに依然として存在することを示します。データベースやTableが削除されても、システムはTTLが期限切れになるか手動でクリーンアップされるまで、一定期間Binlogレコードを保持します |
| BinlogLength | Number | このデータベースまたはTableのバイナリログエントリの総数 |
| BinlogSize | Number | バイナリログの総サイズ（バイト） |
| FirstBinlogCommittedTime | Number | 最初のバイナリログコミットのタイムスタンプ（Unixタイムスタンプ、ミリ秒） |
| ReadableFirstBinlogCommittedTime | String | 最初のバイナリログのコミット時間（読み取り可能な形式） |
| LastBinlogCommittedTime | Number | 最後のバイナリログコミットのタイムスタンプ（Unixタイムスタンプ、ミリ秒） |
| ReadableLastBinlogCommittedTime | String | 最後のバイナリログのコミット時間（読み取り可能な形式） |
| BinlogTtlSeconds | Number | バイナリログの生存時間（秒）、この時間を超えるログはクリーンアップされる可能性があります |
| BinlogMaxBytes | Number | バイナリログの最大サイズ（バイト）、このサイズを超えるとクリーンアップがトリガーされる可能性があります |
| BinlogMaxHistoryNums | Number | 保持するバイナリログ履歴レコードの最大数、この数を超えるとクリーンアップがトリガーされる可能性があります |

注意事項:
- バイナリログが有効になっているデータベースとTableのみがこのコマンドの出力に表示されます
- データベースレベルのバイナリログが有効になっている場合、データベースのバイナリログ情報が表示されます。そうでなければ、そのデータベース内でバイナリログが有効になっている個々のTableの情報が表示されます
- 

## 例

1. たとえば、"/dbs"はすべてのデータベースを表示し、"/dbs/10002"はid 10002のデータベース下のすべてのTableを表示します

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
3. 以下のコマンドで、クラスター内の既存のGroup情報を確認できます。

   ```
   SHOW PROC '/colocation_group';
   
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   | GroupId     | GroupName    | TableIds     | BucketsNum | ReplicationNum | DistCols | IsStable |
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   | 10005.10008 | 10005_group1 | 10007, 10040 | 10         | 3              | int(11)  | true     |
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   ```
- GroupId: グループのクラスタ全体での一意識別子。前半はdb id、後半はgroup idです。
   - GroupName: Groupの完全な名前。
   - TabletIds: このGroupに含まれるTableのidリスト。
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
DbId が 25852112 などのデータベース配下でレプリカステータスを表示します。

   ```sql
   mysql> show proc '/cluster_health/tablet_health/25852112';
   ```
7. クラスター管理の問題の報告と診断

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
View replicaのバランス移行の問題

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
