---
{
    "title": "Query Profile 分析ガイド：Doris の遅いクエリのパフォーマンスボトルネックを特定する",
    "sidebar_label": "Query Profile 分析",
    "language": "ja",
    "description": "Apache Doris Query Profile を使用してクエリの実行詳細を収集、表示、解釈する方法を説明します。アーキテクチャ、パラメータ設定、取得方法、ボトルネックの特定方法を扱います。",
    "keywords": ["Doris Query Profile", "クエリのパフォーマンス分析", "遅いクエリの特定", "Profile の解釈", "MergedProfile", "DetailProfile", "enable_profile", "profile_level"]
}
---

<!-- Knowledge type: Concept + Operation guide -->
<!-- Applicable scenario: Apache Doris users troubleshooting slow queries, analyzing execution plans, and locating operator bottlenecks -->

Query Profile は、Apache Doris がクエリの実行詳細を表示するために使用する診断ツールです。各 Operator の実行時間、行数、メモリ使用量などの主要な指標を記録し、遅いクエリのボトルネックをすばやく特定するのに役立ちます。

読み進める前に、次の点を確認してください。

- Apache Doris クラスターがデプロイされており、FE の設定ファイル `fe.conf` を変更する権限があること。
- MySQL クライアントから Doris に接続し、`show query profile` などのコマンドを実行できること。
- クエリプランの基本概念（Fragment、PlanNode）を理解していること。

この記事は主に次の部分で構成されています。

| セクション | 内容 |
| --- | --- |
| 全体アーキテクチャ | Profile が BE から収集され、FE に保存される仕組み |
| パラメータ設定 | 不要な情報を除外し、クエリの重要な詳細に注目するための設定方法 |
| 解釈方法 | クエリのパフォーマンスに影響する Operator をすばやく特定する方法 |

## Query Profile の全体アーキテクチャ {#overall-architecture-of-query-profile}

<!-- Knowledge type: Architectural principles -->
<!-- Applicable scenario: Understanding the Profile collection process and troubleshooting reporting failures -->

![Query Profile の全体アーキテクチャ](/images/next/query-acceleration/profile-arch.jpg)

Query Profile の中核は、FE 上の `ProfileManager` と BE 上の `AsyncReportThreadPool` の部分から構成されます。

### 収集プロセス {#collection-process}

| ステップ | 担当 | 動作 |
| --- | --- | --- |
| 1 | FE | ユーザーがクエリを発行すると、FE は Profile のデータ構造を `ProfileManager` に登録する |
| 2 | BE | クエリ完了後、BE は自身の Profile を非同期報告タスクとして登録する |
| 3 | BE | `AsyncReportThreadPool` がクエリ単位で RPC を開始し、Profile を FE に送信する |
| 4 | FE | バックグラウンドスレッドが Profile を処理し、ポリシーに従って保持または削除し、適切な Profile を圧縮してストレージに書き込む |
| 5 | ユーザー | Web UI または curl による HTTP リクエストで Profile を表示する |
| 6 | FE | `ProfileManager` がメモリまたは外部ストレージから Profile を探し、テキストとして返す |

このプロセス全体では、**ステップ 2 の非同期報告**と**ステップ 4 の Profile の永続化**が、Profile 機能に最も大きく影響します。

### 非同期報告のタイムアウト {#asynchronous-reporting-timeout}

クラスターに高い負荷がかかっていると、非同期報告がタイムアウトすることがあります。FE のメモリ消費が過大にならないよう、`ProfileManager` は一定時間待機した後、タイムアウトした Profile を破棄します。

- 調整方法：`fe.conf` の `profile_async_collect_expire_time_secs` を変更して、待機時間を制御します。
- 推奨する対応：タイムアウトが頻発する場合は、まずマシンのリソース使用状況を確認します。必要に応じて、リスクを減らすためにグローバルな Profile を無効にします。

### Profile の永続化の利点 {#benefits-of-profile-persistence}

`ProfileManager` が Profile をディスクに永続化すると、次のことが可能になります。

