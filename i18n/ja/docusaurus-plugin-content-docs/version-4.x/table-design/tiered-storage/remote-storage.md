---
{
    "title": "ローカル・リモート階層型ストレージ",
    "language": "ja",
    "description": "Apache Doris のリモートストレージは、コールドデータを S3 互換オブジェクトストレージまたは HDFS に自動的に移行し、ローカルストレージのコストを削減します。ホットデータとコールドデータを階層化する場合に適しています。",
    "keywords": [
        "Doris リモートストレージ",
        "ホット・コールド階層化",
        "コールドデータのアーカイブ",
        "S3 オブジェクトストレージ",
        "HDFS ストレージ",
        "ストレージポリシー",
        "cooldown_ttl"
    ]
}
---

<!-- Knowledge type: Feature overview + Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Hot-cold data tiering / Reducing storage costs / Historical data archiving -->


ローカル・リモート階層型ストレージは、Apache Doris が提供するホットデータとコールドデータの階層化機能です。コールドデータを外部ストレージシステム（S3 互換オブジェクトストレージや HDFS など）に自動的に移行し、ローカルディスクの使用量とストレージ全体のコストを削減します。

**適用シナリオ**:

- 履歴データのアーカイブ: アクセス頻度の低い履歴データを低コストのオブジェクトストレージに移行します。
- ホット・コールド階層化: ホットデータをローカルの SSD/HDD に保持し、コールドデータをリモートストレージに移します。
- ストレージコストの最適化: 高性能なローカルストレージの代わりにオブジェクトストレージを使用し、TCO を削減します。

:::warning 注意
リモートストレージ上のデータには**単一のレプリカしかありません**。データの信頼性は、リモートストレージ自体の信頼性保証に依存します。リモートストレージで EC（イレイジャーコーディング）または複数レプリカの仕組みが有効になっていることを確認してください。
:::

## クイックナビゲーション {#quick-navigation}

