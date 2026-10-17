---
{
    "title": "バックアップ",
    "language": "ja",
    "description": "Doris のバックアップ機能を使用して、データベース、テーブル、またはパーティションをスナップショットとして S3、Azure、GCP、OSS、MinIO、HDFS などのリモートストレージにバックアップします。このガイドでは、手順全体を説明します。",
    "keywords": [
        "Doris backup",
        "BACKUP SNAPSHOT",
        "CREATE REPOSITORY",
        "data backup",
        "full backup",
        "snapshot",
        "Repository",
        "S3 backup",
        "Azure backup",
        "HDFS backup",
        "OSS backup",
        "MinIO backup",
        "GCP backup",
        "partition backup",
        "database backup",
        "show backup",
        "cancel backup"
    ]
}
---

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Data backup / Disaster recovery setup / Cross-cluster migration -->

Doris には、データベース、テーブル、またはパーティションをスナップショットとしてリモートストレージシステムにバックアップし、必要に応じて[復元](./restore)する機能があります。このドキュメントは、定期的なバックアップ、災害復旧訓練、またはクラスタ間のデータ移行を行う DBA と運用エンジニアを対象としています。バックアップの主要な概念、前提条件、操作手順全体を説明します。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 説明 |
| --- | --- |
| 定期的なデータバックアップ | 誤削除やハードウェア障害によるデータ損失を防ぐため、データベース、テーブル、またはパーティションのフルバックアップを定期的に実行します。 |
| 災害復旧 | クラスタ全体に障害が発生した場合に復旧できるよう、バックアップを遠隔地のリモートストレージ（S3、HDFS など）に保存します。 |
| クラスタ間のデータ移行 | 移行元クラスタでバックアップし、移行先クラスタで復元して、クラスタ間でデータを移行します。 |
| テスト環境用のデータ準備 | 本番環境の一部のテーブルまたはパーティションをバックアップし、テスト用クラスタに復元します。 |
| 増分バックアップに近い運用 | 新規または変更されたパーティションのみをバックアップして、増分バックアップに近い運用を実現します（Doris は現時点でネイティブの増分バックアップをサポートしていません）。 |

## 前提条件 {#prerequisites}

バックアップ操作を行う前に、以下の条件を満たしていることを確認してください。

- **権限**: 操作に使用するアカウントに **ADMIN** 権限があること（バックアップと復元の両方に必要です）。
- **デプロイモード**: 現在のクラスタがコンピュート・ストレージ結合モードであること（**コンピュート・ストレージ分離モードでは**バックアップと復元は**サポートされません**）。
- **リモートストレージ**: 利用可能なリモートストレージシステム（S3、Azure、GCP、OSS、COS、MinIO、HDFS、またはその他の S3 互換オブジェクトストレージ）が用意され、対応するアクセス認証情報を取得済みであること。
- **ネットワーク接続**: FE ノードと BE ノードの両方からリモートストレージのエンドポイントにアクセスできること。
- **オブジェクトの制限**: バックアップ対象に、以下のサポート対象外のオブジェクトが含まれていないこと。
    - 非同期マテリアライズドビュー（MTMV）
    - [ストレージポリシー](../../../table-design/tiered-storage/remote-storage)を使用するテーブル

## 主要な概念 {#key-concepts}

| 概念 | 定義 |
| --- | --- |
| スナップショット | データベース、テーブル、またはパーティションの、ある時点のデータを取得したものです。スナップショットを作成するときは Label を指定する必要があり、完了時にタイムスタンプが生成されます。スナップショットは Repository、スナップショットの Label、タイムスタンプの組み合わせで一意に識別されます。 |
| Repository | バックアップファイルを保存するリモートの場所です。S3、Azure、GCP、OSS、COS、MinIO、HDFS、およびその他の S3 互換オブジェクトストレージをサポートします。 |
| バックアップ操作 | データベース、テーブル、またはパーティションのスナップショットを作成し、そのファイルをリモートの Repository にアップロードして、バックアップに関するメタデータを保存します。 |
| 復元操作 | リモートの Repository からスナップショットをダウンロードし、Doris クラスタに復元します。 |

