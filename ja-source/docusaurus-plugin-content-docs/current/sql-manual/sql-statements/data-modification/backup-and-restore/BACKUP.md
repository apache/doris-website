---
{
  "title": "バックアップ",
  "language": "ja",
  "description": "このステートメントは、指定されたデータベース配下のデータをバックアップするために使用されます。このコマンドは非同期操作です。"
}
---
## 説明

このステートメントは、指定されたデータベース配下のデータをバックアップするために使用されます。このコマンドは非同期操作です。送信後、`SHOW BACKUP`コマンドで進行状況を確認できます。

## 構文

```sql
BACKUP [GLOBAL] SNAPSHOT [<db_name>.]<snapshot_name>
TO `<repository_name>`
[ { ON | EXCLUDE } ]
    ( <table_name> [ PARTITION ( <partition_name> [, ...] ) ]
    [, ...] ) ]

[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```
## 必須パラメータ

**1.`<db_name>`**

バックアップ対象データが属するデータベースの名前。

**2.`<snapshot_name>`**

データスナップショット名を指定します。スナップショット名は重複不可で、グローバルに一意である必要があります。

**3.`<repository_name>`**

ウェアハウス名。リポジトリは[CREATE REPOSITORY](./CREATE-REPOSITORY.md)を使用して作成できます。

## オプションパラメータ

**1.`<table_name>`**

バックアップ対象テーブルの名前。指定しない場合、データベース全体がバックアップされます。

- ON句は、バックアップが必要なテーブルとパーティションを識別します。パーティションが指定されていない場合、デフォルトでテーブルのすべてのパーティションがバックアップされます
- バックアップが不要なテーブルとパーティションは、EXCLUDE句で識別されます。指定したテーブルまたはパーティションを除く、このデータベース内のすべてのテーブルのすべてのパーティションデータをバックアップします。

**2.`<partition_name>`**

バックアップ対象パーティションの名前。指定しない場合、対応するテーブルのすべてのパーティションがバックアップされます。

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

データスナップショット属性、形式：`<key>` = `<value>`、現在以下のプロパティをサポートしています：

- "type" = "full": フル更新であることを示します（デフォルト）
- "timeout" = "3600": タスクタイムアウト期間、デフォルトは1日。単位は秒。
- "backup_privilege" = "true": 権限をバックアップするかどうか。`BACKUP GLOBAL`と組み合わせて使用します。
- "backup_catalog" = "true": カタログをバックアップするかどうか。`BACKUP GLOBAL`と組み合わせて使用します。
- "backup_workload_group" = "true": ワークロードグループをバックアップするかどうか。`BACKUP GLOBAL`と組み合わせて使用します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：
| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | この操作はLOAD_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 使用上の注意

- OLAP型のテーブルのバックアップのみサポートされています。
- 同一データベース下では、一度に1つのバックアップ操作のみ実行できます。
- バックアップ操作は、指定されたテーブルまたはパーティションの基底テーブルと[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)をバックアップし、1つのレプリカのみがバックアップされます。[非同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/async-materialized-view/overview.md)はサポートされていません。
- バックアップ操作の効率：バックアップ操作の効率は、データ量、Compute Nodesの数、およびファイル数に依存します。バックアップデータシャードが配置されている各Compute Nodeは、バックアップ操作のアップロード段階に参加します。ノード数が多いほど、アップロード効率が高くなります。ファイルデータ量は、シャード数と各シャード内のファイル数のみを指します。シャード数が多い場合、またはシャード内に小さなファイルが多数ある場合、バックアップ操作時間が増加する可能性があります。

## 例

1. example_db下のテーブルexample_tblをウェアハウスexample_repoに完全バックアップする：

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```
2. フルバックアップの下で、example_db、テーブルexample_tblのp1、p2パーティション、およびテーブルexample_tbl2をウェアハウスexample_repoに：

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```
3. example_db配下のexample_tblテーブルを除く全てのテーブルのフルバックアップをwarehouse example_repoに実行する場合：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```
4. example_db 配下のテーブルを example_repo リポジトリに完全にバックアップする：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```
5. 権限、カタログ、およびワークロードグループをリポジトリ example_repo にバックアップします:

```sql
BACKUP GLOBAL SNAPSHOT snapshot_label5
TO example_repo;
```
6. 権限とカタログをリポジトリ example_repo にバックアップする：

```sql
BACKUP GLOBAL SNAPSHOT snapshot_label6
TO example_repo
PROPERTIES ("backup_privilege" = "true", "backup_catalog" = "true");
```
