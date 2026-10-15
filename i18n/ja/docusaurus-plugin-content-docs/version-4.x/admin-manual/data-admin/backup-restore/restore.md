---
{
    "title": "復元",
    "language": "ja",
    "description": "Repository 内のバックアップスナップショットから Doris のデータベース、テーブル、パーティションを復元する方法を説明します。スナップショットの確認、用途に応じた RESTORE の実行、復元ジョブの進捗確認までの手順を示します。",
    "keywords": [
        "Doris の復元",
        "RESTORE SNAPSHOT",
        "データ復旧",
        "バックアップと復元",
        "SHOW SNAPSHOT",
        "SHOW RESTORE",
        "backup_timestamp",
        "データベース間の復元",
        "パーティションの復元",
        "テーブル名を変更して復元"
    ]
}
---

このガイドでは、Doris の `RESTORE` 文を使い、既存の Repository にあるバックアップスナップショットからデータベース、テーブル、またはパーティションを復元する方法と、復元ジョブの進捗を確認する方法を説明します。データのロールバック、新しいクラスターへの移行、データベース間の複製、テーブルまたはパーティション単位でのデータ修復などに利用できます。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Data restore / Cross-database migration / Partition-level rollback -->

## 適用シナリオ

| シナリオ | 推奨する方法 | 説明 |
|---|---|---|
| スナップショット全体を現在のデータベースに復元する | [スナップショットを現在のデータベースに復元する](#option-1-restore-a-snapshot-to-the-current-database) | 最も一般的な方法です。スナップショット内のすべてのオブジェクトを、`USE` で選択した現在のデータベースに復元します。 |
| スナップショット全体を別のデータベースに復元する | [スナップショットを指定したデータベースに復元する](#option-2-restore-a-snapshot-to-a-specified-database) | データベース間の移行や、別のデータベースにデータのコピーを保持する場合に使用します。 |
| スナップショットから特定のテーブルだけを復元する | [スナップショットから単一のテーブルを復元する](#option-3-restore-a-single-table-from-a-snapshot) | 特定のテーブルだけをロールバックまたは移行する場合に使用します。 |
| 指定したパーティションを復元する、または復元時にテーブル名を変更する | [スナップショットからパーティションとテーブルを復元する](#option-4-restore-partitions-and-tables-from-a-snapshot) | 一部のパーティションだけを復元できます。また、既存のオブジェクトを上書きしないよう、`AS` で復元時にテーブル名を変更できます。 |

## 前提条件

- 復元操作を実行するための **管理者** 権限があること。
- 使用可能なバックアップスナップショットが存在すること。バックアップ操作については、[バックアップ](./backup)を参照してください。
- バックアップが保存されている Repository の名前が分かっていること（以下の例では `example_repo` を使用します）。

## 復元の流れ

1. 対象の Repository にあるスナップショットを照会し、スナップショット名とバックアップのタイムスタンプを取得します。
2. 必要に応じて、データベース全体、別のデータベース、単一のテーブル、またはパーティション単位の `RESTORE` 文を選んで実行します。
3. `SHOW RESTORE` で復元ジョブの状態と進捗を確認し、復元が完了したことを確かめます。

## 1. スナップショットのバックアップ時刻を取得する

復元を実行する前に、バックアップの完了時に生成されたスナップショット名（Label）とタイムスタンプを確認します。次の SQL は、`example_repo` という Repository にあるバックアップを一覧表示します。

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+--------------------+---------------------+--------+
| Snapshot           | Timestamp           | Status |
+--------------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+--------------------+---------------------+--------+
1 row in set (0.15 sec)
```

出力列の意味は次のとおりです。

| 列 | 説明 |
|---|---|
| Snapshot | バックアップの作成時に指定したスナップショットの Label。 |
| Timestamp | スナップショットの完了時に生成されたタイムスタンプ。`backup_timestamp` 引数として `RESTORE` で使用します。 |
| Status | Repository 内のスナップショットの状態。`OK` は、そのスナップショットを使用できることを示します。 |

## 2. スナップショットから復元する

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Full-database restore / Cross-database restore / Single-table restore / Partition restore -->

復元するオブジェクトの範囲と復元先に応じて、次の四つの方法から選んでください。

### 方法 1: スナップショットを現在のデータベースに復元する {#option-1-restore-a-snapshot-to-the-current-database}

Label が `restore_label1`、タイムスタンプが `2022-04-08-15-52-29` のスナップショットを、`example_repo` という Repository から現在のデータベースに復元します。

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 方法 2: スナップショットを指定したデータベースに復元する {#option-2-restore-a-snapshot-to-a-specified-database}

同じスナップショットを `destdb` というデータベースに復元します。データベース間の移行や、別のデータベースにデータのコピーを保持する場合に使用できます。

```sql
RESTORE SNAPSHOT destdb.`restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 方法 3: スナップショットから単一のテーブルを復元する {#option-3-restore-a-single-table-from-a-snapshot}

`example_repo` にある、Label が `restore_label1`、タイムスタンプが `2022-04-08-15-52-29` のスナップショットから、テーブル `backup_tbl` だけを現在のデータベースに復元します。

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 方法 4: スナップショットからパーティションとテーブルを復元する {#option-4-restore-partitions-and-tables-from-a-snapshot}

バックアップスナップショット `snapshot_2` が保存された `example_repo` から、パーティション `p1` と `p2`（テーブル `backup_tbl`）およびテーブル `backup_tbl2` を現在のデータベース `example_db1` に復元し、`backup_tbl2` の名前を `new_tbl` に変更します。スナップショットのタイムスタンプは `2018-05-04-17-11-01` です。

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON
(
    `backup_tbl` PARTITION (`p1`, `p2`),
    `backup_tbl2` AS `new_tbl`
)
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-55-43"
);
```

### 主なパラメータ

| パラメータ | 説明 |
|---|---|
| `SNAPSHOT <label>` | この復元ジョブの Label。`SHOW RESTORE` でジョブを識別するために使用します。 |
| `FROM <repo>` | バックアップが保存されている Repository の名前。 |
| `ON ( ... )` | 任意。復元するオブジェクトを指定します。テーブル名、`PARTITION (...)` 句、名前を変更するための `AS <new_name>` 句を含めることができます。省略すると、スナップショット内のすべてのオブジェクトが復元されます。 |
| `PROPERTIES("backup_timestamp"=...)` | 必須。復元するスナップショットのタイムスタンプ。`Timestamp` 列に対応し、この列は `SHOW SNAPSHOT` の出力に含まれます。 |

## 3. 復元ジョブの進捗を確認する

`SHOW RESTORE` を使用すると、現在のデータベースの復元ジョブの状態と、各段階にかかった時間を確認できます。

```sql
    mysql> SHOW RESTORE\G;
    *************************** 1. row ***************************
                  JobId: 17891851
                  Label: snapshot_label1
              Timestamp: 2022-04-08-15-52-29
                  DbName: default_cluster:example_db1
                  State: FINISHED
              AllowLoad: false
          ReplicationNum: 3
            RestoreObjs: {
      "name": "snapshot_label1",
      "database": "example_db",
      "backup_time": 1649404349050,
      "content": "ALL",
      "olap_table_list": [
        {
          "name": "backup_tbl",
          "partition_names": [
            "p1",
            "p2"
          ]
        }
      ],
      "view_list": [],
      "odbc_table_list": [],
      "odbc_resource_list": []
    }
              CreateTime: 2022-04-08 15:59:01
        MetaPreparedTime: 2022-04-08 15:59:02
    SnapshotFinishedTime: 2022-04-08 15:59:05
    DownloadFinishedTime: 2022-04-08 15:59:12
            FinishedTime: 2022-04-08 15:59:18
        UnfinishedTasks:
                Progress:
              TaskErrMsg:
                  Status: [OK]
                Timeout: 86400
    1 row in set (0.01 sec)
```

主なフィールドの意味は次のとおりです。

| フィールド | 説明 |
|---|---|
| `JobId` | 復元ジョブの内部 ID。 |
| `Label` / `Timestamp` | この復元に対応するスナップショットの Label とバックアップのタイムスタンプ。 |
| `DbName` | 復元先のデータベース。 |
| `State` | ジョブの現在の状態。`FINISHED` は復元が成功したことを示します。 |
| `RestoreObjs` | この復元に含まれるオブジェクト。テーブル名、パーティションの一覧、ビュー、外部テーブルなどです。 |
| `CreateTime` およびその他の時刻フィールド | ジョブの作成、メタデータの準備、スナップショットの取得、ダウンロード、最終的な完了の各時刻。処理が遅い段階の調査に使用できます。 |
| `Status` | エラーの状態。`[OK]` はエラーがないことを示します。それ以外の場合は `TaskErrMsg` を調べて原因を特定してください。 |
| `Timeout` | ジョブのタイムアウト時間（秒）。 |
