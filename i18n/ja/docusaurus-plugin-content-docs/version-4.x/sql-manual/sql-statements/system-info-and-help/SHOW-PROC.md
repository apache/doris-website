---
{
    "title": "SHOW PROC",
    "language": "ja",
    "description": "Proc システムは Doris 固有の機能です。Linux を使用したことがある方には、この概念が分かりやすいでしょう。Linux システムでは、"
}
---

## 説明

Proc システムは Doris 固有の機能です。Linux を使ったことがある方には、この概念が分かりやすいでしょう。Linux の proc は仮想ファイルシステムで、通常は /proc ディレクトリにマウントされます。ユーザーはこのファイルシステムを通じてシステム内部のデータ構造を確認できます。例えば、/proc/pid から指定した pid のプロセスの詳細を確認できます。

Linux の proc システムと同様に、Doris の proc システムもディレクトリ状の構造を持ちます。ユーザーが指定する「ディレクトリパス（proc パス）」に応じて、さまざまなシステム情報を確認できます。

proc システムは主にシステム管理者向けに設計されており、システム内部の稼働状況を確認するのに役立ちます。テーブルのタブレットの状態、クラスタのバランス状態、各種ジョブの状態などを確認できます。

Doris の proc システムを確認する方法は二つあります。

1. Doris が提供する Web UI で確認する場合は、`http://FE_IP:FE_HTTP_PORT` にアクセスします。
2. コマンドで確認します。

Doris PROC で利用できるすべてのコマンドは、` SHOW PROC "/";` で確認できます。

MySQL クライアントで Doris に接続した後、SHOW PROC 文を実行すると、指定した proc ディレクトリの情報を確認できます。proc ディレクトリには「/」で始まる絶対パスを指定します。

SHOW PROC 文の結果は二次元の表として表示されます。通常、結果の最初の列には proc の次の階層のサブディレクトリが表示されます。

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

各項目の説明：

