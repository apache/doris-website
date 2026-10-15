---
{
    "title": "Query Profile 分析ガイド：Doris の低速クエリにおける性能ボトルネックの特定",
    "sidebar_label": "Query Profile 分析",
    "language": "ja",
    "description": "Apache Doris の Query Profile を使ってクエリ実行の詳細を収集、表示、解釈する方法を説明します。アーキテクチャ、パラメータ設定、取得方法、ボトルネックの特定方法を扱います。",
    "keywords": ["Doris Query Profile", "クエリ性能分析", "低速クエリの原因特定", "プロファイルの解釈", "MergedProfile", "DetailProfile", "enable_profile", "profile_level"]
}
---

<!-- Knowledge type: Concept + Operation guide -->
<!-- Applicable scenario: Apache Doris users troubleshooting slow queries, analyzing execution plans, and locating operator bottlenecks -->

Query Profile は、Apache Doris がクエリ実行の詳細を表示するための診断ツールです。各オペレーターの実行時間、行数、メモリ使用量などの主要な指標を記録し、低速クエリのボトルネックをすばやく特定するのに役立ちます。

読み始める前に、次の点を確認してください。

- Apache Doris クラスターがデプロイされ、FE 設定ファイル `fe.conf` を変更する権限があること。
- MySQL クライアントから Doris に接続し、`show query profile` などのコマンドを実行できること。
- クエリプランの基本概念（Fragment、PlanNode）を理解していること。

この記事は主に次の三つの部分で構成されます。

| セクション | 内容 |
| --- | --- |
| 全体アーキテクチャ | Profile が BE から収集され、FE に保存される仕組み |
| パラメータ設定 | 不要な情報を除外し、重要なクエリの詳細に注目するための設定方法 |
| 読み解き方 | クエリ性能に影響するオペレーターをすばやく特定する方法 |

## Query Profile の全体アーキテクチャ

<!-- Knowledge type: Architectural principles -->
<!-- Applicable scenario: Understanding the Profile collection process and troubleshooting reporting failures -->

![Query Profile の全体アーキテクチャ](/images/next/query-acceleration/profile-arch.jpg)

Query Profile の中核は、FE 上の `ProfileManager` と BE 上の `AsyncReportThreadPool` の二つです。

### 収集の流れ

| 手順 | 担当 | 動作 |
| --- | --- | --- |
| 1 | FE | ユーザーがクエリを発行すると、FE が Profile のデータ構造を `ProfileManager` に登録する |
| 2 | BE | クエリ完了後、BE が自身の Profile を非同期報告タスクとして登録する |
| 3 | BE | `AsyncReportThreadPool` がクエリ単位で RPC を開始し、Profile を FE に送信する |
| 4 | FE | バックグラウンドスレッドが Profile を処理し、ポリシーに従って保持または削除し、適切な Profile を圧縮してストレージに書き込む |
| 5 | ユーザー | Web UI または curl による HTTP リクエストで Profile を表示する |
| 6 | FE | `ProfileManager` がメモリまたは外部ストレージから Profile を探し、テキストとして返す |

一連の処理では、**手順 2 の非同期報告**と**手順 4 の Profile の永続化**が、Profile 機能に最も大きく影響します。

### 非同期報告のタイムアウト

クラスターの負荷が高いと、非同期報告がタイムアウトすることがあります。FE のメモリ消費が過大になるのを防ぐため、`ProfileManager` は一定時間待機した後、タイムアウトした Profile を破棄します。

- 調整方法：`profile_async_collect_expire_time_secs` を `fe.conf` で変更して待機時間を制御します。
- 推奨する対処：タイムアウトが頻繁に発生する場合は、まずマシンのリソース使用量を確認します。必要に応じて、リスクを減らすためにグローバルな Profile を無効にします。

### Profile 永続化の利点

`ProfileManager` が Profile をディスクに永続化すると、次のようになります。

1. Profile が FE メモリを大量に消費しなくなります。
2. FE の再起動後も、以前に生成された Profile を照会できます。

一つ目により、FE は数千件の完全な Profile を保持できます。二つ目により、アップグレード前後のクラスター性能を比較しやすくなり、バージョンアップによって Doris のクエリ性能が改善したかどうかを確認できます。

## Profile の設定

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Enabling/disabling Profile, controlling collection granularity and storage -->

### パラメータ早見表

| パラメータ | 適用範囲 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `enable_profile` | セッション／グローバル | `false` | Profile を生成するかどうか |
| `profile_level` | セッション／グローバル | `1` | Profile の詳細レベル（1 ～ 3、4.0 以降で有効） |
| `auto_profile_threshold_ms` | グローバル | `-1` | 実行時間がしきい値を超えたクエリにのみ Profile を生成する（3.0 以降で有効） |
| `max_query_profile_num` | `fe.conf` | `500` | FE メモリに保持する Profile の最大件数 |
| `max_spilled_profile_num` | `fe.conf` | `500` | ディスクに保持する Profile の最大件数 |
| `spilled_profile_storage_path` | `fe.conf` | `log/profile` | Profile を保存するローカルディレクトリ |
| `spilled_profile_storage_limit_bytes` | `fe.conf` | `1 GB` | ディスク上の Profile の総保存容量の上限 |

