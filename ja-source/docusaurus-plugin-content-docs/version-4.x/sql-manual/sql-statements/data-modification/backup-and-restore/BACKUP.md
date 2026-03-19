---
{
  "title": "BACKUP",
  "description": "この文は、指定されたデータベース配下のデータをバックアップするために使用されます。このコマンドは非同期操作です。",
  "language": "ja"
}
---
## 説明

このステートメントは、指定されたデータベース下のデータをバックアップするために使用されます。このコマンドは非同期操作です。送信が成功した後、[SHOW BACKUP](./SHOW-BACKUP.md) コマンドを通じて進行状況を確認する必要があります。

## 構文

```sql
BACKUP SNAPSHOT [<db_name>.]<snapshot_name>
TO `<repository_name>`
[ { ON | EXCLUDE } ]
    ( <table_name> [ PARTITION ( <partition_name> [, ...] ) ]
    [, ...] ) ]

[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```
## 必須パラメータ

**1.`<db_name>`**

バックアップ対象のデータが所属するデータベースの名前。

**2.`<snapshot_name>`**

データスナップショット名を指定します。スナップショット名は重複できず、グローバルに一意である必要があります。

**3.`<repository_name>`**

ウェアハウス名。リポジトリは[CREATE REPOSITORY](./CREATE-REPOSITORY.md)で作成できます。

## オプションパラメータ

**1.`<table_name>`**

バックアップ対象のTable名。指定しない場合、データベース全体がバックアップされます。

- ON句では、バックアップが必要なTableとパーティションを指定します。パーティションが指定されていない場合、デフォルトでそのTableのすべてのパーティションがバックアップされます
- バックアップが不要なTableとパーティションはEXCLUDE句で指定します。指定されたTableまたはパーティション以外の、このデータベース内のすべてのTableのすべてのパーティションデータをバックアップします。

**2.`<partition_name>`**

バックアップ対象のパーティション名。指定しない場合、対応するTableのすべてのパーティションがバックアップされます。

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

データスナップショットの属性。形式：`<key>` = `<value>`。現在以下のプロパティをサポートしています：

- "type" = "full"：フル更新であることを示します（デフォルト）
- "timeout" = "3600"：タスクのタイムアウト期間。デフォルトは1日。単位は秒。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限が必要です：
| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | この操作はLOAD_PRIV権限を持つユーザーまたはロールのみが実行可能です  |

## 使用上の注意

- OLAP型のTableのバックアップのみサポートされています。
- 同一データベース配下では、一度に1つのバックアップ操作のみ実行できます。
- バックアップ操作では、指定されたTableまたはパーティションの基底Tableと[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)がバックアップされ、1つのレプリカのみがバックアップされます。[非同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/async-materialized-view/overview.md)はサポートされていません。
- バックアップ操作の効率：バックアップ操作の効率は、データ量、Compute Nodeの数、ファイル数に依存します。バックアップデータのシャードが配置されている各Compute Nodeが、バックアップ操作のアップロード段階に参加します。ノード数が多いほど、アップロード効率が高くなります。ファイルデータ量は、シャード数と各シャード内のファイル数のみを指します。シャードが多い場合、またはシャード内に小さなファイルが多数ある場合、バックアップ操作時間が増加する可能性があります。

## 例

1. example_db配下のTableexample_tblを、ウェアハウスexample_repoにフルバックアップする：

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```
2. フルバックアップの下で、example_dbのTableexample_tblのp1、p2パーティション、およびTableexample_tbl2をウェアハウスexample_repoに：

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```
3. example_db下のtable example_tblを除く全てのTableのフルバックアップをwarehouse example_repoに実行：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```
4. example_db 配下のTableを完全にリポジトリ example_repo にバックアップする：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```