1. Profile が FE のメモリを大量に消費しなくなります。
2. FE の再起動後も、以前に生成された Profile を照会できます。

前者により、FE は数千件の完全な Profile を保持できます。後者により、アップグレード前後のクラスターのパフォーマンスを比較し、バージョンアップによって Doris のクエリ性能が改善したかを検証しやすくなります。

## Profile の設定 {#configuring-profile}

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Enabling/disabling Profile, controlling collection granularity and storage -->

### パラメータ早見表 {#parameter-quick-reference}

| パラメータ | 適用範囲 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `enable_profile` | セッション／グローバル | `false` | Profile を生成するかどうか |
| `profile_level` | セッション／グローバル | `2` | Profile の詳細レベル（1～3、4.0 以降で有効） |
| `auto_profile_threshold_ms` | グローバル | `-1` | 実行時間がしきい値を超えるクエリについてのみ Profile を生成する（3.0 以降で有効） |
| `max_query_profile_num` | `fe.conf` | `500` | FE のメモリに保持する Profile の最大数 |
| `max_spilled_profile_num` | `fe.conf` | `500` | ディスクに保持する Profile の最大数 |
| `spilled_profile_storage_path` | `fe.conf` | `log/profile` | Profile のローカル保存ディレクトリ |
| `spilled_profile_storage_limit_bytes` | `fe.conf` | `1 GB` | ディスク上の Profile の総保存容量の上限 |

以下のアーカイブ済みの例と ChangedSessionVariables の例には、過去の Profile が含まれています。そこに示される `profile_level` のデフォルト値 `1` は収集時に使用したバージョンの値であり、現在のデフォルト値ではありません。