### Profile の有効化

#### enable_profile

- 目的：Profile を生成するかどうかを制御します。
- コマンド：`set enable_profile=true;`
- 説明：デフォルトは `false` です。無効の場合、`show query profile` を実行しても新たに生成されたレコードは返されません。

```sql
mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.00 sec)

mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| 74b9e30d6ba7491d-9dbf9289f6f5c208 | QUERY     | 2025-02-26 18:47:07 | 2025-02-26 18:47:07 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
1 row in set (0.01 sec)

mysql> set enable_profile=false;
--------------
set enable_profile=false
--------------

Query OK, 0 rows affected (0.00 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.01 sec)

mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| 74b9e30d6ba7491d-9dbf9289f6f5c208 | QUERY     | 2025-02-26 18:47:07 | 2025-02-26 18:47:07 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
1 row in set (0.00 sec)
```

#### profile_level

- 目的：Profile の詳細レベルを制御します。
- コマンド：`set profile_level=2;`
- 説明：デフォルト値は `1` です。**このパラメータはバージョン 4.0 と master ブランチで有効です。4.0 より前のバージョンでは意味が異なるため、使用しないでください。**

| レベル | 動作 | 性能への影響 |
| --- | --- | --- |
| 1（デフォルト） | BE は簡略化した Profile のみを報告し、FE が MergedProfile に集約するには十分な情報を含む | 最小 |
| 2 | より詳細な Counter を出力し、詳しい分析に適している | 小 |
| 3 | 最大の粒度。一部の Counter の収集がクエリ性能に影響する場合がある | 大 |

例：デフォルトでは、`EXCHANGE_OPERATOR` の Counter は次のとおりです。

```text
EXCHANGE_OPERATOR(id=1):
     - InstanceID: ef33b72e30b84b68-82ad027edbee5910
     - BlocksProduced: 1
     - CloseTime: 4.243us
     - ExecTime: 30.834us
     - InitTime: 20.902us
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.93us
     - ProjectionTime: 0ns
     - RowsProduced: 10
     - WaitForDependencyTime: 0ns
       - WaitForData0: 635.324us
```

`profile_level=2` の場合は、より詳細な Counter を確認できます。

```text
EXCHANGE_OPERATOR(id=1):
     - InstanceID: 514023de1b7b41a3-9e59e43c591103a2
     - BlocksProduced: 1
     - CloseTime: 3.523us
     - CreateMergerTime: 0ns
     - DataArrivalWaitTime: 0ns
     - DecompressBytes: 0.00 
     - DecompressTime: 0ns
     - DeserializeRowBatchTimer: 0ns
     - ExecTime: 28.439us
     - FilterTime: 287ns
     - FirstBatchArrivalWaitTime: 0ns
     - GetDataFromRecvrTime: 3.482us
     - InitTime: 18.258us
     - LocalBytesReceived: 36.00 KB
     - MaxFindRecvrTime(NS): 0
     - MaxWaitForWorkerTime: 0
     - MaxWaitToProcessTime: 0
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.44us
     - ProjectionTime: 0ns
     - RemoteBytesReceived: 0.00 
     - RowsProduced: 10
     - SendersBlockedTotalTimer(*): 0ns
     - WaitForDependencyTime: 0ns
       - WaitForData0: 596.708us
```

#### auto_profile_threshold_ms

- 目的：実行時間がしきい値を超えたクエリにのみ Profile を生成し、短時間で終わるクエリの Profile に低速クエリの Profile が埋もれるのを防ぎます。
- コマンド：`set global auto_profile_threshold_ms=1000;`
- 説明：デフォルトは `-1` で、すべてのクエリに Profile を生成します。このパラメータはバージョン 3.0 以降で有効です。

このパラメータが必要な理由は、Profile をグローバルに有効にすると大量のデータが生成され、FE の CPU、メモリ、ディスクを消費し、レイテンシーが重要な短いクエリにも影響するためです。その結果、FE は定期的に Profile を削除します。このパラメータを使うと、低速クエリの Profile が埋もれずに済みます。

例：Profile がグローバルに有効で、すべてのクエリに Profile が生成されるとします。

```sql
mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| d59b04f636e49c0-bf6b6b3011c40f67  | QUERY     | 2025-02-26 18:25:59 | 2025-02-26 18:25:59 | 3ms   | EOF        | root | internal        | tpcds      | select 1      |
| f2ccb78011aa4526-9919ee76af1e57d7 | QUERY     | 2025-02-26 18:25:59 | 2025-02-26 18:25:59 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| a8464728ebf5481d-864e3016ad22f045 | QUERY     | 2025-02-26 18:25:58 | 2025-02-26 18:25:58 | 6ms   | EOF        | root | internal        | tpcds      | select 1      |
| 912b09ea8f634c47-89e65d4fe354a94b | QUERY     | 2025-02-26 18:25:58 | 2025-02-26 18:25:58 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| e6e6f0a3a31640bc-ad5994de0334ae8d | QUERY     | 2025-02-26 18:25:57 | 2025-02-26 18:25:57 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| b28da27b4cc847a7-82e239320d6facc5 | QUERY     | 2025-02-26 18:25:57 | 2025-02-26 18:25:57 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| fec3cdcd4664408c-a38508ce3a2bbe32 | QUERY     | 2025-02-26 18:24:48 | 2025-02-26 18:24:48 | 6ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
7 rows in set (0.00 sec)
```