1. auth: ユーザー名と、それに対応する権限情報を表示します。
2. backends: クラスタ内の BE ノード一覧を表示します。[SHOW BACKENDS](../cluster-management/instance-management/SHOW-BACKENDS) と同等です。
3. bdbje: bdbje データベースの一覧を確認するには、`fe.conf` に `enable_bdbje_debug_mode=true` を追加し、`FE` を `sh start_fe.sh --daemon` で起動して `debug` モードに入る必要があります。`debug` モードでは、`http server` と `MySQLServer` のみが起動し、`BDBJE` インスタンスが開かれます。メタデータの読み込みや、それ以降の起動処理は行われません。
4. binlog: binlog のレコード数、バイト単位のサイズ、対象期間など、binlog に関する情報を確認します。
5. brokers : クラスタ内の broker ノード情報を確認します。[SHOW BROKER](../cluster-management/instance-management/SHOW-BROKER) と同等です。
6. catalogs : 現在作成されているデータカタログを確認します。[SHOW CATALOGS](../catalog/SHOW-CATALOG.md) と同等です。
7. cluster_balance : クラスタのバランスを確認します。詳しくは[データレプリカの管理](../../../admin-manual/maint-monitor/tablet-repair-and-balance.md)を参照してください。
8. cluster_health: <code>SHOW PROC '/cluster_health/tablet_health';</code> 文を実行すると、クラスタ全体のレプリカの状態を確認できます。
9. colocation_group : クラスタ内に存在する Group の情報を確認します。詳しくは[Colocation Join](../../../query-acceleration/colocation-join)の章を参照してください。
10. current_backend_instances : 現在ジョブを実行している BE ノードの一覧を表示します。
11. current_queries : 実行中のクエリの一覧を、タスクの進捗やリソース指標（scan/cpu/memory/shuffle/spill/cache）などの実行時統計とともに確認します。4.1.1 以降は、`current_query_stmts` と同じ詳細な表示になります。
12. current_query_stmts: 実行中のクエリを `current_queries` と同じ統計表示で返します。タスク単位の進捗とリソース指標が含まれます。
13. dbs: 主に Doris クラスタ内の各データベースとテーブルのメタデータを確認するために使用します。テーブル構造、パーティション、マテリアライズドビュー、データシャード、レプリカなどの情報が含まれます。このディレクトリとそのサブディレクトリをたどることで、クラスタ内のテーブルのメタデータを確認し、データの偏りやレプリカの障害などの問題を特定できます。
14. diagnose: レプリカのバランスや移行、トランザクションの例外など、クラスタの管理・制御に関する一般的な問題を報告、診断します。
15. frontends: クラスタ内のすべての FE ノードについて、IP アドレス、ロール、状態、マスターかどうかなどの情報を表示します。[SHOW FRONTENDS](../cluster-management/instance-management/SHOW-FRONTENDS) と同等です。
16. jobs: 各種ジョブの統計を表示します。特定の `dbId` を指定すると、そのデータベースの統計データが返されます。`dbId` に -1 を指定すると、全データベースの統計データの合計が返されます。
17. load_error_hub: Doris では、ロードジョブで発生したエラー情報をエラーハブに一元保存できます。エラーメッセージは <code>SHOW LOAD WARNINGS;</code> 文で直接確認できます。ここにはエラーハブの設定情報が表示されます。
18. monitor : FE JVM のリソース使用状況を表示します。
19. resources : システムリソースを確認します。一般アカウントには USAGE_PRIV 権限のあるリソースのみが表示されます。すべてのリソースを確認できるのは root アカウントと admin アカウントだけです。[SHOW RESOURCES](../cluster-management/compute-management/SHOW-RESOURCES) と同等です。
20. routine_loads: ジョブ名や状態など、すべての Routine Load ジョブの情報を表示します。
21. statistics: 主に Doris クラスタ内のデータベース、テーブル、パーティション、シャード、レプリカの数と、異常なレプリカの数を集計・確認するために使用します。この情報は、クラスタのメタデータの規模を把握するのに役立ちます。また、クラスタ全体のシャード配置と健全性を確認し、問題のあるデータシャードを特定できます。
22. stream_loads: 実行中の Stream Load タスクを返します。
23. tasks : 各種ジョブのタスク総数と失敗数を表示します。
24. transactions : 指定したトランザクション ID の詳細を確認します。[SHOW TRANSACTION](../transaction/SHOW-TRANSACTION) と同等です。
25. trash: BE 内の不要なデータが占める容量を確認します。[SHOW TRASH](../table-and-view/data-and-status-management/SHOW-TRASH) と同等です。


##   詳細説明
1. /binlog

Binlog は Doris のデータ変更を記録します。このコマンドを使用すると、管理者は Binlog の状態を監視し、正常に動作していることを確認して、ストレージ容量を適切に計画できます。

| フィールド名 | データ型 | 説明 |
|------------|-----------|-------------|
| Name | String | データベース名またはテーブル名。 |
| Type | String | データオブジェクトの種類。値は "db"（データベース）または "table"（テーブル）。 |
| Id | Number | データベース ID またはテーブル ID。 |
| Dropped | Boolean | データベースまたはテーブルが削除されたかどうか。"true" は、オブジェクトは Doris から削除されているものの、Binlog レコードはまだ保持されていることを示します。"false" は、オブジェクトがシステム内に存在することを示します。データベースまたはテーブルを削除しても、TTL が切れるか手動でクリーンアップされるまで、Binlog レコードは一定期間保持されます。 |
| BinlogLength | Number | このデータベースまたはテーブルのバイナリログエントリの総数。 |
| BinlogSize | Number | バイナリログの合計サイズ（バイト）。 |
| FirstBinlogCommittedTime | Number | 最初のバイナリログのコミット時刻（Unix タイムスタンプ、ミリ秒）。 |
| ReadableFirstBinlogCommittedTime | String | 最初のバイナリログのコミット時刻（可読形式）。 |
| LastBinlogCommittedTime | Number | 最後のバイナリログのコミット時刻（Unix タイムスタンプ、ミリ秒）。 |
| ReadableLastBinlogCommittedTime | String | 最後のバイナリログのコミット時刻（可読形式）。 |
| BinlogTtlSeconds | Number | バイナリログの保持期間（秒）。この期間を超えたログはクリーンアップされる場合があります。 |
| BinlogMaxBytes | Number | バイナリログの最大サイズ（バイト）。このサイズを超えるとクリーンアップが開始される場合があります。 |
| BinlogMaxHistoryNums | Number | 保持するバイナリログの履歴レコードの最大数。この数を超えるとクリーンアップが開始される場合があります。 |