## 利用上の制限 {#usage-limitations}

| 制限 | 説明 |
| --- | --- |
| コンピュート・ストレージ分離モードはサポート対象外 | ストレージとコンピュートが分離されたデプロイモードでは、バックアップと復元の機能を利用できません。 |
| 非同期マテリアライズドビュー（MTMV）はサポート対象外 | バックアップと復元の操作には、非同期マテリアライズドビューは含まれません。 |
| ストレージポリシーを設定したテーブルはサポート対象外 | [ストレージポリシー](../../../table-design/tiered-storage/remote-storage)を使用するテーブルでは、バックアップと復元の操作はサポートされません。 |
| フルバックアップのみをサポート | Doris が現在サポートしているのはフルバックアップのみです。前回のバックアップ以降に変更されたデータだけを保存する増分バックアップは、まだサポートされていません。特定のパーティションをバックアップすることで、増分バックアップに近い運用ができます。 |
| `colocate_with` プロパティは保持されない | バックアップまたは復元の操作中、Doris はテーブルの `colocate_with` プロパティを保持しません。復元後に colocate テーブルの再設定が必要になる場合があります。 |
| 動的パーティショニングの再有効化が必要 | テーブルの復元後、`ALTER TABLE` コマンドを使用して動的パーティショニングのプロパティを手動で有効にする必要があります。 |
| 同時実行数の制限 | 同一データベース内で同時に実行できるバックアップまたは復元タスクは、1 つだけです。 |

## バックアップ手順の概要 {#backup-workflow-overview}

バックアップの手順全体は、以下の 5 ステップで構成されます。

1. **Repository を作成する**: Doris にリモートストレージの場所を登録します。
2. **バックアップを実行する**: `BACKUP SNAPSHOT` でバックアップタスクを開始します。
3. **バックアップの進行状況を確認する**: `SHOW BACKUP` でタスクの実行状態を確認します。
4. **Repository 内の既存のスナップショットを確認する**: `SHOW SNAPSHOT` で利用可能なバックアップを一覧表示します。
5. **（必要に応じて）バックアップをキャンセルする**: 異常が発生した場合は `CANCEL BACKUP` でタスクを終了します。

以降のセクションでは、この順序で各ステップを説明します。

## ステップ 1: Repository を作成する {#step-1-create-a-repository}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Remote storage integration / Backup preparation -->

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

使用するリモートストレージの種類に応じて、Repository の作成文を選択してください。詳しい使い方は [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY) を参照してください。

:::tip
異なるクラスタで同じパスの Repository をバックアップに使用する場合は、パスの競合やデータ破損を避けるため、それぞれ異なる Label を使用してください。
:::

リモートストレージの種類ごとの Repository の作成方法は以下のとおりです。

| 方法 | リモートストレージ | 備考 |
| --- | --- | --- |
| 方法 1 | S3 | AWS S3 または S3 互換オブジェクトストレージ |
| 方法 2 | Azure Blob Storage | Doris 3.1.3 以降でサポート |
| 方法 3 | GCP（Google Cloud Storage） | ダミーの `s3.region` を指定する必要があります |
| 方法 4 | OSS（Alibaba Cloud Object Storage） | なし |
| 方法 5 | MinIO | Virtual Host 形式が有効でない場合は `use_path_style=true` が必要です |
| 方法 6 | HDFS | なし |

### 方法 1: S3 に Repository を作成する {#method-1-create-a-repository-on-s3}

AWS S3 に Repository を作成します。

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://bucket_name/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

注意事項:

- `bucket_name` を S3 バケットの名前に置き換えてください。
- S3 の設定に合わせて、適切な `endpoint`、`access key`、`secret key`、`region` を指定してください。

### 方法 2: Azure に Repository を作成する {#method-2-create-a-repository-on-azure}

**Doris 3.1.3 以降でサポートされます。**