これらの短いクエリについて Profile の生成を止めるには、次の手順を実行します。

```sql
mysql> clean all profile;
--------------
clean all profile
--------------

Query OK, 0 rows affected (0.01 sec)

mysql> set global auto_profile_threshold_ms=1000;
--------------
set global auto_profile_threshold_ms=1000
--------------

Query OK, 0 rows affected (0.01 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.05 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.01 sec)

mysql> show query profile;
--------------
show query profile
--------------

Empty set (0.00 sec)
```

### Profile ストレージの設定

Doris は Profile を FE のローカルディスクに永続化し、より多くのレコードを保持できます。これは `fe.conf` の次のパラメータで制御できます。

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `max_query_profile_num` | `500` | FE メモリに保持する Profile の最大件数。超過すると古いものから削除される |
| `max_spilled_profile_num` | `500` | ディスクに保持する Profile の最大件数。超過すると古いものから削除される |
| `spilled_profile_storage_path` | `log/profile` | Profile を保存するローカルディレクトリ |
| `spilled_profile_storage_limit_bytes` | `1 GB` | ディスク上に保持する Profile の総保存容量の上限 |

## Profile の取得

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenario: Viewing historical Profiles, downloading Profiles remotely -->

| 方法 | 利用場面 | 入口 |
| --- | --- | --- |
| FE Web UI | 日常的な調査、視覚的な確認 | `ip:http_port` の QueryProfile ページ |
| コマンドライン | セキュリティ上の制限がある場合、一括ダウンロード | `show query profile` と curl |
| ディスク上のファイルを直接読む | 永続化された Profile にすばやくアクセスする場合 | `log/profile` ディレクトリ内の zip ファイル |

### FE Web UI から取得する

- 目的：ブラウザーから FE 上の全クエリの Profile を表示します。
- 操作：FE の `ip:http_port` にアクセスし、ユーザー名とパスワードを入力して QueryProfile ページを開き、Profile ID をクリックして詳細を表示します。
- 説明：

    - Profile は SQL を実行した FE 上にのみ存在し、**複数の FE 間では同期されません**。Profile を取得するには、その SQL を実行した FE に接続する必要があります。
    - すべてのロードタスクは最終的に FE Master によって実行されるため、その Profile は FE Master から取得する必要があります。

![FE Web UI の Query Profile ページ](/images/profile/profile-image-1.png)

### コマンドラインから取得する

セキュリティ上の制限などにより、FE Web UI にアクセスできない場合があります。その場合は、コマンドラインから Profile を取得できます。

**手順 1：`show query profile` を使用して、直近 20 件の Profile のメタデータを取得します。**

```sql
mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| c7f48291d62147f4-92b1a511f6fe3395 | QUERY     | 2025-02-26 19:35:15 | 2025-02-26 19:35:15 | 5ms   | EOF        | root | internal        | tpch       | select 20     |
| 9c6cd24d2f354c6f-9652c097cae00b05 | QUERY     | 2025-02-26 19:35:12 | 2025-02-26 19:35:12 | 4ms   | EOF        | root | internal        | tpch       | select 19     |
| b908f7b484084492-9c4dc48762c9cb89 | QUERY     | 2025-02-26 19:35:09 | 2025-02-26 19:35:09 | 5ms   | EOF        | root | internal        | tpch       | select 18     |
| ef411c0eb00541dc-ba5a39677be3e117 | QUERY     | 2025-02-26 19:35:06 | 2025-02-26 19:35:06 | 5ms   | EOF        | root | internal        | tpch       | select 17     |
| c89deefa85974da7-ad53cb3d6f4cad75 | QUERY     | 2025-02-26 19:35:03 | 2025-02-26 19:35:03 | 5ms   | EOF        | root | internal        | tpch       | select 16     |
| dd97a36d2a1f4cbc-b23f13b975cd2dde | QUERY     | 2025-02-26 19:34:59 | 2025-02-26 19:34:59 | 6ms   | EOF        | root | internal        | tpch       | select 15     |
| af75095f7a7c4d9f-9422d04d0604f904 | QUERY     | 2025-02-26 19:34:56 | 2025-02-26 19:34:56 | 8ms   | EOF        | root | internal        | tpch       | select 14     |
| 2764a7aaf2cf446d-922b4c5b5f853788 | QUERY     | 2025-02-26 19:34:54 | 2025-02-26 19:34:54 | 10ms  | EOF        | root | internal        | tpch       | select 13     |
| bf15d7d96b9c4f6b-8e6fe4c40b077ae8 | QUERY     | 2025-02-26 19:34:53 | 2025-02-26 19:34:53 | 9ms   | EOF        | root | internal        | tpch       | select 12     |
| ebf2221627b0435e-9bafebbe46d7315d | QUERY     | 2025-02-26 19:34:51 | 2025-02-26 19:34:51 | 7ms   | EOF        | root | internal        | tpch       | select 11     |
| 3309a4c57f61471c-9c863f6bb72a146b | QUERY     | 2025-02-26 19:34:50 | 2025-02-26 19:34:50 | 10ms  | EOF        | root | internal        | tpch       | select 10     |
| cb764ed358f34312-a7c56cbf7f521761 | QUERY     | 2025-02-26 19:34:48 | 2025-02-26 19:34:48 | 10ms  | EOF        | root | internal        | tpch       | select 9      |
| 38878f3344b649ff-a69f1c8cd0dc1960 | QUERY     | 2025-02-26 19:34:46 | 2025-02-26 19:34:46 | 9ms   | EOF        | root | internal        | tpch       | select 8      |
| 1182dc4c8105407c-b77c50a993cc0cb1 | QUERY     | 2025-02-26 19:34:42 | 2025-02-26 19:34:42 | 14ms  | EOF        | root | internal        | tpch       | select 7      |
| 8596d808d2814e8d-aefbac7d30a599d1 | QUERY     | 2025-02-26 19:34:40 | 2025-02-26 19:34:40 | 31ms  | EOF        | root | internal        | tpch       | select 6      |
| 325a66e868844aa4-90fae17f3a98d3e6 | QUERY     | 2025-02-26 19:34:38 | 2025-02-26 19:34:38 | 40ms  | EOF        | root | internal        | tpch       | select 5      |
| e30d1166a2674393-997246e064a7674c | QUERY     | 2025-02-26 19:34:36 | 2025-02-26 19:34:36 | 19ms  | EOF        | root | internal        | tpch       | select 4      |
| 4dfb91db8b448db-a4eab023bc119cea  | QUERY     | 2025-02-26 19:34:33 | 2025-02-26 19:34:33 | 14ms  | EOF        | root | internal        | tpch       | select 3      |
| 1453559772434cda-b64c2eae47ce6424 | QUERY     | 2025-02-26 19:34:31 | 2025-02-26 19:34:31 | 10ms  | EOF        | root | internal        | tpch       | select 2      |
| cbf8bf829740488c-b6da653e391b13c6 | QUERY     | 2025-02-26 19:34:30 | 2025-02-26 19:34:30 | 20ms  | EOF        | root | internal        | tpch       | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
20 rows in set (0.00 sec)
```

