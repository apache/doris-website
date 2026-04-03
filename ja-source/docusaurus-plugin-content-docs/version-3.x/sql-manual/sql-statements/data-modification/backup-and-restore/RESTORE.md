---
{
  "title": "RESTORE",
  "description": "この文は、BACKUPコマンドによってバックアップされたデータを指定されたデータベースに復元するために使用されます。このコマンドは非同期操作です。",
  "language": "ja"
}
---
## 説明

このステートメントは、BACKUPコマンドによってバックアップされたデータを指定されたデータベースに復元するために使用されます。このコマンドは非同期操作です。送信が成功した後、[SHOW RESTORE](./SHOW-RESTORE.md)コマンドを通じて進行状況を確認する必要があります。

## 構文

```sql
RESTORE SNAPSHOT [<db_name>.]<snapshot_name>
FROM `<repository_name>`
[ { ON | EXCLUDE } ] (
    `<table_name>` [PARTITION (`<partition_name>`, ...)] [AS `<table_alias>`]
    [, ...] ) ]
)
[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```
## 必須パラメータ

**1.`<db_name>`**

復元対象のデータが属するデータベース名

**2.`<snapshot_name>`**

データスナップショット名

**3.`<repository_name>`**

ウェアハウス名。[CREATE REPOSITORY](./CREATE-REPOSITORY.md)でリポジトリを作成できます

**4.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

復元操作の属性、形式は`<key>` = `<value>`です。現在以下のプロパティをサポートしています：

- "backup_timestamp" = "2018-05-04-16-45-08": 復元する対応するバックアップの時刻バージョンを指定します。必須です。この情報は`SHOW SNAPSHOT ON repo;`文で取得できます。
- "replication_num" = "3": 復元するTableまたはパーティションのレプリカ数を指定します。デフォルトは3です。既存のTableまたはパーティションを復元する場合、レプリカ数は既存のTableまたはパーティションのレプリカ数と同じでなければなりません。同時に、複数のレプリカを格納するのに十分なホストが必要です。
- "reserve_replica" = "true": デフォルトはfalseです。このプロパティがtrueの場合、replication_numプロパティは無視され、復元されるTableまたはパーティションはバックアップ前と同じレプリケーション数を持ちます。Table内の複数のTableまたは複数のパーティションで異なるレプリケーション数をサポートします。
- "reserve_dynamic_partition_enable" = "true": デフォルトはfalseです。このプロパティがtrueの場合、復元されるTableはバックアップ前と同じ'dynamic_partition_enable'の値を持ちます。このプロパティがtrueでない場合、復元されるTableは'dynamic_partition_enable=false'に設定されます。
- "timeout" = "3600": タスクタイムアウト時間、デフォルトは1日です。秒単位で指定します。
- "meta_version" = 40: 指定したmeta_versionを使用して以前にバックアップされたメタデータを読み取ります。このパラメータは一時的な解決策として使用され、Dorisの旧バージョンでバックアップされたデータの復元にのみ使用されることに注意してください。最新バージョンのバックアップデータにはすでにmetaバージョンが含まれているため、指定する必要はありません。
- "clean_tables" : 復元対象に属さないTableをクリーンアップするかどうかを示します。例えば、復元前の対象dbにスナップショットに存在しないTableがある場合、`clean_tables`を指定することで、復元時にこれらの余分なTableを削除してゴミ箱に移動できます。
    - この機能はApache Doris 2.1.6バージョン以降でサポートされています
- "clean_partitions"：復元対象に属さないパーティションをクリーンアップするかどうかを示します。例えば、復元前の対象Tableにスナップショットに存在しないパーティションがある場合、`clean_partitions`を指定することで、復元時にこれらの余分なパーティションを削除してゴミ箱に移動できます。
    - この機能はApache Doris 2.1.6バージョン以降でサポートされています
- "atomic_restore"： データはまず一時Tableにロードされ、その後元のTableがアトミックに置き換えられ、復旧プロセス中に対象Tableの読み書きが影響を受けないことを保証します。
- "force_replace"：Tableが存在し、バックアップTableとスキーマが異なる場合に強制的に置き換えます。
  - "force_replace"を有効にするには、"atomic_restore"を有効にする必要があることに注意してください
## オプションパラメータ

**1.`<table_name>`**

復元するTable名。指定しない場合、データベース全体が復元されます。

- 復元が必要なTableとパーティションはON句で識別されます。パーティションが指定されていない場合、デフォルトでTableのすべてのパーティションが復元されます。指定されたTableとパーティションは、ウェアハウスバックアップ内に既に存在している必要があります。
- 復旧が不要なTableとパーティションはEXCLUDE句で識別されます。指定されたTableまたはパーティション以外のウェアハウス内のすべての他のTableのすべてのパーティションが復元されます。

**2.`<partition_name>`**

復元するパーティション名。指定しない場合、対応するTableのすべてのパーティションが復元されます。

**3.`<table_alias>`**

Tableエイリアス

## アクセス制御要件

このSQLコマンドを実行するユーザーには、少なくとも以下の権限が必要です：
| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | この操作はLOAD_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 使用上の注意

- OLAP型のTableの復元のみがサポートされています。
- 同じデータベース下で実行中のBACKUPまたはRESTOREタスクは1つだけです。
- ウェアハウス内でバックアップされたTableを復元して、データベース内の同名の既存Tableを置き換えることができますが、2つのTableの構造が完全に同じであることを保証する必要があります。Table構造には、Table名、列、パーティション、Rollupなどが含まれます。
- 復旧Tableの一部のパーティションを指定でき、システムはパーティションRangeまたはListがマッチできるかどうかをチェックします。
- ウェアハウス内でバックアップされたTable名は、AS文を通じて新しいTableに復元できます。ただし、新しいTable名はデータベース内に既に存在してはなりません。パーティション名は変更できません。
- 復旧操作の効率：同じクラスターサイズの場合、復元操作の所要時間は基本的にバックアップ操作の所要時間と同じです。復旧操作を高速化したい場合は、`replication_num`パラメータを設定してまず1つのコピーのみを復元し、その後[ALTER TABLE PROPERTY](../../../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY)でコピー数を調整して、コピーを完成させることができます。

## 例

1. example_repoからbackup snapshot_1内のTablebackup_tblをデータベースexample_db1に復元し、時刻バージョンは"2018-05-04-16-45-08"です。1つのコピーに復元：

```sql
RESTORE SNAPSHOT example_db1.`snapshot_1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-16-45-08",
    "replication_num" = "1"
);
```
2. example_repo の backup snapshot_2 から table backup_tbl の partitions p1, p2 を復元し、table backup_tbl2 を database example_db1 に復元して new_tbl にリネームします。time version は "2018-05-04-17-11-01" です。デフォルトでは 3 replicas に戻されます：

```sql
RESTORE SNAPSHOT example_db1.`snapshot_2`
FROM `example_repo`
ON
(
    `backup_tbl` PARTITION (`p1`, `p2`),
    `backup_tbl2` AS `new_tbl`
)
PROPERTIES
(
    "backup_timestamp"="2018-05-04-17-11-01"
);
```
3. example_repoからdatabase example_db1に、backup snapshot_3内のtable backup_tblを除くすべてのTableを復元します。時刻バージョンは"2018-05-04-18-12-18"です。

```sql
RESTORE SNAPSHOT example_db1.`snapshot_3`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```
