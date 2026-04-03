---
{
  "title": "バックアップ",
  "language": "ja",
  "description": "この文は指定されたデータベース下のデータをバックアップするために使用されます。このコマンドは非同期操作です。"
}
---
## 説明

このステートメントは、指定されたデータベース配下のデータをバックアップするために使用されます。このコマンドは非同期操作です。投入が成功した後、[SHOW BACKUP](./SHOW-BACKUP.md)コマンドを通じて進行状況を確認する必要があります。

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

バックアップ対象データが属するデータベースの名前。

**2.`<snapshot_name>`**

データスナップショット名を指定します。スナップショット名は重複できず、グローバルに一意である必要があります。

**3.`<repository_name>`**

ウェアハウス名。[CREATE REPOSITORY](./CREATE-REPOSITORY.md)でリポジトリを作成できます。

## オプションパラメータ

**1.`<table_name>`**

バックアップ対象テーブルの名前。指定されていない場合、データベース全体がバックアップされます。

- ON句は、バックアップが必要なテーブルとパーティションを識別します。パーティションが指定されていない場合、デフォルトでテーブルの全パーティションがバックアップされます
- バックアップが不要なテーブルとパーティションはEXCLUDE句で識別されます。指定されたテーブルまたはパーティション以外の、このデータベース内の全テーブルの全パーティションデータをバックアップします。

**2.`<partition_name>`**

バックアップ対象パーティションの名前。指定されていない場合、対応するテーブルの全パーティションがバックアップされます。

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

データスナップショット属性。形式：`<key>` = `<value>`。現在、以下のプロパティがサポートされています：

- "type" = "full": フル更新であることを示します（デフォルト）
- "timeout" = "3600": タスクタイムアウト期間。デフォルトは1日。秒単位。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：
| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | この操作はLOAD_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 使用上の注意

- OLAP型テーブルのバックアップのみがサポートされています。
- 同一データベース下では、1つのバックアップ操作のみが実行できます。
- バックアップ操作は、指定されたテーブルまたはパーティションの基底テーブルと[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)をバックアップし、1つのレプリカのみがバックアップされます。[非同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/async-materialized-view/overview.md)はサポートされていません。
- バックアップ操作の効率：バックアップ操作の効率は、データ量、Compute Nodeの数、ファイル数に依存します。バックアップデータシャードが配置されている各Compute Nodeは、バックアップ操作のアップロード段階に参加します。ノード数が多いほど、アップロード効率が高くなります。ファイルデータ量は、シャード数とシャード内のファイル数のみを指します。シャードが多い場合、またはシャード内に小さなファイルが多い場合、バックアップ操作時間が増加する可能性があります。

## 例

1. example_db下のテーブルexample_tblをウェアハウスexample_repoへフルバックアップ：

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```
2. フルバックアップの下で、example_db、テーブル example_tbl の p1、p2 パーティション、およびテーブル example_tbl2 をウェアハウス example_repo に：

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```
3. example_db配下のテーブルexample_tblを除く全テーブルのフルバックアップをウェアハウスexample_repoに実行:

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```
4. example_db配下のテーブルを完全にリポジトリexample_repoにバックアップします：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```