**手順 2：curl で HTTP API にアクセスし、特定の Profile を取得します。** たとえば、ID が `f7efdc4c092d4b14-95e0f7f7783974d3` の Profile を取得するには、次を実行します。

```bash
curl -uroot: http://127.0.0.1:5937/api/profile/text?query_id=f7efdc4c092d4b14-95e0f7f7783974d3 > f7efdc4c092d4b14-95e0f7f7783974d3.profile
```

結果は Web UI に表示されるものと同じです。

```bash
> head f7efdc4c092d4b14-95e0f7f7783974d3.profile -n 10
Summary:
   - Profile ID: f7efdc4c092d4b14-95e0f7f7783974d3
   - Task Type: QUERY
   - Start Time: 2025-02-26 19:31:27
   - End Time: 2025-02-26 19:32:41
   - Total: 1min14sec
   - Task State: OK
   - User: root
   - Default Catalog: internal
   - Default Db: tpch
```

### ディスクから Profile ファイルを直接取得する

バージョン 3.0 以降では Profile の永続化がサポートされ、デフォルトの保存先は `log/profile` です。すばやく確認するには、`unzip` で対象ファイルを展開してテキスト形式の内容を取得できます。

注意事項：

1. Doris FE には `log/profile` ディレクトリを保護する仕組みがあります。**展開したファイルをこのディレクトリ内に置いたままにしないでください**。削除されます。
2. Profile のテキストは Web UI の表示と少し異なります。`Summary` は JSON メタデータとして保存されますが、それ以外は Web UI と同じです。

```bash
[hezhiqiang@VM-10-2-centos log]$ unzip profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
Archive:  profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
  inflating: 33bf38e988ea4945-b585d2f74d1da3fd.profile
[hezhiqiang@VM-10-2-centos log]$ head 33bf38e988ea4945-b585d2f74d1da3fd.profile -n 10
{"summaryProfile":{"counterTotalTime":{"value":0,"type":5,"level":1},"localTimePercent":0.0,"infoStrings":{"Distributed Plan":"N/A","Task Type":"QUERY","User":"root","Default Catalog":"internal","Total":"9sec745ms","Default Db":"tpch","Profile ID":"33bf38e988ea4945-b585d2f74d1da3fd","Task State":"OK","Sql Statement":"SELECT      c.c_name,      COUNT(o.o_orderkey) AS total_orders,      SUM(o.o_totalprice) AS total_spent FROM      customer c JOIN      orders o ON c.c_custkey = o.o_custkey GROUP BY      c.c_name limit 20","Start Time":"2025-02-28 20:18:31","End Time":"2025-02-28 20:18:41"}, ...}
Changed Session Variables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000
fetch_splits_max_wait_time_ms | 4000         | 1000
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1
auto_profile_threshold_ms     | 1            | -1
```

## Profile の構造

<!-- Knowledge type: Data structure description -->
<!-- Applicable scenario: Understanding the meaning of each part of a Profile and choosing the right section to read -->

Profile の内容は、次の五つの部分に分かれます。

