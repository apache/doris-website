---
{
    "title": "バックアップ",
    "language": "ja",
    "description": "Doris のバックアップ機能を使用して、データベース、テーブル、パーティションをスナップショットとして S3、Azure、GCP、OSS、MinIO、HDFS などのリモートストレージにバックアップする手順を説明します。",
    "keywords": [
        "Doris バックアップ",
        "BACKUP SNAPSHOT",
        "CREATE REPOSITORY",
        "データバックアップ",
        "フルバックアップ",
        "スナップショット",
        "リポジトリ",
        "S3 バックアップ",
        "Azure バックアップ",
        "HDFS バックアップ",
        "OSS バックアップ",
        "MinIO バックアップ",
        "GCP バックアップ",
        "パーティションのバックアップ",
        "データベースのバックアップ",
        "バックアップの確認",
        "バックアップのキャンセル"
    ]
}
---

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Data backup / Disaster recovery setup / Cross-cluster migration -->

Doris では、データベース、テーブル、パーティションをスナップショットとしてリモートストレージにバックアップし、必要に応じて[復元](./restore)できます。このドキュメントは、定期的なバックアップ、ディザスタリカバリの訓練、クラスター間のデータ移行を行う DBA と運用担当者を対象としています。バックアップの主要な概念、前提条件、操作手順を説明します。

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| 定期的なデータバックアップ | データベース、テーブル、パーティションのフルバックアップを定期的に実行し、誤削除やハードウェア障害によるデータ損失を防ぎます。 |
| ディザスタリカバリ | クラスター全体に障害が発生した場合の復旧に備え、バックアップをオフサイトのリモートストレージ（S3、HDFS など）に保存します。 |
| クラスター間のデータ移行 | 移行元クラスターでバックアップし、移行先クラスターで復元して、クラスター間でデータを移行します。 |
| テスト環境用データの準備 | 本番環境の一部のテーブルまたはパーティションをバックアップし、テスト用クラスターに復元します。 |
| 増分バックアップに近い運用 | 新規または変更されたパーティションだけをバックアップし、増分バックアップに近い運用を行います（Doris は現時点でネイティブの増分バックアップをサポートしていません）。 |

## 前提条件

バックアップを実行する前に、次の条件を満たしていることを確認してください。

- **権限**: 操作に使用するアカウントに **ADMIN** 権限があること（バックアップと復元の両方で必要です）。
- **デプロイモード**: 現在のクラスターがストレージとコンピュートを一体化したモードであること（**分離したモードでは**バックアップと復元を**サポートしていません**）。
- **リモートストレージ**: 利用可能なリモートストレージ（S3、Azure、GCP、OSS、COS、MinIO、HDFS、その他の S3 互換オブジェクトストレージ）が用意されており、対応するアクセス認証情報を取得済みであること。
- **ネットワーク接続**: FE ノードと BE ノードの両方からリモートストレージのエンドポイントにアクセスできること。
- **オブジェクトの制限**: バックアップ対象に次のサポート対象外のオブジェクトが含まれていないこと。
    - 非同期マテリアライズドビュー（MTMV）
    - [ストレージポリシー](../../../table-design/tiered-storage/remote-storage)を使用するテーブル

## 主要な概念

| 概念 | 定義 |
| --- | --- |
| スナップショット | データベース、テーブル、パーティションのある時点のデータを取得したものです。作成時にはスナップショットの Label を指定する必要があり、完了時にタイムスタンプが生成されます。リポジトリ、スナップショットの Label、タイムスタンプの組み合わせで一意に識別されます。 |
| リポジトリ | バックアップファイルを保存するリモートの場所です。S3、Azure、GCP、OSS、COS、MinIO、HDFS、その他の S3 互換オブジェクトストレージをサポートします。 |
| バックアップ操作 | データベース、テーブル、パーティションのスナップショットを作成し、そのファイルをリモートリポジトリにアップロードして、バックアップに関するメタデータを保存します。 |
| 復元操作 | リモートリポジトリからスナップショットをダウンロードし、Doris クラスターに復元します。 |

## 使用上の制限

