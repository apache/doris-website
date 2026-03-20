---
{
  "title": "RESTORE",
  "description": "このステートメントは、BACKUPコマンドによってバックアップされたデータを指定されたデータベースに復元するために使用されます。このコマンドは非同期操作です。",
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

復元するデータが属するデータベースの名前

**2.`<snapshot_name>`**

データスナップショット名

**3.`<repository_name>`**

ウェアハウス名。[CREATE REPOSITORY](./CREATE-REPOSITORY.md)でリポジトリを作成できます

**4.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

復元操作の属性、形式は`<key>` = `<value>`で、現在以下のプロパティをサポートしています：

- "backup_timestamp" = "2018-05-04-16-45-08": 復元する対応するバックアップのタイムバージョンを指定します。必須項目です。この情報は`SHOW SNAPSHOT ON repo;`文で取得できます。
- "replication_num" = "3": 復元するTableまたはパーティションのレプリカ数を指定します。デフォルトは3です。既存のTableまたはパーティションを復元する場合、レプリカ数は既存のTableまたはパーティションのレプリカ数と同じである必要があります。同時に、複数のレプリカを収容するのに十分なホストが存在する必要があります。
- "reserve_replica" = "true": デフォルトはfalseです。このプロパティがtrueの場合、replication_numプロパティは無視され、復元されるTableまたはパーティションはバックアップ前と同じレプリケーション数になります。Table内の複数のTableまたは複数のパーティションで異なるレプリケーション数をサポートします。
- "reserve_dynamic_partition_enable" = "true": デフォルトはfalseです。このプロパティがtrueの場合、復元されるTableはバックアップ前と同じ'dynamic_partition_enable'の値を持ちます。このプロパティがtrueでない場合、復元されるTableは'dynamic_partition_enable=false'に設定されます。
- "timeout" = "3600": タスクのタイムアウト期間、デフォルトは1日です。秒単位で指定します。
- "meta_version" = 40: 指定されたmeta_versionを使用して以前にバックアップされたメタデータを読み取ります。このパラメータは一時的な解決策として使用され、Dorisの古いバージョンでバックアップされたデータを復元する場合のみ使用されます。最新版のバックアップデータにはすでにメタバージョンが含まれているため、指定する必要はありません。
- "clean_tables" : 復元対象に属さないTableをクリーンアップするかどうかを示します。例えば、復元前のターゲットdbにスナップショットに存在しないTableがある場合、`clean_tables`を指定することで復元中にこれらの余分なTableを削除してリサイクルビンに移動できます。
  - この機能はApache Doris 2.1.6バージョンからサポートされています
- "clean_partitions": 復元対象に属さないパーティションをクリーンアップするかどうかを示します。例えば、復元前のターゲットTableにスナップショットに存在しないパーティションがある場合、`clean_partitions`を指定することで復元中にこれらの余分なパーティションを削除してリサイクルビンに移動できます。
  - この機能はApache Doris 2.1.6バージョンからサポートされています
- "atomic_restore" - : データは最初に一時Tableにロードされ、その後元のTableがアトミックに置き換えられ、復旧プロセス中にターゲットTableの読み書きが影響を受けないことを保証します。
- "force_replace" : Tableが存在し、スキーマがバックアップTableと異なる場合に強制的に置き換えます。
  - `force_replace`を有効にするには、`atomic_restore`を有効にする必要があることに注意してください

## オプションパラメータ

**1.`<table_name>`**

復元するTableの名前。指定しない場合、データベース全体が復元されます。

- 復元が必要なTableとパーティションはON句で識別されます。パーティションが指定されていない場合、デフォルトでTableのすべてのパーティションが復元されます。指定されたTableとパーティションは、ウェアハウスバックアップに既に存在している必要があります。
- 復旧が不要なTableとパーティションはEXCLUDE句で識別されます。指定されたTableまたはパーティションを除くウェアハウス内の他のすべてのTableのすべてのパーティションが復元されます。

**2.`<partition_name>`**

復元するパーティションの名前。指定しない場合、対応するTableのすべてのパーティションが復元されます。

**3.`<table_alias>`**

Tableエイリアス

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：
| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | この操作はLOAD_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 使用上の注意事項

- OLAPタイプのTableの復元のみサポートされています。
- 同じデータベース下で実行できるBACKUPまたはRESTOREタスクは1つのみです。
- ウェアハウス内のバックアップされたTableを復元して、データベース内の同名の既存Tableを置き換えることができますが、2つのTableのTable構造が完全に同じであることを確認する必要があります。Table構造には、Table名、カラム、パーティション、Rollupなどが含まれます。
- 復旧Tableの一部のパーティションを指定でき、システムはパーティションのRangeまたはListがマッチできるかどうかをチェックします。
- ウェアハウスにバックアップされたTable名は、AS文を通じて新しいTableに復元できます。ただし、新しいTable名はデータベースに既に存在してはいけません。パーティション名は変更できません。
- 復旧操作の効率性：同じクラスターサイズの場合、復元操作の所要時間は基本的にバックアップ操作の所要時間と同じです。復旧操作を高速化したい場合は、`replication_num`パラメータを設定してまず1つのコピーのみを復元し、その後[ALTER TABLE PROPERTY](../../../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY)によってコピー数を調整してコピーを完了できます。

## 例

1. example_repoからbackup snapshot_1内のTablebackup_tblをデータベースexample_db1に復元し、タイムバージョンは"2018-05-04-16-45-08"です。1つのコピーに復元します：

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
2. example_repo のバックアップ snapshot_2 から、Table backup_tbl のパーティション p1、p2 を復元し、Table backup_tbl2 をデータベース example_db1 に復元して new_tbl にリネームします。タイムバージョンは "2018-05-04-17-11-01" です。デフォルトでは 3 レプリカに戻されます：

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
example_repo から database example_db1 に backup snapshot_3 内の table backup_tbl を除くすべてのTableを復元します。時間バージョンは "2018-05-04-18-12-18" です。

```sql
RESTORE SNAPSHOT example_db1.`snapshot_3`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```