| 部分 | 目的 | 使用する場面 |
| --- | --- | --- |
| Summary | Profile のメタデータ。取得に使う主要なフィールドを記録する | Profile の検索、クエリの基本情報の確認 |
| ExecutionSummary | 実行処理の概要。Planner の各段階にかかった時間を含む | SQL のコンパイル／プランニング段階にかかった時間の調査 |
| ChangedSessionVariables | このクエリの実行中に変更されたセッション変数 | 異常な設定による性能問題の調査 |
| MergedProfile | DetailProfile を集約した結果 | クエリ構造の把握、ボトルネックとなるオペレーターの特定、データの偏りの比較 |
| DetailProfile | すべての BE 上での各 Fragment と、各 Pipeline の PipelineTask の実行詳細 | ボトルネック特定後の詳細分析 |

### 1. Summary

`SummaryProfile` は Profile のメタデータであり、`Profile ID` や `Total` など、取得に使う主要なフィールドを記録します。

```text
-  Profile  ID:  d4d281168bf7490a-a133623295744f85
-  Task  Type:  QUERY
-  Start  Time:  2025-02-28  19:23:14
-  End  Time:  2025-02-28  19:23:16
-  Total:  2sec420ms
-  Task  State:  OK
```

### 2. ExecutionSummary

実行処理の概要です。Plan 関連のフィールドには、Planner にかかった時間が記録されます。

### 3. ChangedSessionVariables

このクエリの実行中に変更されたセッション変数を記録します。

```text
ChangedSessionVariables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000       
fetch_splits_max_wait_time_ms | 4000         | 1000        
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1           
auto_profile_threshold_ms     | 1            | -1          
```

上の表は、このクエリの実行前に 5 つのセッション変数が変更されたことを示しています。

### 4. MergedProfile

`MergedProfile` は `DetailProfile` を集約した結果です。主に次の三つの目的で使います。

- **クエリプランと Pipeline の構造をすばやく把握する**

    Doris のクエリプランは、Query、Fragment、PlanNode からなる階層構造です。実行層は Pipeline 単位でタスクをスケジュールし、各 Pipeline は複数の Operator で構成されます。MergedProfile には、この変換関係が明確に示されます。

- **性能ボトルネックとなるオペレーターをすばやく特定する**

    性能問題を調査するときは、通常、ボトルネックとなるオペレーターを特定する必要があります。まず MergedProfile の `DependencyWaitTime` を基に待機時間が最も長いオペレーターを見つけ、次に DetailProfile の詳細を確認してボトルネックを絞り込みます。

- **データの偏りを比較する**

    MergedProfile には、オペレーター間のデータの流れが詳しく記録されます。`InputRows` と `RowsProduced` を比較すると、Backend 間でデータが不均等に分散しているかどうかを判断できます。分散の偏りは、クエリの低速化や失敗につながることがよくあります。

### 5. DetailProfile

実行に関する詳細情報です。`DetailProfile` は、クエリ内のすべての Fragment と Pipeline について、全 Backend 上の各 `PipelineTask` の実行詳細を記録します。MergedProfile でボトルネックを確認した後、通常は DetailProfile と併せて詳しく分析します。

## Profile の読み解き例

<!-- Knowledge type: Hands-on example -->
<!-- Applicable scenario: First time interpreting a Profile, understanding the relationship between Pipelines and Operators -->

次の例では、Aggregation、Join、Scan を含む典型的なクエリを使い、Profile の読み解き方を説明します。TPCH データセットの `customer` テーブルと `orders` テーブルを JOIN してから、結果を集約します。

```sql
SELECT c.c_name,
       Count(o.o_orderkey) AS total_orders,
       Sum(o.o_totalprice) AS total_spent
FROM   customer c
       JOIN orders o
         ON c.c_custkey = o.o_custkey
GROUP  BY c.c_name
LIMIT  20 
```

Profile が長くなりすぎないように、クエリの並列度を制限します。

```sql
set parallel_pipeline_task_num=2;
```

上記のクエリを実行して Web UI から Profile を取得したら、まず MergedProfile を確認します。全体の構造に注目できるよう、以下では主要なフィールドのみを残しています。その他のフィールドの意味については、関連ドキュメントを参照してください。