| 制限 | 説明 |
| --- | --- |
| ストレージとコンピュートを分離したモードはサポート対象外 | ストレージとコンピュートを分離したデプロイモードでは、バックアップと復元の機能を使用できません。 |
| 非同期マテリアライズドビュー（MTMV）はサポート対象外 | バックアップと復元の対象に非同期マテリアライズドビューは含まれません。 |
| ストレージポリシーを設定したテーブルはサポート対象外 | [ストレージポリシー](../../../table-design/tiered-storage/remote-storage)を使用するテーブルでは、バックアップと復元を実行できません。 |
| フルバックアップのみサポート | Doris が現時点でサポートするのはフルバックアップのみです。前回のバックアップ以降の変更データだけを保存する増分バックアップは、まだサポートしていません。特定のパーティションをバックアップすることで、増分バックアップに近い運用ができます。 |
| `colocate_with` プロパティは保持されない | バックアップまたは復元の際、Doris はテーブルの `colocate_with` プロパティを保持しません。復元後に Colocate テーブルを再設定する必要がある場合があります。 |
| 動的パーティションを再度有効にする必要がある | テーブルの復元後、`ALTER TABLE` コマンドを使用して動的パーティションのプロパティを手動で有効にする必要があります。 |
| 同時実行数の制限 | 同じデータベース内で同時に実行できるバックアップまたは復元タスクは一つだけです。 |

## バックアップ手順の概要

バックアップの一連の手順は、次の 5 ステップです。

1. **リポジトリを作成する**: Doris にリモートストレージの場所を登録します。
2. **バックアップを実行する**: `BACKUP SNAPSHOT` でバックアップタスクを開始します。
3. **バックアップの進行状況を確認する**: `SHOW BACKUP` でタスクの実行状態を確認します。
4. **リポジトリ内の既存のスナップショットを確認する**: `SHOW SNAPSHOT` で利用可能なバックアップを一覧表示します。
5. **（必要な場合）バックアップをキャンセルする**: 異常が発生した場合は `CANCEL BACKUP` でタスクを終了します。

以下では、この順に各ステップを説明します。

## ステップ 1: リポジトリを作成する

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Remote storage integration / Backup preparation -->

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

使用するリモートストレージの種類に応じて、リポジトリの作成文を選択してください。詳しい使い方は、[CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY) を参照してください。

:::tip
異なるクラスターから同じパスのリポジトリを使用してバックアップする場合は、パスの競合やデータ破損を避けるため、それぞれ異なる Label を使用してください。
:::

リモートストレージの種類ごとの作成方法は次のとおりです。

| 方法 | リモートストレージ | 備考 |
| --- | --- | --- |
| 方法 1 | S3 | AWS S3 または S3 互換オブジェクトストレージ |
| 方法 2 | Azure Blob Storage | Doris 3.1.3 以降でサポート |
| 方法 3 | GCP（Google Cloud Storage） | ダミーの `s3.region` の指定が必要 |
| 方法 4 | OSS（Alibaba Cloud Object Storage） | なし |
| 方法 5 | MinIO | Virtual Host 形式が有効でない場合は `use_path_style=true` が必要 |
| 方法 6 | HDFS | なし |

### 方法 1: S3 にリポジトリを作成する

AWS S3 にリポジトリを作成します。

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

補足:

- `bucket_name` を S3 バケットの名前に置き換えてください。
- S3 の設定に合わせて、`endpoint`、`access key`、`secret key`、`region` を指定してください。

### 方法 2: Azure にリポジトリを作成する

**Doris 3.1.3 以降でサポートされています。**

Azure Blob Storage にリポジトリを作成します。

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

補足:

- `<container_name>` を Azure コンテナーの名前に置き換えてください。
- 認証に使用する Azure ストレージアカウントとキーを指定してください。
- `provider` には `AZURE` を指定する必要があります。

### 方法 3: GCP にリポジトリを作成する

Google Cloud Platform（GCP）のストレージにリポジトリを作成します。

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

補足:

- `bucket_name` を GCP のバケット名に置き換えてください。
- GCP の `endpoint`、`access key`、`secret key` を指定してください。
- `s3.region` はダミーのリージョンです。任意の値を指定できますが、省略はできません。

### 方法 4: OSS（Alibaba Cloud Object Storage Service）にリポジトリを作成する

OSS にリポジトリを作成します。

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

補足:

- `bucket_name` を OSS のバケット名に置き換えてください。
- OSS の `endpoint`、`region`、`access key`、`secret key` を指定してください。

### 方法 5: MinIO にリポジトリを作成する

MinIO ストレージにリポジトリを作成します。

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

補足:

- `bucket_name` を MinIO のバケット名に置き換えてください。
- MinIO の `endpoint`、`access key`、`secret key` を指定してください。
- `s3.region` はダミーのリージョンです。任意の値を指定できますが、省略はできません。
- Virtual Host 形式が有効でない場合は、`use_path_style` を `true` に設定する必要があります。

### 方法 6: HDFS にリポジトリを作成する

HDFS にリポジトリを作成します。

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "/prefix_path/hdfs_repo"
PROPERTIES
(
    "fs.defaultFS" = "hdfs://127.0.0.1:9000",
    "hadoop.username" = "doris-test"
)
```

補足:

- `prefix_path` を実際のパスに置き換えてください。
- HDFS の `endpoint` とユーザー名を指定してください。

## ステップ 2: バックアップを実行する

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Database/table/partition backup -->

`BACKUP SNAPSHOT` でバックアップタスクを開始します。詳しい使い方は、[BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP) を参照してください。

:::tip
後で識別・管理しやすいように、バックアップに含まれるデータベースやテーブルが分かる Label 名を使用することをお勧めします。
:::

バックアップ対象に応じて、次の形式を選択できます。

| 方法 | バックアップ対象 | 適用シナリオ |
| --- | --- | --- |
| 方法 1 | 現在のデータベース | 現在 `USE` で選択しているデータベース全体をバックアップする |
| 方法 2 | 指定したデータベース | データベース名を明示して、データベース全体をバックアップする |
| 方法 3 | 指定したテーブル | 一部のテーブルだけをバックアップする |
| 方法 4 | 指定したパーティション | テーブルの特定のパーティションをバックアップする。テーブル全体のバックアップと組み合わせることもできる |
| 方法 5 | 一部のテーブルを除外 | 指定したテーブルを除いて、データベース全体をバックアップする |

### 方法 1: 現在のデータベースをバックアップする

次の SQL 文は、現在のデータベースを `example_repo` という名前のリポジトリに、スナップショットの Label `exampledb_20241225` でバックアップします。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### 方法 2: 指定したデータベースをバックアップする

次の SQL 文は、`destdb` という名前のデータベースを `example_repo` という名前のリポジトリに、スナップショットの Label `destdb_20241225` でバックアップします。

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### 方法 3: 指定したテーブルをバックアップする

次の SQL 文は、二つのテーブルを `example_repo` という名前のリポジトリに、スナップショットの Label `exampledb_tbl_tbl1_20241225` でバックアップします。

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### 方法 4: 指定したパーティションをバックアップする

次の SQL 文は、`example_tbl2` という名前のテーブル全体と、パーティション `p1` および `p2`（`example_tbl` テーブルのパーティション）を `example_repo` という名前のリポジトリに、スナップショットの Label `example_tbl_p1_p2_tbl1_20241225` でバックアップします。

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### 方法 5: 一部のテーブルを除外して現在のデータベースをバックアップする

次の SQL 文は、現在のデータベースを `example_repo` という名前のリポジトリに、スナップショットの Label `exampledb_20241225` でバックアップします。この際、`example_tbl` と `example_tbl1` という名前の二つのテーブルは除外します。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## ステップ 3: 最近のバックアップジョブの実行状態を確認する

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup progress tracking / Troubleshooting -->

次の SQL を使用して、最近のバックアップジョブの実行状態を確認します。

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

主なフィールドの説明:

| フィールド | 意味 |
| --- | --- |
| `JobId` | バックアップタスクの ID です。 |
| `SnapshotName` | `BACKUP SNAPSHOT` で指定した名前に対応する、スナップショットの Label です。 |
| `DbName` | バックアップが属するデータベースです。 |
| `State` | タスクの状態です。たとえば、`FINISHED` は完了を示します。 |
| `BackupObjs` | 実際にバックアップされたオブジェクトの一覧です。 |
| `CreateTime` / `SnapshotFinishedTime` / `UploadFinishedTime` / `FinishedTime` | タスクの作成、スナップショットの作成完了、アップロード完了、全体の完了を示すタイムスタンプです。 |
| `Status` | タスクの結果です。`[OK]` は成功を示し、それ以外の場合はエラー情報が含まれます。 |
| `Timeout` | タスクのタイムアウト時間（秒）です。 |

## ステップ 4: リポジトリ内の既存のバックアップを確認する

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup inventory / Pre-restore verification -->

次の SQL を使用して、`example_repo` という名前のリポジトリ内にあるバックアップを確認します。`Snapshot` 列はスナップショットの Label、`Timestamp` 列はタイムスタンプです。

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

[復元](./restore)操作では、`Snapshot` と `Timestamp` を組み合わせて、バックアップのバージョンを一意に識別する必要があります。

## ステップ 5: バックアップをキャンセルする（必要な場合）

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Abnormal termination / Rolling back accidental operations -->

バックアップタスクで異常が発生した場合や中止する必要がある場合は、次の SQL を使用して、データベース内で実行中のバックアップタスクをキャンセルします。

```sql
CANCEL BACKUP FROM db_name;
```

詳しい使い方は、[CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP) を参照してください。

## よくある質問

### Q: リポジトリの作成に失敗した場合はどうすればよいですか？

通常は、リモートストレージの認証情報が正しくない、エンドポイントに接続できない、またはバケットやコンテナーが存在しないことが原因です。`endpoint`、`access key`、`secret key`、バケット名が正しいか確認し、FE/BE ノードからリモートストレージにアクセスできることを確認してください。

### Q: MinIO へのバックアップに失敗した場合はどうすればよいですか？

通常は、Virtual Host 形式が有効でないのに `use_path_style` パラメーターが指定されていない場合に発生します。`"use_path_style" = "true"` を `PROPERTIES` に追加してください。

### Q: GCP または MinIO でリージョンの指定がないというエラーが出た場合はどうすればよいですか？

`s3.region` は、`dummy-region` のようなダミーの値でも指定する必要があります。

### Q: Azure のリポジトリの作成に失敗した場合はどうすればよいですか？

Doris 3.1.3 より前のバージョンは Azure Blob Storage をサポートしていません。Doris 3.1.3 以降にアップグレードし、`provider = AZURE` を指定していることを確認してください。

### Q: 同じデータベース内でバックアップと復元が競合すると報告された場合はどうすればよいですか？

同じデータベース内で同時に実行できるバックアップまたは復元タスクは一つだけです。既存のタスクが完了するのを待つか、`CANCEL BACKUP FROM db_name;` でキャンセルしてから新しいタスクを開始してください。

### Q: ストレージとコンピュートを分離したクラスターでバックアップできない場合はどうすればよいですか？

ストレージとコンピュートを分離したモードでは、バックアップと復元をサポートしていません。ストレージとコンピュートを一体化したモードに切り替えるか、別の方法でデータをエクスポートしてください。

### Q: マテリアライズドビューがバックアップされなかったのはなぜですか？

非同期マテリアライズドビュー（MTMV）はバックアップの対象に含まれません。復元後、移行先クラスターで対応するマテリアライズドビューを再作成する必要があります。

### Q: 異なるクラスターから同じパスにバックアップした際のデータ破損には、どう対処すればよいですか？

同じスナップショットの Label を使用するとパスが競合し、データ破損が発生します。異なるクラスターから同じリポジトリのパスにバックアップする場合は、それぞれ異なる Label を使用してください。

### Q: 復元後に動的パーティションが機能しないのはなぜですか？

バックアップと復元では、動的パーティションは自動的に有効になりません。復元後、`ALTER TABLE` を使用して動的パーティションのプロパティを手動で有効にしてください。

### Q: 復元後に Colocate テーブルの動作が異常な場合はどうすればよいですか？

バックアップと復元では、`colocate_with` プロパティは保持されません。復元後、Colocate テーブルの `colocate_with` プロパティを再設定してください。

## 関連ドキュメント

- [復元](./restore)
- [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)
- [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)
- [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)
- [SHOW SNAPSHOT](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT)
- [SHOW REPOSITORIES](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES)
- [ストレージポリシー](../../../table-design/tiered-storage/remote-storage)