注記：
- このコマンドの出力には、バイナリログが有効なデータベースとテーブルのみが表示されます。
- データベース単位でバイナリログが有効な場合は、そのデータベースのバイナリログ情報が表示されます。それ以外の場合は、そのデータベース内でバイナリログが有効な個々のテーブルの情報が表示されます。

## 例

1. 例えば、"/dbs" はすべてのデータベースを表示し、"/dbs/10002" は ID が 10002 のデータベース内のすべてのテーブルを表示します。

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

2. クラスタ内のすべてのデータベースとテーブルの数に関する情報を表示します。

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

3. 次のコマンドで、クラスタ内に存在する Group の情報を確認できます。

   ```
   SHOW PROC '/colocation_group';
   
   +-------------+--------------+--------------+------------+-------------------+----------+----------+----------+
   | GroupId     | GroupName    | TableIds     | BucketsNum | ReplicaAllocation | DistCols | IsStable | ErrorMsg |
   +-------------+--------------+--------------+------------+-------------------+----------+----------+----------+
   | 10005.10008 | 10005_group1 | 10007, 10040 | 10         | tag.location.default: 3 | int(11)  | true     |          |
   +-------------+--------------+--------------+------------+-------------------+----------+----------+----------+
   ```

   - GroupId: クラスタ全体で一意の Group 識別子です。前半が db ID、後半が Group ID です。
   - GroupName: Group の完全な名前です。
   - TableIds: この Group に含まれるテーブルの ID の一覧です。
   - BucketsNum: バケットの数です。
   - ReplicaAllocation: レプリカの割り当てポリシーです。
   - DistCols: 分散列、つまりバケット列の型です。
   - IsStable: Group が安定しているかどうかを示します（安定性の定義については、`Colocation replica balance and repair` セクションを参照してください）。
   - ErrorMsg: Group の現在のエラーメッセージです。正常な場合は空です。

   :::caution 動作変更 (4.0.8)

   バージョン 4.0.8 以降、ストレージとコンピュートの分離モードでは `ReplicaAllocation` 列に `null` が表示されます。分離アーキテクチャではレプリカをストレージ層が管理するため、一体型モードのレプリカ割り当ての意味は当てはまらず、従来表示されていた値は誤解を招くものでした。

   :::

4. 次のコマンドを使用すると、Group のデータ分布をさらに詳しく確認できます。

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

   - BucketIndex: バケットの並びにおけるインデックスです。
   - BackendIds: バケット内のデータシャードが配置されている BE ノード ID の一覧です。

   `BucketIndex` 以外の列名はデプロイモードによって異なります。ストレージとコンピュートの一体型モードではリソースタグごとに一列、分離モードではコンピュートグループごとに一列になります。そのような区分がない場合は、単一の `BackendIds` 列が使用されます。

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

5. クラスタ全体のレプリカの状態を表示します。
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

   特定のデータベース内のレプリカの状態を確認するには、例えば DbId が 25852112 の場合、次のコマンドを使用します。

   ```sql
   mysql> show proc '/cluster_health/tablet_health/25852112';
   ```

   :::caution 動作変更 (4.0.8)

   バージョン 4.0.8 以降、ストレージとコンピュートの分離モードでは、すべてのタブレットが `HEALTHY` としてカウントされ、`UnrecoverableNum` などのカウンターにゼロ以外の値は表示されなくなりました。

   分離モードではレプリカの健全性をストレージ層が管理します。従来の健全性チェックは一体型モードのロジックに従っていたため、健全なタブレットを `UNRECOVERABLE` と誤判定し、`SHOW PROC '/diagnose'` が実際には存在しない `Tablet Health` の問題を報告していました。ストレージとコンピュートの一体型モードの統計は変わりません。

   :::

7. クラスタ管理上の問題を報告、診断します。

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


	レプリカのバランス調整と移行に関する問題を確認します。

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