```text
MergedProfile:
     Fragments:
       Fragment 0:
         Pipeline 0(instance_num=1):
           RESULT_SINK_OPERATOR(id=0):
             CommonCounters:
                - ExecTime: avg 176.545us, max 176.545us, min 176.545us
                - InputRows: sum 20, avg 20, max 20, min 20
                - WaitForDependency[RESULT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=8):
             CommonCounters:
                - ExecTime: avg 84.559us, max 84.559us, min 84.559us
                - RowsProduced: sum 20, avg 20, max 20, min 20
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 1:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=8):
             CommonCounters:
                - ExecTime: avg 31.515us, max 33.405us, min 29.626us
                - InputRows: sum 20, avg 10, max 11, min 9
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
                - BlocksProduced: sum 2, avg 1, max 1, min 1
           SORT_OPERATOR(nereids_id=443)(id=7):
             CommonCounters:
                - ExecTime: avg 980ns, max 1.199us, min 762ns
                - RowsProduced: sum 20, avg 10, max 11, min 9
                - WaitForDependency[SORT_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
             CustomCounters:
         Pipeline 1(instance_num=2):
           SORT_SINK_OPERATOR(nereids_id=443)(id=7):
             CommonCounters:
                - ExecTime: avg 49.414us, max 54.802us, min 44.27us
                - InputRows: sum 20, avg 10, max 11, min 9
                - WaitForDependency[SORT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           AGGREGATION_OPERATOR(nereids_id=438)(id=6):
             CommonCounters:
                - ExecTime: avg 34.521us, max 36.402us, min 32.640us
                - RowsProduced: sum 20, avg 10, max 11, min 9
                - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
             CustomCounters:
         Pipeline 2(instance_num=2):
           AGGREGATION_SINK_OPERATOR(nereids_id=438)(id=6):
             CommonCounters:
                - ExecTime: avg 109.89us, max 118.582us, min 99.596us
                - InputRows: sum 40, avg 20, max 22, min 18
                - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=5):
             CommonCounters:
                - ExecTime: avg 29.741us, max 34.521us, min 24.962us
                - RowsProduced: sum 40, avg 20, max 22, min 18
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 2:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=5):
             CommonCounters:
                - ExecTime: avg 71.148us, max 73.242us, min 69.54us
                - InputRows: sum 40, avg 20, max 20, min 20
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           AGGREGATION_OPERATOR(nereids_id=428)(id=4):
             CommonCounters:
                - ExecTime: avg 350.431us, max 393.100us, min 307.762us
                - RowsProduced: sum 40, avg 20, max 20, min 20
                - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec30ms, max 11sec450ms, min 10sec610ms
             CustomCounters:
         Pipeline 1(instance_num=2):
           AGGREGATION_SINK_OPERATOR(nereids_id=428)(id=4):
             CommonCounters:
                - ExecTime: avg 442.308ms, max 449.109ms, min 435.506ms
                - InputRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
                - MemoryUsage: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
                - MemoryUsagePeak: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
                - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
                - MemoryUsageHashTable: sum 1.03 MB, avg 526.28 KB, max 526.28 KB, min 526.28 KB
                - MemoryUsageSerializeKeyArena: sum 1.02 MB, avg 524.00 KB, max 524.00 KB, min 524.00 KB
           HASH_JOIN_OPERATOR(nereids_id=418)(id=3):
             CommonCounters:
                - ExecTime: avg 9sec169ms, max 9sec582ms, min 8sec756ms
                - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
             CustomCounters:
                - ProbeRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
           OLAP_SCAN_OPERATOR(nereids_id=397. table_name=orders(orders))(id=2):
             CommonCounters:
                - ExecTime: avg 396.233ms, max 410.306ms, min 382.160ms
                - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
             CustomCounters:
                - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
         Pipeline 2(instance_num=2):
           HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
             CommonCounters:
                - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
                - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
                - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
             CustomCounters:
                - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
           EXCHANGE_OPERATOR(id=1):
             CommonCounters:
                - ExecTime: avg 10.131ms, max 20.243ms, min 19.26us
                - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 47.582ms, max 47.582ms, min 47.582ms
       Fragment 3:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=1):
             CommonCounters:
                - ExecTime: avg 3.269ms, max 3.281ms, min 3.258ms
                - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForLocalExchangeBuffer0: avg 142.859ms, max 285.713ms, min 6.733us
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           OLAP_SCAN_OPERATOR(nereids_id=403. table_name=customer(customer))(id=0):
             CommonCounters:
                - ExecTime: avg 77.435ms, max 78.752ms, min 76.118ms
                - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
             CustomCounters:
                - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 49.690ms, max 50.522ms, min 48.858ms
```

以上は簡略化した MergedProfile です。Doris のクエリプランは Query、Fragment、PlanNode の三層構造ですが、Backend の実行エンジンにはさらに Pipeline と Operator の二層が加わります。次の図は、まずクエリプランの観点から、上記のクエリが三層に分かれる様子を示しています。

### Query、Fragment、PlanNode

![クエリプランの三層構造の例](/images/next/query-acceleration/profile-fragment.jpg)

図の矢印はデータフローの方向を示します。クエリ全体のプランは、4 つの Fragment（図の左側にある四つのボックス）と複数の PlanNode に分かれます。Fragment とそれに含まれる PlanNode は同じ水平線上にあります。各 PlanNode の役割は次のとおりです。

| PlanNode | 役割 |
| --- | --- |
| `SCAN_NODE` x2 | `customer` テーブルと `orders` テーブルをそれぞれ読み込む |
| `DATA_STREAM_SINK` / `EXCHANGE` | 異なる Fragment 間でデータを受け渡す |
| `HASH_JOIN` | SCAN で読み込んだデータを結合する |
| `AGGREGATION`（第一段階）/ `AGGREGATION(MERGE)`（第二段階） | 二段階の集約を行う |
| `TOP-N` | 結果の行数を制限する |
| `RESULT_SINK` | 最終結果を FE に返す |

### Pipeline と Operator

上記のクエリプランは、実行エンジン内でどのように Pipeline と Operator に変換されるのでしょうか。AGGREGATION と HASH_JOIN を含む Fragment 1 と Fragment 2 を例に説明します。

