---
{
  "title": "復元",
  "language": "ja",
  "description": "次のSQL文を使用して、examplerepoという名前のRepositoryにある既存のバックアップを表示できます。"
}
---
## 前提条件

1. リストア操作を実行するために**administrator**権限を持っていることを確認してください。
2. バックアップを保存するための既存の**Repository**があることを確認してください。ない場合は、Repositoryを作成し、[backup](backup.md)を実行する手順に従ってください。
3. リストア用の有効な**backup**スナップショットが利用可能であることを確認してください。

## 1. スナップショットのBackup Timestampを取得する

以下のSQL文を使用して、`example_repo`という名前のRepository内の既存のバックアップを表示できます。

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo;
   +-----------------+---------------------+--------+
   | Snapshot            | Timestamp              | Status   |
   +-----------------+---------------------+--------+
   | exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```
## 2. Snapshotからの復元

### オプション1: 現在のデータベースにSnapshotを復元

以下のSQL文は、`example_repo`という名前のRepositoryから、タイムスタンプ`2022-04-08-15-52-29`を持つ`restore_label1`というラベルのsnapshotを現在のデータベースに復元します。

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```
### オプション 2: 指定されたデータベースへのスナップショット復元

以下の SQL 文は、`example_repo` という名前の Repository から、タイムスタンプ `2022-04-08-15-52-29` を持つ `restore_label1` というラベルのスナップショットを `destdb` という名前のデータベースに復元します。

```sql
RESTORE SNAPSHOT destdb.`restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```
### オプション3: スナップショットから単一テーブルを復元する

`example_repo`のスナップショットからテーブル`backup_tbl`を現在のデータベースに復元します。スナップショットラベルは`restore_label1`、タイムスタンプは`2022-04-08-15-52-29`です。

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```
### オプション 4: スナップショットからパーティションとテーブルを復元

バックアップスナップショット `snapshot_2` から、スナップショットタイムスタンプ `"2018-05-04-17-11-01"` を使用して、テーブル `backup_tbl` のパーティション p1 と p2、およびテーブル `backup_tbl2` を現在のデータベース `example_db1` に復元し、`new_tbl` にリネームします。

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
## 3. リストアジョブの実行ステータスを確認する

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
