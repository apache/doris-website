---
{
  "title": "リストア",
  "language": "ja",
  "description": "この文は、BACKUPコマンドによってバックアップされたデータを指定されたデータベースに復元するために使用されます。このコマンドは非同期操作です。"
}
---
## 説明

このステートメントは、BACKUPコマンドによってバックアップされたデータを指定されたデータベースに復元するために使用されます。このコマンドは非同期操作です。送信が成功した後、[SHOW RESTORE](./SHOW-RESTORE.md)コマンドを通じて進行状況を確認する必要があります。

## 構文

```sql
RESTORE [GLOBAL] SNAPSHOT [<db_name>.]<snapshot_name>
FROM `<repository_name>`
[ { ON | EXCLUDE } ] (
    `<table_name>` [PARTITION (`<partition_name>`, ...)] [AS `<table_alias>`]
    [, ...] ) ]
)
[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```
## 必須パラメータ

**1.`<db_name>`**

復元するデータが属するデータベース名

**2.`<snapshot_name>`**

データスナップショット名

**3.`<repository_name>`**

倉庫名。[CREATE REPOSITORY](./CREATE-REPOSITORY.md)でリポジトリを作成できます

**4.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

復元操作の属性、形式は`<key>` = `<value>`で、現在以下のプロパティをサポートしています：

- "backup_timestamp" = "2018-05-04-16-45-08"：復元する対応するバックアップの時間バージョンを指定します、必須です。この情報は`SHOW SNAPSHOT ON repo;`文で取得できます。
- "replication_num" = "3"：復元するテーブルまたはパーティションのレプリカ数を指定します。デフォルトは3です。既存のテーブルまたはパーティションを復元する場合、レプリカ数は既存のテーブルまたはパーティションのレプリカ数と同じでなければなりません。同時に、複数のレプリカを収容するのに十分なホストが必要です。
- "reserve_replica" = "true"：デフォルトはfalseです。このプロパティがtrueの場合、replication_numプロパティは無視され、復元されたテーブルまたはパーティションはバックアップ前と同じレプリケーション数を持ちます。複数のテーブルまたはテーブル内の複数のパーティションで異なるレプリケーション数をサポートします。
- "reserve_colocate" = "true"：デフォルトはfalseです。このプロパティがfalseの場合、colocateプロパティは復元されません。このプロパティがtrueの場合、復元されたテーブルはcolocateプロパティを保持します。
- "reserve_dynamic_partition_enable" = "true"：デフォルトはfalseです。このプロパティがtrueの場合、復元されたテーブルはバックアップ前と同じ'dynamic_partition_enable'の値を持ちます。このプロパティがtrueでない場合、復元されたテーブルは'dynamic_partition_enable=false'に設定されます。
- "timeout" = "3600"：タスクタイムアウト期間、デフォルトは1日です。秒単位。
- "meta_version" = 40：指定されたmeta_versionを使用して以前にバックアップされたメタデータを読み取ります。このパラメータは一時的な解決策として使用され、古いバージョンのDorisでバックアップされたデータを復元する場合のみ使用されることに注意してください。最新バージョンのバックアップデータは既にmetaバージョンを含んでいるため、指定する必要はありません。
- "clean_tables"：復元対象に属さないテーブルをクリーンアップするかどうかを示します。例えば、復元前のターゲットdbにスナップショットに存在しないテーブルがある場合、`clean_tables`を指定することで復元中にこれらの余分なテーブルを削除し、リサイクルビンに移動できます。
  - この機能はApache Doris 2.1.6バージョン以降でサポートされています
- "clean_partitions"：復元対象に属さないパーティションをクリーンアップするかどうかを示します。例えば、復元前のターゲットテーブルにスナップショットに存在しないパーティションがある場合、`clean_partitions`を指定することで復元中にこれらの余分なパーティションを削除し、リサイクルビンに移動できます。
  - この機能はApache Doris 2.1.6バージョン以降でサポートされています