![PlanNode から Pipeline と Operator への変換](/images/next/query-acceleration/profile-fragment-2.jpg)

実行時には、Doris の実行エンジンが一部の PlanNode を一つ以上の Operator に分割します。

**例 1：DATA_STREAM_SINK**

`DATA_STREAM_SINK` は `DATA_STREAM_SINK_OPERATOR` に変換されます。このノードは、Fragment が外部にデータを出力する際に通るオペレーターです。自身の OperatorId はなく、送信先の OperatorId だけを持ちます。たとえば `dest_id=5` は、このオペレーターが `EXCHANGE_OPERATOR`（`id=5`）にデータを送ることを示します。

**例 2：HASH_JOIN**

PlanNodeId が 3 の HASH_JOIN は、`HASH_JOIN_SINK_OPERATOR` と `HASH_JOIN_OPERATOR` の二つの Operator に分割されます。どちらの Operator Id も PlanNodeId と同じ 3 です。第一段階の AGGREGATION と第二段階の AGGREGATION(MERGE) も、それぞれ SINK と SOURCE の Operator の組に分割されます。

**Pipeline の接続とブロッキング関係**

PlanNode を Operator に分割した後、実行エンジンはそれらの一部を接続して Pipeline を形成します。Fragment 1 と Fragment 2 は、それぞれ内部に 3 つの Pipeline を持ちます。

| ブロッキングの種類 | 原因 | 例 |
| --- | --- | --- |
| 計算上の依存関係 | オペレーター間の計算順序 | HashJoin の Probe 側は、Build 側がハッシュテーブルを構築し終えるまで待つ必要がある |
| 物理環境上の依存関係 | ネットワークやバッファリングなどのシステム要因 | EXCHANGE_OPERATOR は、DATA_STREAM_SINK_OPERATOR がネットワーク経由でデータを送信するのを待つ必要がある |

同じ Pipeline 内の Operator 間のデータフローは**ブロックしません**。異なる Pipeline の Operator 間の接続には**ブロッキング関係があります**。ブロックしない Operator を Pipeline にまとめてスケジュール・実行することで、リソース使用率とキャッシュヒット率を高められます。

### CommonCounters と CustomCounters

`CommonCounters` は、すべての Operator が持つ Counter です。現在、Doris には次のものがあります。

| Counter | 対象オペレーター | 意味 |
| --- | --- | --- |
| `ExecTime` | すべて | 現在の Operator の実行に費やした時間。**上流のオペレーターは含まない** |
| `RowsProduced` | Sink 以外の Operator | ソースオペレーターが出力した行数 |
| `InputRows` | Sink Operator | 現在のオペレーターが受け取った入力行数 |
| `MemoryUsage` & `MemoryUsagePeak` | すべて | オペレーターの現在のメモリ使用量とピーク使用量 |
| `WaitForDependency` | すべて | 依存先の実行完了を待つ時間 |

`CustomCounters` は各 Operator 固有の Counter です。各オペレーターの CustomCounter の意味の詳細については、「Doris Operator Profile Overview」を参照してください。

### HashJoin の読み解き方

Doris の実行に関する基本概念を確認したところで、先ほどのクエリに戻り、MergedProfile から Join の実行詳細を読み解きます。

![Pipeline 内での HashJoin の実行詳細](/images/next/query-acceleration/profile-join.jpg)

SQL を実行する前に、クエリの Pipeline 並列度を 2 に設定しました。したがって、図には接続された Pipeline 1 と Pipeline 2 の組が一つだけ示されていますが、実際の実行では Pipeline Task は合計 4 つになります。各 Pipeline に二つの Pipeline Task があります。

```text
Pipeline 0(instance_num=2)
```

各 Pipeline の後に括弧で示される `instance_num` は、すべての BE にまたがるその Pipeline の PipelineTask の総数です。ここで使用したクラスターの BE は 1 台だけなので、`instance_num = 1 * parallel_pipeline_task_num = 2` です。

**Build 側：HashTable の構築**

Pipeline 2 の二つの PipelineTask は、合計 15M 行のデータを処理して HashTable を構築しました。HashTable 構築の平均実行時間は 445.146 ms です。Pipeline 1 は、Pipeline 2 が HashTable の構築を終えてからでなければ実行できません。待機時間は `WaitForDependency` に示され、`avg` は 949.860 ms です。しかし、HashTable の平均構築時間は 445.146 ms しかありません。この差はどこから生じるのでしょうか。

```text
HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
 CommonCounters:
    - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
    - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
    - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
 CustomCounters:
    - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
```

理由は、この例では FE が JOIN の種類を `BROADCAST_JOIN` としてプランニングしたためです。この種類では、JOIN の Build 操作を行う二つの PipelineTask のうち、実際にハッシュテーブルを構築するのは一つだけです。`HASH_JOIN_SINK_OPERATOR` の MergedProfile から次のことがわかります。

- 平均実行時間は 445.146 ms ですが、最も遅い PipelineTask には 890.258 ms かかり、最も速いものはわずか 34.635 us です。
- `min` の値が 0 になっている `InputRows` から、すべてのデータを一つの PipelineTask が処理し、もう一つは何も処理していないことがわかります。