| セクション | 内容 |
| --- | --- |
| [コールドデータを S3 互換ストレージに保存する](#storing-cold-data-on-s3-compatible-storage) | コールドデータを S3 互換オブジェクトストレージに移します |
| [コールドデータを HDFS に保存する](#storing-cold-data-on-hdfs) | コールドデータを HDFS に移します |
| [既存のテーブルをリモートストレージにクールダウンする](#cooling-down-existing-tables-to-remote-storage) | 既存のテーブルまたはパーティションにリモートストレージを設定します |
| [Compaction を設定する](#configuring-compaction) | リモートストレージの Compaction の動作を調整します |
| [制限事項](#limitations) | リモートストレージの機能上の制限 |
| [コールドデータの容量管理](#cold-data-space-management) | コールドデータの使用量を確認し、不要なデータを回収します |
| [クエリとパフォーマンスの最適化](#query-and-performance-optimization) | ローカルキャッシュの仕組み |
| [FAQ](#faq) | エラーのトラブルシューティングと設定時の注意点 |

## 使用方法 {#usage}

<!-- Knowledge type: Operation steps -->

リモートストレージの利用手順は、**リソースの作成、ストレージポリシーの作成、テーブルの作成または変更時のポリシーの関連付け**という三つのステップです。

### コールドデータを S3 互換ストレージに保存する {#storing-cold-data-on-s3-compatible-storage}

<!-- Applicable scenarios: Use AWS S3, MinIO, Alibaba Cloud OSS, Tencent Cloud COS, or other object storage -->

#### ステップ 1: S3 リソースを作成する {#step-1-create-an-s3-resource}

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000"
);
```

:::tip
S3 リソースの作成時にはリモート接続のチェックが行われ、リソースの設定が正しいことを確認します。
:::

#### ステップ 2: ストレージポリシーを作成する {#step-2-create-a-storage-policy}

前のステップで作成したリソースを関連付けます。

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

#### ステップ 3: テーブル作成時にストレージポリシーを使用する {#step-3-use-the-storage-policy-when-creating-a-table}

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning 注意
`"enable_unique_key_merge_on_write" = "true"` の Unique テーブルではリモートストレージを使用できません。
:::

### コールドデータを HDFS に保存する {#storing-cold-data-on-hdfs}

<!-- Applicable scenarios: An existing Hadoop/HDFS cluster is used as the cold data storage pool -->

#### ステップ 1: HDFS リソースを作成する {#step-1-create-an-hdfs-resource}

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
    "type" = "hdfs",
    "fs.defaultFS" = "fs_host:default_fs_port",
    "hadoop.username" = "hive",
    "hadoop.password" = "hive",
    "root_path" = "/my/root/path",
    "dfs.nameservices" = "my_ha",
    "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
    "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
    "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
    "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

#### ステップ 2: ストレージポリシーを作成する {#step-2-create-a-storage-policy-1}

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
);
```

#### ステップ 3: ストレージポリシーを使用するテーブルを作成する {#step-3-create-a-table-that-uses-the-storage-policy}

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy (
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning 注意
`"enable_unique_key_merge_on_write" = "true"` の Unique テーブルではリモートストレージを使用できません。
:::

### 既存のテーブルをリモートストレージにクールダウンする {#cooling-down-existing-tables-to-remote-storage}

<!-- Applicable scenarios: Existing tables or partitions that need remote storage capability added -->

新しいテーブルの作成に加え、Doris では既存のテーブルまたはパーティション（PARTITION）にリモートストレージを設定することもできます。

**テーブル全体にリモートストレージを設定する**:

```sql
ALTER TABLE create_table_not_have_policy SET ("storage_policy" = "test_policy");
```

**特定のパーティションにリモートストレージを設定する**:

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy" = "test_policy");
```

:::tip テーブル単位とパーティション単位のポリシーの優先順位
テーブル作成時にテーブル全体と一部のパーティションへ**異なる**ストレージポリシーを割り当てた場合、パーティション単位のポリシーは無視され、すべてのパーティションでテーブル単位のポリシーが使用されます。

特定のパーティションに異なるポリシーを割り当てるには、上記の `ALTER TABLE ... MODIFY PARTITION` 文を使用します。

構文の詳細については、以下を参照してください。

- [CREATE RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)
- [CREATE STORAGE POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)
- [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)
- [ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)
:::

### Compaction を設定する {#configuring-compaction}

<!-- Knowledge type: Configuration parameters -->

リモートストレージの Compaction の動作は、BE パラメータで制御します。

| パラメータ | デフォルト値 | 単位 | 説明 |
| --- | --- | --- | --- |
| `cold_data_compaction_thread_num` | 2 | 個数 | リモートストレージの Compaction に使用する同時実行スレッド数 |
| `cold_data_compaction_interval_sec` | 1800 | 秒 | リモートストレージの Compaction の実行間隔（デフォルトは 30 分） |

## 制限事項 {#limitations}

<!-- Knowledge type: Functional limitations -->

リモートストレージには、次の制限があります。

- リモートストレージを使用するテーブルは**バックアップに対応していません**。
- リモートストレージの場所を示す情報（エンドポイント、バケット、パスなど）は**変更できません**。
- Merge-on-Write が有効な Unique モデルのテーブルは、リモートストレージに**対応していません**。
- ストレージポリシーは作成、変更、削除できます。**削除する前に、そのストレージポリシーを参照しているテーブルがないことを確認してください**。
- テーブルにストレージポリシーを設定すると、**解除できません**。

## コールドデータの容量管理 {#cold-data-space-management}

### コールドデータの使用量を確認する {#viewing-cold-data-usage}

コールドデータの容量使用量は、次の二通りの方法で確認できます。

| 方法 | コマンド | フィールド | 備考 |
| --- | --- | --- | --- |
| 方法 1 | `SHOW PROC '/backends'` | `RemoteUsedCapacity` | 各 BE がアップロードしたオブジェクトの合計サイズを確認します。表示には**多少の遅延**があります |
| 方法 2 | `SHOW TABLETS FROM tableName` | `RemoteDataSize` | 各 Tablet が占めるオブジェクトのサイズを確認します |

### ガベージコレクション {#garbage-collection}

リモートストレージで不要なデータが生成される場合は、次のとおりです。

1. Rowset のアップロードに失敗したものの、一部の Segment は正常にアップロードされた場合。
2. アップロードされた Rowset が複数のレプリカ間で一致しない場合。
3. Compaction が完了した後、Compaction に参加した古い Rowset が残る場合。

**回収ポリシー**: 不要なデータはすぐには削除されません。回収間隔は BE パラメータ `remove_unused_remote_files_interval_sec` で制御し、デフォルト値は `21600` 秒（6 時間）です。

## クエリとパフォーマンスの最適化 {#query-and-performance-optimization}

<!-- Knowledge type: Performance optimization -->

クエリのパフォーマンスを最適化し、オブジェクトストレージの API 呼び出しコストを抑えるため、Doris は**ローカルキャッシュ**の仕組みを備えています。リモートストレージ上のデータが初めてクエリされると、Doris はそのデータをキャッシュとして BE のローカルディスクに読み込みます。

**キャッシュの特性**:

- キャッシュは BE のローカルディスクに保存され、**メモリを消費しません**。
- キャッシュは LRU（Least Recently Used）方式で管理され、**TTL には対応していません**。

設定の詳細については、[Data Cache](../../lakehouse/data-cache) ドキュメントを参照してください。

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: S3 リソースの作成時に `host must not be null` と表示された場合はどうすればよいですか？ {#q1-what-should-i-do-if-creating-an-s3-resource-reports-host-must-not-be-null}

**エラーメッセージ**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository:
connect to s3 failed: Unable to marshall request to JSON: host must not be null.
```

**原因**: S3 SDK はデフォルトで仮想ホスト形式のアクセスを使用しますが、一部のオブジェクトストレージサービス（MinIO など）では、この形式が有効でないか、サポートされていません。

**解決方法**: リソースの設定に `"use_path_style" = "true"` を追加し、パス形式のアクセスを強制します。

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000",
    "use_path_style" = "true"
);
```

### Q2: `cooldown_ttl` などのクールダウンパラメータを変更すると、どのように動作しますか？ {#q2-how-does-modifying-cooldown-parameters-such-as-cooldown_ttl-behave}

クールダウン関連のパラメータを変更しても、変更が**適用されるのは、まだリモートストレージにクールダウンされていないデータだけ**です。すでにリモートストレージにあるデータには影響しません。

**例**: `cooldown_ttl` を 21 日から 7 日に変更しても、すでにリモートストレージにあるデータが**ローカルへ戻ることはありません**。

### Q3: リモートストレージに対応していないテーブルモデルはどれですか？ {#q3-which-table-models-do-not-support-remote-storage}

Merge-on-Write が有効（つまり `"enable_unique_key_merge_on_write" = "true"`）な Unique モデルのテーブルは、リモートストレージに対応していません。その他のモデル（Duplicate、Aggregate、および MoW が無効な Unique）はすべて対応しています。

### Q4: リモートストレージのデータの信頼性はどのように保証されますか？ {#q4-how-is-the-data-reliability-of-remote-storage-guaranteed}

Doris はリモートストレージ上に**単一のレプリカしか保持しない**ため、データの信頼性はリモートストレージ自体に全面的に依存します。データを保護するため、リモートストレージで **EC（イレイジャーコーディング）**や**複数レプリカ**などの仕組みを有効にすることを推奨します。
