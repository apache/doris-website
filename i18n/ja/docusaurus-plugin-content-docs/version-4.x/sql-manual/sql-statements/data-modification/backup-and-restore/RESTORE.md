---
{
    "title": "RESTORE",
    "language": "ja",
    "description": "このステートメントは、BACKUP コマンドでバックアップしたデータを指定したデータベースに復元します。このコマンドは非同期で実行されます。"
}
---

## 説明

このステートメントは、BACKUP コマンドでバックアップしたデータを指定したデータベースに復元します。このコマンドは非同期で実行されます。送信に成功した後は、[SHOW RESTORE](./SHOW-RESTORE.md) コマンドで進捗を確認してください。

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

復元するデータが属するデータベースの名前。

**2.`<snapshot_name>`**

データスナップショットの名前。

**3.`<repository_name>`**

リポジトリの名前。[CREATE REPOSITORY](./CREATE-REPOSITORY.md) でリポジトリを作成できます。

**4.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

復元操作のプロパティ。形式は `<key>` = `<value>` です。現在、次のプロパティをサポートしています。

- "backup_timestamp" = "2018-05-04-16-45-08": 対応するバックアップのどの時点のバージョンを復元するかを指定します。必須です。この情報は `SHOW SNAPSHOT ON repo;` ステートメントで取得できます。
- "replication_num" = "3": 復元するテーブルまたはパーティションのレプリカ数を指定します。デフォルトは 3 です。既存のテーブルまたはパーティションを復元する場合、レプリカ数は既存のテーブルまたはパーティションのレプリカ数と同じでなければなりません。また、複数のレプリカを配置できる十分な数のホストが必要です。
- "reserve_replica" = "true": デフォルトは false です。このプロパティが true の場合、replication_num プロパティは無視され、復元するテーブルまたはパーティションのレプリカ数はバックアップ前と同じになります。複数のテーブル間、または一つのテーブル内の複数のパーティション間でレプリカ数が異なる場合にも対応します。
- "reserve_colocate" = "true": デフォルトは false です。false の場合、colocate プロパティは復元されません。true の場合、復元したテーブルは colocate プロパティを保持します。
- "reserve_dynamic_partition_enable" = "true": デフォルトは false です。true の場合、復元したテーブルの 'dynamic_partition_enable' はバックアップ前と同じ値になります。true 以外の場合、復元したテーブルでは 'dynamic_partition_enable=false' が設定されます。
- "timeout" = "3600": タスクのタイムアウト時間を秒単位で指定します。デフォルトは一日です。
- "meta_version" = 40: 指定した meta_version を使用して、以前にバックアップしたメタデータを読み込みます。このパラメータは一時的な対処手段であり、古いバージョンの Doris でバックアップしたデータの復元にのみ使用します。最新バージョンのバックアップデータにはメタバージョンが含まれているため、指定する必要はありません。
- "clean_tables": 復元対象に含まれないテーブルをクリーンアップするかどうかを指定します。たとえば、復元前の対象データベースにスナップショットに存在しないテーブルがある場合、`clean_tables` を指定すると、復元時にそれらの余分なテーブルを削除してごみ箱に移動できます。
  - この機能は Apache Doris 2.1.6 以降でサポートされています。
- "clean_partitions": 復元対象に含まれないパーティションをクリーンアップするかどうかを指定します。たとえば、復元前の対象テーブルにスナップショットに存在しないパーティションがある場合、`clean_partitions` を指定すると、復元時にそれらの余分なパーティションを削除してごみ箱に移動できます。
  - この機能は Apache Doris 2.1.6 以降でサポートされています。
- "atomic_restore" - : データを先に一時テーブルに読み込み、その後で元のテーブルをアトミックに置き換えます。これにより、復元中も対象テーブルの読み書きに影響が出ないようにします。
- "force_replace": テーブルが存在し、そのスキーマがバックアップしたテーブルと異なる場合に、強制的に置き換えます。
  - `force_replace` を有効にするには、`atomic_restore` も有効にする必要があります。

## 任意パラメータ

**1.`<table_name>`**

復元するテーブルの名前。指定しない場合は、データベース全体が復元されます。

- 復元するテーブルとパーティションは ON 句で指定します。パーティションを指定しない場合、デフォルトでそのテーブルのすべてのパーティションが復元されます。指定するテーブルとパーティションは、リポジトリのバックアップに存在している必要があります。
- 復元しないテーブルとパーティションは EXCLUDE 句で指定します。指定したテーブルまたはパーティションを除き、リポジトリ内のすべてのテーブルとパーティションが復元されます。

**2.`<partition_name>`**

復元するパーティションの名前。指定しない場合は、該当するテーブルのすべてのパーティションが復元されます。

**3.`<table_alias>`**

テーブルの別名。

## アクセス権限の要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。
| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER または ROLE    | この操作を実行できるのは、LOAD_PRIV 権限を持つユーザーまたはロールのみです。 |

## 使用上の注意

- 復元できるのは OLAP 型のテーブルのみです。
- 同じデータベースで同時に実行できる BACKUP または RESTORE タスクは一つだけです。
- リポジトリにバックアップしたテーブルを復元して、データベース内の同名の既存テーブルを置き換えることができます。ただし、両テーブルの構造が完全に同じである必要があります。テーブル構造には、テーブル名、カラム、パーティション、Rollup などが含まれます。
- 復元するテーブルの一部のパーティションを指定できます。システムはパーティションの Range または List が一致するかどうかを確認します。
- リポジトリにバックアップしたテーブルを、AS 句を使用して新しいテーブルとして復元できます。ただし、新しいテーブル名がデータベース内にすでに存在していてはなりません。パーティション名は変更できません。
- 復元操作の効率: クラスターの規模が同じ場合、復元にかかる時間は基本的にバックアップにかかる時間と同じです。復元を高速化するには、まず `replication_num` パラメータを設定して一つのレプリカだけ復元し、その後 [ALTER TABLE PROPERTY](../../../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY) でレプリカ数を調整してレプリカを補完できます。

## 例

1. example_repo のバックアップ snapshot_1 から、テーブル backup_tbl をデータベース example_db1 に復元します。バックアップの時点は "2018-05-04-16-45-08" で、1 レプリカとして復元します。

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

2. example_repo のバックアップ snapshot_2 から、テーブル backup_tbl のパーティション p1 と p2、およびテーブル backup_tbl2 をデータベース example_db1 に復元します。backup_tbl2 は new_tbl に改名します。バックアップの時点は "2018-05-04-17-11-01" で、デフォルトの 3 レプリカとして復元します。

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

3. example_repo のバックアップ snapshot_3 から、テーブル backup_tbl を除くすべてのテーブルをデータベース example_db1 に復元します。バックアップの時点は "2018-05-04-18-12-18" です。

```sql
RESTORE SNAPSHOT example_db1.`snapshot_3`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```