これにより、次の行の待機時間を説明できます。

```text
- WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
```

**Probe 側：スキャンと結合**

次に `HASH_JOIN_OPERATOR` を見ます。平均 949.860 ms 待機した後、JOIN の Probe 側の実行を開始します。二つの `OLAP_SCAN_OPERATOR` インスタンス（`id=2`）は、ストレージから 150M 行を読み込みます。この 150M 行が `HASH_JOIN_OPERATOR` で処理された後、残る行はありません。そのすべてが上流の `AGGREGATION_SINK_OPERATOR` に渡されます。このオペレーターは、これら 150M 行についてハッシュテーブルを構築し、集約計算を続けます。

### Aggregation の読み解き方

このクエリに含まれる集約処理は、`Count(o.o_orderkey) AS total_orders, Sum(o.o_totalprice) AS total_spent` と `GROUP BY c.c_name` です。

![二段階集約の実行詳細](/images/next/query-acceleration/profile-agg.jpg)

このクエリでは、Doris は二段階の Aggregation を使用します。

**第一段階の集約**

- `id=4` の AGGREGATION オペレーターの組で実行されます。
- `AGGREGATION_SINK_OPERATOR(id=4)` の入力は合計 150M 行です。`GROUP BY` 列に基づいてハッシュテーブルを構築し、各集約結果の `AggregationData` を更新します。
- 第一段階が終わると、`AggregationData` は EXCHANGE を通じて第二段階に送られます。異なる PipelineTask が同じ GROUP BY 列を処理する可能性があるため、EXCHANGE 段階では `name` 列で HASH パーティショニングを行い、同じ名前の行を同じ第二段階のオペレーターに送ります。
- `AGGREGATION_OPERATOR(id=4)` の出力は合計 40 行であり、第一段階で構築されたハッシュテーブルに 40 行あることを示します。

**第二段階の集約**

- `AGGREGATION_SINK_OPERATOR(id=6)` は第一段階の結果を `AggregationData` に逆シリアル化し、Merge 操作を行います。
- 結果は `AGGREGATION_OPERATOR(id=6)` から下流の TOP-N に送られます。クエリには `LIMIT 20` があるため、TOP-N オペレーターは 20 行を収集した時点で早期に終了します。

**全体のボトルネック**

全体として、このクエリで最も時間がかかる処理は `HASH_JOIN_OPERATOR(id=3)` です。特定したら、DetailProfile で `HASH_JOIN_OPERATOR(id=3)` のより詳細な Counter を確認できます。各 Counter の意味については、オペレーターごとのドキュメントを参照してください。

## トラブルシューティングと FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common issues encountered when using Profile in daily work -->

### `show query profile` の結果が空になる場合

- `enable_profile` が `true` か確認します：`show variables like 'enable_profile';`。
- `auto_profile_threshold_ms` を確認します。大きな値に設定されていると、短いクエリの Profile は生成されません。
- 接続先の FE が、SQL を実行した FE と同じノードか確認します。ロードタスクの場合は FE Master に接続する必要があります。

### Profile の報告が頻繁にタイムアウトする場合

- 症状：FE ログに非同期 Profile 収集のタイムアウトが記録されます。
- 対処方法：

    1. マシンの CPU、メモリ、ネットワークの使用量を確認します。
    2. `profile_async_collect_expire_time_secs` の値を `fe.conf` で増やします。
    3. 極端な場合はグローバルな Profile を無効にし、低速クエリの Profile のみを収集します（`auto_profile_threshold_ms` を設定）。

### Profile が FE メモリを大量に消費する場合

- `max_query_profile_num` を減らし、メモリに保持する Profile の件数を制限します。
- ディスク永続化（デフォルトで有効）を使い、過去の Profile をディスクに退避します。
- `auto_profile_threshold_ms` を使い、短いクエリを除外します。

### 展開した Profile ファイルが消えた場合

- 原因：FE には `log/profile` ディレクトリを保護するためのクリーンアップ機構があります。
- 対処方法：展開したファイルは `log/profile` **以外の**ディレクトリに置いてください。

### データの偏りがあるか確認するには

- MergedProfile で、同じオペレーターについて `min`、`avg`、`max` を `InputRows`／`RowsProduced` の値で比較します。
- `max` が `avg` を大きく上回る場合や、`min` が 0 で `max` が非常に大きい場合は、通常、データの偏りを示します。

## 用語集

<!-- Knowledge type: Glossary -->
<!-- Applicable scenario: Term alignment -->

| 用語 | 一文での定義 |
| --- | --- |
| Query Profile | 一つのクエリの実行詳細を記録する診断用のデータ構造 |
| Fragment | BE に配布して実行できる、クエリプランの実行単位 |
| PlanNode | クエリプラン内の論理オペレーターノード |
| Pipeline | ブロックしない複数の Operator で構成される実行パイプライン |
| Operator | PlanNode から分割される、実行エンジン内の最小実行単位 |
| MergedProfile | 複数の BE と PipelineTask にまたがって集約された Profile |
| DetailProfile | 各 BE 上の各 PipelineTask の詳細な Profile |
| `WaitForDependency` | オペレーターが依存先の完了を待つ時間。ボトルネックの特定によく使う |