- "atomic_restore"：データは最初に一時テーブルにロードされ、その後元のテーブルがアトミックに置換されて、回復プロセス中にターゲットテーブルの読み書きが影響を受けないようにします。
- "force_replace"：テーブルが存在し、スキーマがバックアップテーブルと異なる場合に強制置換します。
  - `force_replace`を有効にするには、`atomic_restore`を有効にする必要があることに注意してください
- "reserve_privilege" = "true"：権限を復元するかどうか。`RESTORE GLOBAL`と一緒に使用します。
- "reserve_catalog" = "true"：カタログを復元するかどうか。`RESTORE GLOBAL`と一緒に使用します。
- "reserve_workload_group" = "true"：ワークロードグループを復元するかどうか。`RESTORE GLOBAL`と一緒に使用します。

## オプションパラメータ

**1.`<table_name>`**

復元するテーブル名。指定されていない場合、データベース全体が復元されます。

- 復元が必要なテーブルとパーティションはON句で識別されます。パーティションが指定されていない場合、デフォルトでテーブルのすべてのパーティションが復元されます。指定されたテーブルとパーティションは倉庫バックアップに既に存在している必要があります。
- 回復が不要なテーブルとパーティションはEXCLUDE句で識別されます。指定されたテーブルまたはパーティション以外の倉庫内の他のすべてのテーブルのすべてのパーティションが復元されます。

**2.`<partition_name>`**

復元するパーティション名。指定されていない場合、対応するテーブルのすべてのパーティションが復元されます。

**3.`<table_alias>`**

テーブル別名

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：
| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | この操作はLOAD_PRIV権限を持つユーザーまたはロールによってのみ実行できます  |

## 使用上の注意

- OLAP型のテーブルの復元のみサポートされています。
- 同じデータベースで実行できるBACKUPまたはRESTOREタスクは1つだけです。
- 倉庫内のバックアップされたテーブルを復元して、データベース内の同名の既存テーブルを置換できますが、2つのテーブルのテーブル構造が完全に同じであることを確認する必要があります。テーブル構造には、テーブル名、列、パーティション、Rollupなどが含まれます。
- 回復テーブルの一部のパーティションを指定でき、システムはパーティションRangeまたはListが一致するかどうかをチェックします。
- 倉庫内にバックアップされたテーブル名は、AS文を通じて新しいテーブルに復元できます。ただし、新しいテーブル名はデータベース内に既に存在してはいけません。パーティション名は変更できません。
- 復元操作の効率：同じクラスターサイズの場合、復元操作の所要時間は基本的にバックアップ操作の所要時間と同じです。復元操作を高速化したい場合は、`replication_num`パラメータを設定して最初に1つのコピーのみを復元し、その後[ALTER TABLE PROPERTY](../../../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY)でコピー数を調整して、コピーを完了できます。

## 例

1. example_repoからbackup snapshot_1内のテーブルbackup_tblをデータベースexample_db1に復元します、時間バージョンは"2018-05-04-16-45-08"です。1つのコピーに復元します：

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
2. example_repoのbackup snapshot_2からテーブルbackup_tblのパーティションp1、p2を復元し、テーブルbackup_tbl2をデータベースexample_db1に復元して、new_tblにリネームします。時刻バージョンは"2018-05-04-17-11-01"です。デフォルトで3レプリカに戻ります：

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
3. example_repo から backup snapshot_3 内の backup_tbl テーブルを除く全てのテーブルを database example_db1 に復元します。時間バージョンは "2018-05-04-18-12-18" です。

```sql
RESTORE SNAPSHOT example_db1.`snapshot_3`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```
4. example_repo内のバックアップsnapshot_4から、時間バージョン「2018-05-04-18-12-18」で権限、カタログ、およびワークロードグループを復元します。

```sql
RESTORE GLOBAL SNAPSHOT `snapshot_4`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```
5. example_repo内のbackup snapshot_5から、時間バージョン「2018-05-04-18-12-18」で権限とワークロードグループを復元します。

```sql
RESTORE GLOBAL SNAPSHOT `snapshot_5`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18",
    "reserve_privilege" = "true",
    "reserve_workload_group" = "true"
);
```