4.1.5 以降では、Master FE に転送されたクエリでも、セッションの `profile_level` が維持されます。値については[セッション変数のリファレンス](../sql-manual/basic-element/session-variables.md#profile_level)を参照してください。

### Profile の有効化 {#enabling-profile}

#### enable_profile {#enable_profile}

- 目的：Profile を生成するかどうかを制御します。
- コマンド：`set enable_profile=true;`
- 説明：デフォルトは `false` です。無効にすると、`show query profile` を実行しても新たに生成されたレコードは返されません。

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

#### profile_level {#profile_level}

- 目的：Profile の詳細レベルを制御します。
- コマンド：`set profile_level=2;`
- 説明：デフォルト値は `2` です。**このパラメータはバージョン 4.0 以降で有効です。4.0 より前のバージョンでは意味が異なるため、使用しないでください。**

| レベル | 動作 | パフォーマンスへの影響 |
| --- | --- | --- |
| 1 | BE は簡略化された Profile のみを報告し、FE が MergedProfile に集約するために必要な情報を提供する | 最小限 |
| 2（デフォルト） | より詳細な Counter を出力し、詳細な分析に適する | 小さい |
| 3 | 最大の粒度。一部の Counter の収集がクエリ性能に影響する場合がある | 大きい |

例：`profile_level=1` の場合、`EXCHANGE_OPERATOR` の Counter は次のようになります。

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

`profile_level=2` の場合は、さらに詳細な Counter を確認できます。

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

#### auto_profile_threshold_ms {#auto_profile_threshold_ms}

- 目的：実行時間がしきい値を超えるクエリについてのみ Profile を生成し、短時間で終わるクエリの Profile に遅いクエリの Profile が埋もれるのを防ぎます。
- コマンド：`set global auto_profile_threshold_ms=1000;`
- 説明：デフォルトは `-1` で、すべてのクエリに対して Profile を生成します。このパラメータはバージョン 3.0 以降で有効です。

このパラメータが必要な理由は何でしょうか。Profile をグローバルに有効にすると大量のデータが生成され、FE の CPU、メモリ、ディスクを消費して、遅延に敏感な短時間のクエリにも影響します。そのため、FE は Profile を定期的に削除します。このパラメータを使用すると、遅いクエリの Profile がほかの Profile に埋もれるのを防げます。

例：Profile がグローバルに有効で、すべてのクエリが Profile を生成しているとします。

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

これらの短時間のクエリについて Profile の生成を停止するには、次の手順を実行します。

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

### Profile の保存設定 {#configuring-profile-storage}

Doris は Profile を FE のローカルディスクに永続化し、より多くのレコードを保持できます。これは `fe.conf` の次のパラメータで制御できます。

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `max_query_profile_num` | `500` | FE のメモリに保持する Profile の最大数。超過すると古いものから削除される |
| `max_spilled_profile_num` | `500` | ディスクに保持する Profile の最大数。超過すると古いものから削除される |
| `spilled_profile_storage_path` | `log/profile` | Profile のローカル保存ディレクトリ |
| `spilled_profile_storage_limit_bytes` | `1 GB` | ディスクに保持する Profile の総保存容量の上限 |

## Profile の取得 {#retrieving-profiles}

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenario: Viewing historical Profiles, downloading Profiles remotely -->

| 方法 | 利用場面 | アクセス先 |
| --- | --- | --- |
| FE Web UI | 日常的なトラブルシューティング、画面での確認 | `ip:http_port` の QueryProfile ページ |
| コマンドライン | セキュリティ上の制限がある場合、一括ダウンロード | `show query profile` と curl |
| ディスク上のファイルを直接読む | 永続化された Profile をすばやく確認する | `log/profile` ディレクトリ内の zip ファイル |

### FE Web UI から取得する {#retrieving-via-the-fe-web-ui}

- 目的：FE 上のすべてのクエリの Profile をブラウザーで表示します。
- 操作：FE の `ip:http_port` にアクセスし、ユーザー名とパスワードを入力して QueryProfile ページを開き、Profile ID をクリックして詳細を表示します。
- 注意事項：

    - Profile は SQL を実行した FE 上にのみ存在し、**複数の FE 間で同期されません**。Profile を取得するには、その SQL を実行した FE に接続する必要があります。
    - すべてのデータロードタスクは最終的に FE Master によって実行されるため、その Profile は FE Master から取得する必要があります。

![FE Web UI の Query Profile ページ](/images/profile/profile-image-1.png)

### コマンドラインから取得する {#retrieving-via-the-command-line}

セキュリティ上の制限などにより、FE Web UI にアクセスできない場合があります。その場合は、コマンドラインから Profile を取得できます。

**ステップ 1：`show query profile` を使用して、直近 20 件の Profile のメタデータを取得します。**

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

**ステップ 2：curl で HTTP API にアクセスし、特定の Profile を取得します。** たとえば、ID が `f7efdc4c092d4b14-95e0f7f7783974d3` の Profile を取得するには、次のコマンドを実行します。

```bash
curl -uroot: http://127.0.0.1:5937/api/profile/text?query_id=f7efdc4c092d4b14-95e0f7f7783974d3 > f7efdc4c092d4b14-95e0f7f7783974d3.profile
```

結果は Web UI に表示される内容と同じです。

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

### ディスクから Profile ファイルを直接取得する {#retrieving-profile-files-directly-from-disk}

3.0 以降では Profile の永続化がサポートされ、デフォルトの保存先は `log/profile` です。すばやく確認するには、`unzip` を使って対象ファイルを直接展開し、テキスト形式の Profile を取得できます。

注意事項：

1. Doris FE には `log/profile` ディレクトリを保護する仕組みがあります。**展開したファイルをそのディレクトリ内に置いたままにしないでください**。削除されます。
2. Profile のテキストは Web UI の表示と少し異なります。`Summary` は JSON メタデータとして保存されますが、その他の部分は Web UI と同じです。

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

## Profile の構造 {#profile-structure}

<!-- Knowledge type: Data structure description -->
<!-- Applicable scenario: Understanding the meaning of each part of a Profile and choosing the right section to read -->

Profile の内容は、次の部分に分かれています。

| 部分 | 目的 | 使用場面 |
| --- | --- | --- |
| Summary | 取得に使用する主要なフィールドを記録した Profile のメタデータ | Profile の検索、クエリの基本情報の確認 |
| ExecutionSummary | 各 Planner 段階の所要時間を含む、実行プロセスの概要 | SQL のコンパイル／プランニング段階の所要時間の調査 |
| ChangedSessionVariables | このクエリの実行時に変更されていたセッション変数 | 異常な設定によるパフォーマンス問題の調査 |
| MergedProfile | DetailProfile の集約結果 | クエリ構造の把握、ボトルネックとなる Operator の特定、データの偏りの比較 |
| DetailProfile | すべての BE における、各 Fragment と各 Pipeline の PipelineTask の実行詳細 | ボトルネックを特定した後の詳細分析 |

### 1. Summary {#1-summary}

`SummaryProfile` は Profile のメタデータで、取得に使用する `Profile ID` や `Total` などの主要なフィールドを記録します。

```text
-  Profile  ID:  d4d281168bf7490a-a133623295744f85
-  Task  Type:  QUERY
-  Start  Time:  2025-02-28  19:23:14
-  End  Time:  2025-02-28  19:23:16
-  Total:  2sec420ms
-  Task  State:  OK
```

### 2. ExecutionSummary {#2-executionsummary}

実行プロセスの概要です。このうち Plan 関連のフィールドには、Planner の所要時間が記録されます。

### 3. ChangedSessionVariables {#3-changedsessionvariables}

このクエリの実行時に変更されていたセッション変数を記録します。

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

上の表は、このクエリの実行前に 5 個のセッション変数が変更されていたことを示しています。

### 4. MergedProfile {#4-mergedprofile}

`MergedProfile` は `DetailProfile` の集約結果です。主に次の目的で使用します。

- **クエリプランと Pipeline の構造をすばやく把握する**

    Doris のクエリプランは、Query、Fragment、PlanNode の階層構造を持ちます。実行レイヤーは Pipeline 単位でタスクをスケジュールし、各 Pipeline は Operator のグループで構成されます。MergedProfile は、この変換関係を明確に示します。

- **パフォーマンスのボトルネックとなる Operator をすばやく特定する**

    パフォーマンス問題を調べる際は、通常、ボトルネックとなる具体的な Operator を特定する必要があります。まず MergedProfile の `DependencyWaitTime` を基に所要時間が最も長い Operator を探し、次に DetailProfile でその詳細を確認して、ボトルネックをさらに絞り込みます。

- **データの偏りを比較する**

    MergedProfile は Operator 間のデータの流れを詳しく記録します。`InputRows` と `RowsProduced` を比較すると、異なる Backend 上のデータが均等に分散しているかを判断できます。データ分布の偏りは、クエリの遅延や失敗の原因になることがよくあります。

### 5. DetailProfile {#5-detailprofile}

詳細な実行情報です。`DetailProfile` は、クエリの各 Fragment と Pipeline について、すべての Backend 上の各 `PipelineTask` の実行詳細を記録します。MergedProfile でボトルネックを確認した後は、通常、DetailProfile と組み合わせて詳しく分析します。

## Profile の解釈例 {#profile-interpretation-example}

<!-- Knowledge type: Hands-on example -->
<!-- Applicable scenario: First time interpreting a Profile, understanding the relationship between Pipelines and Operators -->

以下では、Aggregation、Join、Scan を含む典型的なクエリを使って、Profile の読み方を説明します。TPCH データセットの `customer` テーブルと `orders` テーブルを JOIN し、その結果を集約するクエリです。

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

Profile が長くなりすぎないよう、クエリの並列度を制限します。

```sql
set parallel_pipeline_task_num=2;
```

上のクエリを実行し、Web UI から Profile を取得したら、まず MergedProfile に注目します。全体構造を把握しやすいよう、以下には主要なフィールドのみを残しています。その他のフィールドの意味は、関連ドキュメントを参照してください。

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

上記は簡略化した MergedProfile です。Doris のクエリプランは Query、Fragment、PlanNode の階層構造を持ちます。Backend の実行エンジンでは、さらに Pipeline と Operator の階層が加わります。以下の図ではまず、上記のクエリがクエリプランの観点からどのように分割されるかを示します。

### Query、Fragment、PlanNode {#query-fragment-and-plannode}

![クエリプランの階層構造の例](/images/next/query-acceleration/profile-fragment.jpg)

図の矢印はデータの流れる方向を示します。Query 全体のクエリプランは、4 個の Fragment（図の左側にある四角形）と複数の PlanNode に分割されます。Fragment とそれに含まれる PlanNode は、同じ水平線上に配置されています。各 PlanNode の役割は次のとおりです。

| PlanNode | 役割 |
| --- | --- |
| `SCAN_NODE` x2 | `customer` テーブルと `orders` テーブルをそれぞれ読み取る |
| `DATA_STREAM_SINK` / `EXCHANGE` | 異なる Fragment 間でデータを受け渡す |
| `HASH_JOIN` | SCAN で読み取ったデータに対して結合を実行する |
| `AGGREGATION`（第 1 段階）/ `AGGREGATION(MERGE)`（第 2 段階） | 段階的に集約する |
| `TOP-N` | 結果行数を制限する |
| `RESULT_SINK` | 最終結果を FE に返す |

### Pipeline と Operator {#pipelines-and-operators}

上記のクエリプランは、実行エンジン内でどのように Pipeline と Operator に変換されるのでしょうか。AGGREGATION と HASH_JOIN を含む Fragment 1 と Fragment 2 を例に説明します。

![PlanNode から Pipeline と Operator への変換](/images/next/query-acceleration/profile-fragment-2.jpg)

Doris の実行エンジンは、実行時に一部の PlanNode を複数の Operator に分割します。

**例 1：DATA_STREAM_SINK**

`DATA_STREAM_SINK` は `DATA_STREAM_SINK_OPERATOR` に変換されます。このノードは、Fragment が外部にデータを出力する際に通る Operator です。自身の OperatorId は持たず、宛先の OperatorId のみを持ちます。たとえば、`dest_id=5` は、この Operator が `id=5` の `EXCHANGE_OPERATOR` にデータを送ることを示します。

**例 2：HASH_JOIN**

PlanNodeId が 3 の HASH_JOIN は、`HASH_JOIN_SINK_OPERATOR` と `HASH_JOIN_OPERATOR` の Operator に分割されます。どちらの Operator Id も PlanNodeId と同じ 3 です。第 1 段階の AGGREGATION と第 2 段階の AGGREGATION(MERGE) も、それぞれ SINK Operator と SOURCE Operator の組に分割されます。

**Pipeline 間の接続とブロッキングの関係**

PlanNode を Operator に分割した後、実行エンジンは一部の Operator をつないで Pipeline を形成します。Fragment 1 と Fragment 2 は、それぞれ内部に 3 個の Pipeline を持ちます。

| ブロッキングの種類 | 原因 | 例 |
| --- | --- | --- |
| 計算ロジック上の依存関係 | Operator 間の計算順序 | HashJoin の Probe 側は、Build 側によるハッシュテーブルの構築完了を待つ必要がある |
| 物理環境上の依存関係 | ネットワークやバッファリングなどのシステム要因 | EXCHANGE_OPERATOR は、DATA_STREAM_SINK_OPERATOR によるネットワーク経由のデータ送信を待つ必要がある |

同じ Pipeline 内の Operator 間のデータの流れは**ブロックされません**。異なる Pipeline の Operator 間の接続には**ブロッキングの関係があります**。ブロックしない Operator を Pipeline としてつなげてスケジュール、実行することで、リソース使用効率とキャッシュヒット率を向上できます。

### CommonCounters と CustomCounters {#commoncounters-and-customcounters}

`CommonCounters` は、すべての Operator が持つ Counter です。現在の Doris には、次のものがあります。

| Counter | 対象の Operator | 意味 |
| --- | --- | --- |
| `ExecTime` | すべて | 現在の Operator の実行に要した時間。**上流の Operator は含まない** |
| `RowsProduced` | Sink 以外の Operator | Source Operator が出力した行数 |
| `InputRows` | Sink Operator | 現在の Operator が受け取った入力行数 |
| `MemoryUsage` & `MemoryUsagePeak` | すべて | Operator の現在のメモリ使用量とピーク時のメモリ使用量 |
| `WaitForDependency` | すべて | 依存先の実行が完了するまで待機した時間 |

`CustomCounters` は各 Operator に固有の Counter です。各 Operator の CustomCounter の意味については、「Doris Operator Profile Overview」を参照してください。

### HashJoin の解釈 {#interpreting-hashjoin}

Doris の実行に関する基本概念を確認したところで、前述のクエリに戻り、MergedProfile から Join の実行詳細を読み解きます。

![Pipeline 内での HashJoin の実行詳細](/images/next/query-acceleration/profile-join.jpg)

SQL の実行前に、クエリの Pipeline 並列度を 2 に設定しました。そのため、図には接続された Pipeline 1 と Pipeline 2 の組しか示されていませんが、実際の実行では各 Pipeline に PipelineTask が 2 個ずつあり、合計 4 個の Pipeline Task があります。

```text
Pipeline 0(instance_num=2)
```

各 Pipeline の後に括弧で示される `instance_num` は、すべての BE にわたるその Pipeline の PipelineTask 総数です。ここで使用したクラスターには BE が 1 台しかないため、`instance_num = 1 * parallel_pipeline_task_num = 2` です。

**Build 側：HashTable の構築**

Pipeline 2 の PipelineTask は、合計 15M 行のデータを処理して HashTable を構築しました。HashTable 構築の平均実行時間は 445.146 ms です。Pipeline 1 は、Pipeline 2 による HashTable の構築が終わってからでないと実行できません。待機時間は `WaitForDependency` に示され、その `avg` は 949.860 ms です。しかし、HashTable の平均構築時間は 445.146 ms にすぎません。この差はどこから来るのでしょうか。

```text
HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
 CommonCounters:
    - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
    - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
    - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
 CustomCounters:
    - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00
```

理由は、この例では FE が JOIN の種類を `BROADCAST_JOIN` としてプランニングしたためです。この種類では、JOIN の Build 処理を担当する PipelineTask のうち、実際にハッシュテーブルを構築するのは片方だけです。`HASH_JOIN_SINK_OPERATOR` の MergedProfile から、次のことが分かります。

- 平均実行時間は 445.146 ms ですが、最も遅い PipelineTask は 890.258 ms、最も速いものは 34.635 us しかかかっていません。
- `InputRows` の `min` は 0 です。つまり、すべてのデータを片方の PipelineTask が処理し、もう片方は何もしていません。

これにより、次の行に示される待機時間を説明できます。

```text
- WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
```

**Probe 側：スキャンと結合**

次に `HASH_JOIN_OPERATOR` を見ます。平均 949.860 ms 待機した後、JOIN の Probe 側の処理を開始します。`id=2` の `OLAP_SCAN_OPERATOR` のインスタンスがストレージから 150M 行を読み取ります。この 150M 行を `HASH_JOIN_OPERATOR` が処理すると、そこには行が残りません。すべての行が `AGGREGATION_SINK_OPERATOR` に渡されます。この Operator はそれらの 150M 行についてハッシュテーブルを構築し、集約計算を続けます。

### Aggregation の解釈 {#interpreting-aggregation}

このクエリで行われる集約は、`Count(o.o_orderkey) AS total_orders, Sum(o.o_totalprice) AS total_spent` と `GROUP BY c.c_name` です。

![段階的な集約の実行詳細](/images/next/query-acceleration/profile-agg.jpg)

このクエリでは、Doris は段階的な Aggregation を使用します。

**第 1 段階の集約**

- `id=4` の AGGREGATION Operator の組で完了します。
- `AGGREGATION_SINK_OPERATOR(id=4)` の入力は合計 150M 行です。`GROUP BY` 列をキーとするハッシュテーブルを構築し、各集約結果の `AggregationData` を更新します。
- 第 1 段階の完了後、`AggregationData` を EXCHANGE 経由で第 2 段階に送ります。異なる PipelineTask が同じ GROUP BY 列の値を処理する可能性があるため、EXCHANGE 段階では `name` 列で HASH パーティショニングを行い、同じ name の行を同じ第 2 段階の Operator に送ります。
- `AGGREGATION_OPERATOR(id=4)` の出力は合計 40 行であり、第 1 段階で構築したハッシュテーブルに 40 行あることを示します。

**第 2 段階の集約**

- `AGGREGATION_SINK_OPERATOR(id=6)` は、第 1 段階の結果を再び `AggregationData` にデシリアライズし、Merge 処理を行います。
- `AGGREGATION_OPERATOR(id=6)` は結果を下流の TOP-N に送ります。クエリには `LIMIT 20` があるため、TOP-N Operator は 20 行を収集すると早期に処理を終了します。

**全体のボトルネック**

このクエリ全体で最も時間がかかっている処理は `HASH_JOIN_OPERATOR(id=3)` です。特定した後は、DetailProfile で `HASH_JOIN_OPERATOR(id=3)` のより詳細な Counter を確認できます。各 Counter の意味については、Operator ごとの専用ドキュメントを参照してください。

## トラブルシューティングと FAQ {#troubleshooting-and-faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common issues encountered when using Profile in daily work -->

### `show query profile` の結果が空になる場合 {#show-query-profile-returns-empty}

- `show variables like 'enable_profile';` を実行し、`enable_profile` が `true` か確認します。
- `auto_profile_threshold_ms` を確認します。大きな値が設定されている場合、短時間のクエリでは Profile が生成されません。
- 接続先の FE が、SQL を実行した FE と同じノードか確認します。データロードタスクの場合は FE Master に接続する必要があります。

### Profile の報告が頻繁にタイムアウトする場合 {#profile-reporting-times-out-frequently}

- 症状：FE のログに、Profile の非同期収集のタイムアウトが記録されます。
- 対処方法：

    1. マシンの CPU、メモリ、ネットワークの使用状況を確認します。
    2. `fe.conf` の `profile_async_collect_expire_time_secs` を増やします。
    3. 極端な場合は、グローバルな Profile を無効にし、遅いクエリの Profile のみを収集します（`auto_profile_threshold_ms` を設定します）。

### Profile が FE のメモリを使いすぎる場合 {#profile-takes-up-too-much-fe-memory}

- `max_query_profile_num` を減らし、メモリに保持する Profile の数を制限します。
- ディスクへの永続化を有効にして（デフォルトで有効）、過去の Profile をディスクに退避します。
- `auto_profile_threshold_ms` を使用し、短時間のクエリを除外します。

### 展開した Profile ファイルが消えた場合 {#the-extracted-profile-file-is-gone}

- 原因：FE には `log/profile` ディレクトリを保護するためのクリーンアップ機構があります。
- 対処方法：展開先を `log/profile` **以外のディレクトリ**にします。

### データの偏りがあるか確認する方法 {#how-to-confirm-whether-data-skew-exists}

- MergedProfile で、同じ Operator の `InputRows`／`RowsProduced` について、`min`、`avg`、`max` を比較します。
- `max` が `avg` より著しく大きい場合や、`min` が 0 で `max` が非常に大きい場合は、通常、データの偏りを示します。

## 用語集 {#glossary}

<!-- Knowledge type: Glossary -->
<!-- Applicable scenario: Term alignment -->

| 用語 | 一文での定義 |
| --- | --- |
| Query Profile | 単一のクエリの実行詳細を記録する診断用のデータ構造 |
| Fragment | 実行のために BE に割り当てられる、クエリプランの実行単位 |
| PlanNode | クエリプラン内の論理 Operator ノード |
| Pipeline | ブロックしない複数の Operator で構成される実行パイプライン |
| Operator | PlanNode から分割された、実行エンジン内の最小実行単位 |
| MergedProfile | 複数の BE と PipelineTask にわたって集約された Profile |
| DetailProfile | 各 BE 上の各 PipelineTask の詳細な Profile |
| `WaitForDependency` | Operator が依存先の処理完了を待つ時間。ボトルネックの特定によく使用される |