Azure Blob Storage に Repository を作成します。

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://<container_name>/azure_repo"
PROPERTIES
(
    "azure.endpoint" = "https://<account_name>.blob.core.windows.net",
    "azure.account_name" = "<account_name>",
    "azure.account_key" = "<account_key>",
    "provider" = "AZURE"
);
```

注意事項:

- `<container_name>` を Azure コンテナーの名前に置き換えてください。
- 認証用の Azure ストレージアカウントとキーを指定してください。
- `provider` には `AZURE` を指定する必要があります。

### 方法 3: GCP に Repository を作成する {#method-3-create-a-repository-on-gcp}

Google Cloud Platform（GCP）のストレージに Repository を作成します。

```sql
CREATE REPOSITORY `gcp_repo`
WITH S3
ON LOCATION "s3://bucket_name/backup/gcp_repo"
PROPERTIES
(
    "s3.endpoint" = "storage.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

注意事項:

- `bucket_name` を GCP バケットの名前に置き換えてください。
- GCP の `endpoint`、`access key`、`secret key` を指定してください。
- `s3.region` はダミーのリージョンです。任意の値を使用できますが、指定は必須です。

### 方法 4: OSS（Alibaba Cloud Object Storage Service）に Repository を作成する {#method-4-create-a-repository-on-oss-alibaba-cloud-object-storage-service}

OSS に Repository を作成します。

```sql
CREATE REPOSITORY `oss_repo`
WITH S3
ON LOCATION "s3://bucket_name/oss_repo"
PROPERTIES
(
    "s3.endpoint" = "oss.aliyuncs.com",
    "s3.region" = "cn-hangzhou",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

注意事項:

- `bucket_name` を OSS バケットの名前に置き換えてください。
- OSS の `endpoint`、`region`、`access key`、`secret key` を指定してください。

### 方法 5: MinIO に Repository を作成する {#method-5-create-a-repository-on-minio}

MinIO ストレージに Repository を作成します。

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://bucket_name/minio_repo"
PROPERTIES
(
    "s3.endpoint" = "yourminio.com",
    "s3.region" = "dummy-region",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "use_path_style" = "true"
);
```

注意事項:

- `bucket_name` を MinIO バケットの名前に置き換えてください。
- MinIO の `endpoint`、`access key`、`secret key` を指定してください。
- `s3.region` はダミーのリージョンです。任意の値を使用できますが、指定は必須です。
- Virtual Host 形式が有効でない場合、`use_path_style` を `true` に設定する必要があります。

### 方法 6: HDFS に Repository を作成する {#method-6-create-a-repository-on-hdfs}

HDFS に Repository を作成します。

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://127.0.0.1:9000/prefix_path/hdfs_repo"
PROPERTIES
(
    "fs.defaultFS" = "hdfs://127.0.0.1:9000",
    "hadoop.username" = "doris-test"
)
```

注意事項:

- `prefix_path` を実際のパスに置き換えてください。
- HDFS の `endpoint` とユーザー名を指定してください。

## ステップ 2: バックアップを実行する {#step-2-perform-the-backup}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Database/table/partition backup -->

`BACKUP SNAPSHOT` でバックアップタスクを開始します。詳しい使い方は [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP) を参照してください。

:::tip
後で識別・管理しやすいように、バックアップに含まれるデータベースやテーブルが分かる、意味のある Label 名を使用することをお勧めします。
:::

バックアップ対象に応じて、以下の形式を選択できます。

| 方法 | バックアップ対象 | 適用シナリオ |
| --- | --- | --- |
| 方法 1 | 現在のデータベース | 現在 `USE` しているデータベース全体をバックアップする |
| 方法 2 | 指定したデータベース | データベース名を明示して、そのデータベース全体をバックアップする |
| 方法 3 | 指定したテーブル | 特定のテーブルのみをバックアップする |
| 方法 4 | 指定したパーティション | テーブルの特定のパーティションをバックアップする。テーブル全体のバックアップと組み合わせることもできます |
| 方法 5 | 特定のテーブルを除外 | 指定したテーブルを除き、データベース全体をバックアップする |

### 方法 1: 現在のデータベースをバックアップする {#method-1-back-up-the-current-database}

以下の SQL 文は、現在のデータベースを `example_repo` という Repository に、スナップショットの Label `exampledb_20241225` を使用してバックアップします。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### 方法 2: 指定したデータベースをバックアップする {#method-2-back-up-a-specified-database}

以下の SQL 文は、`destdb` というデータベースを `example_repo` という Repository に、スナップショットの Label `destdb_20241225` を使用してバックアップします。

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### 方法 3: 指定したテーブルをバックアップする {#method-3-back-up-specified-tables}

以下の SQL 文は、2 つのテーブルを `example_repo` という Repository に、スナップショットの Label `exampledb_tbl_tbl1_20241225` を使用してバックアップします。

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### 方法 4: 指定したパーティションをバックアップする {#method-4-back-up-specified-partitions}

以下の SQL 文は、`example_tbl2` というテーブルと、`example_tbl` というテーブルのパーティション `p1` および `p2` を `example_repo` という Repository に、スナップショットの Label `example_tbl_p1_p2_tbl1_20241225` を使用してバックアップします。

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### 方法 5: 特定のテーブルを除外して現在のデータベースをバックアップする {#method-5-back-up-the-current-database-excluding-certain-tables}

以下の SQL 文は、`example_tbl` および `example_tbl1` という 2 つのテーブルを除外し、現在のデータベースを `example_repo` という Repository に、スナップショットの Label `exampledb_20241225` を使用してバックアップします。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## ステップ 3: 最近のバックアップジョブの実行状態を確認する {#step-3-view-the-execution-status-of-recent-backup-jobs}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup progress tracking / Troubleshooting -->

以下の SQL を使用して、最近のバックアップジョブの実行状態を確認します。

```sql
mysql> show BACKUP\G;
*************************** 1. row ***************************
                  JobId: 17891847
           SnapshotName: exampledb_20241225
                 DbName: example_db
                  State: FINISHED
             BackupObjs: [example_db.example_tbl]
             CreateTime: 2022-04-08 15:52:29
   SnapshotFinishedTime: 2022-04-08 15:52:32
     UploadFinishedTime: 2022-04-08 15:52:38
           FinishedTime: 2022-04-08 15:52:44
        UnfinishedTasks:
               Progress:
             TaskErrMsg:
                 Status: [OK]
                Timeout: 86400
   1 row in set (0.01 sec)
```

主要なフィールドの説明:

| フィールド | 意味 |
| --- | --- |
| `JobId` | バックアップタスクの ID。 |
| `SnapshotName` | `BACKUP SNAPSHOT` で指定した名前に対応する、スナップショットの Label。 |
| `DbName` | バックアップ対象のデータベース。 |
| `State` | タスクの状態。たとえば、`FINISHED` は完了を示します。 |
| `BackupObjs` | 実際にバックアップされたオブジェクトの一覧。 |
| `CreateTime` / `SnapshotFinishedTime` / `UploadFinishedTime` / `FinishedTime` | タスクの作成、スナップショットの完了、アップロードの完了、タスク全体の完了を示すタイムスタンプ。 |
| `Status` | タスクの結果を示す状態。`[OK]` は成功を示し、それ以外の場合はエラー情報が含まれます。 |
| `Timeout` | タスクのタイムアウト（秒）。 |

## ステップ 4: Repository 内の既存のバックアップを確認する {#step-4-view-existing-backups-in-the-repository}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup inventory / Pre-restore verification -->

以下の SQL を使用して、`example_repo` という Repository 内の既存のバックアップを確認します。`Snapshot` 列はスナップショットの Label、`Timestamp` はタイムスタンプです。

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

[復元](./restore)操作を行う際は、`Snapshot` と `Timestamp` を組み合わせて、バックアップのバージョンを一意に識別する必要があります。

## ステップ 5: バックアップをキャンセルする（必要な場合） {#step-5-cancel-a-backup-if-needed}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Abnormal termination / Rolling back accidental operations -->

バックアップタスクで異常が発生した場合や中止が必要な場合は、以下の SQL を使用して、データベース内で実行中のバックアップタスクをキャンセルします。

```sql
CANCEL BACKUP FROM db_name;
```

詳しい使い方は [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP) を参照してください。

## よくある質問 {#faq}

### Q: Repository の作成に失敗した場合はどうすればよいですか？ {#q-what-should-i-do-if-creating-a-repository-fails}

通常は、リモートストレージの認証情報が正しくない、Endpoint に接続できない、または Bucket やコンテナーが存在しないことが原因です。`endpoint`、`access key`、`secret key`、Bucket 名が正しいか確認し、FE/BE ノードからリモートストレージにアクセスできることを確認してください。

### Q: MinIO へのバックアップに失敗した場合はどうすればよいですか？ {#q-what-should-i-do-if-backups-to-minio-fail}

通常は、Virtual Host 形式が有効でないにもかかわらず、`use_path_style` パラメーターが指定されていない場合に発生します。`PROPERTIES` に `"use_path_style" = "true"` を追加してください。

### Q: GCP/MinIO でリージョンが指定されていないというエラーが出た場合はどうすればよいですか？ {#q-what-should-i-do-if-gcpminio-reports-a-missing-region-error}

`s3.region` には、`dummy-region` のような仮の値でも指定する必要があります。

### Q: Azure の Repository の作成に失敗した場合はどうすればよいですか？ {#q-what-should-i-do-if-creating-an-azure-repository-fails}

Doris 3.1.3 より前のバージョンは Azure Blob Storage をサポートしていません。Doris 3.1.3 以降にアップグレードし、`provider = AZURE` が指定されていることを確認してください。

### Q: 同じデータベース内でバックアップと復元の競合が報告された場合はどうすればよいですか？ {#q-what-should-i-do-if-a-backuprestore-conflict-is-reported-within-the-same-database}

同一データベース内で同時に実行できるバックアップまたは復元タスクは、1 つだけです。既存のタスクが完了するまで待つか、`CANCEL BACKUP FROM db_name;` でキャンセルしてから新しいタスクを開始してください。

### Q: コンピュート・ストレージ分離モードのクラスタでバックアップできない場合はどうすればよいですか？ {#q-what-should-i-do-if-a-compute-storage-decoupled-cluster-cannot-perform-backups}

コンピュート・ストレージ分離モードでは、バックアップと復元はサポートされていません。コンピュート・ストレージ結合モードに切り替えるか、別のデータエクスポート方法を使用してください。

### Q: マテリアライズドビューがバックアップされなかったのはなぜですか？ {#q-why-was-the-materialized-view-not-backed-up}

非同期マテリアライズドビュー（MTMV）はバックアップ対象に含まれません。復元後、移行先クラスタで該当するマテリアライズドビューを再作成する必要があります。

### Q: 異なるクラスタが同じパスにバックアップしてデータが破損した場合、どうすれば解決できますか？ {#q-how-do-i-resolve-data-corruption-when-different-clusters-back-up-to-the-same-path}

同じスナップショットの Label を使用したことで、パスが競合したことが原因です。異なるクラスタから同じ Repository パスにバックアップする場合は、異なる Label を使用してください。

### Q: 復元後に動的パーティショニングが機能しないのはなぜですか？ {#q-why-is-dynamic-partitioning-not-effective-after-restoration}

バックアップと復元では、動的パーティショニングは自動的に有効になりません。復元後、`ALTER TABLE` を使用して動的パーティショニングのプロパティを手動で有効にしてください。

### Q: 復元後に colocate テーブルの動作が異常になった場合はどうすればよいですか？ {#q-what-should-i-do-if-colocate-tables-behave-abnormally-after-restoration}

バックアップと復元では `colocate_with` プロパティが保持されません。復元後、colocate テーブルの `colocate_with` プロパティを再設定してください。

## 関連ドキュメント {#related-documents}

- [復元](./restore)
- [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)
- [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)
- [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)
- [SHOW SNAPSHOT](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT)
- [SHOW REPOSITORIES](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES)
- [ストレージポリシー](../../../table-design/tiered-storage/remote-storage)
