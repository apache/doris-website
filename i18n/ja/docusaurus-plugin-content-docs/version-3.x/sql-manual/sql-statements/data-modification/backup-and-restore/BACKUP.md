---
{
  "title": "BACKUP",
  "description": "この文は、指定されたデータベース配下のデータをバックアップするために使用されます。このコマンドは非同期操作です。",
  "language": "ja"
}
---
## 説明

このステートメントは、指定されたデータベース下のデータをバックアップするために使用されます。このコマンドは非同期操作です。送信が成功した後、[SHOW BACKUP](./SHOW-BACKUP.md)コマンドを通じて進行状況を確認する必要があります。

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

バックアップするデータが属するデータベースの名前。

**2.`<snapshot_name>`**

データスナップショット名を指定します。スナップショット名は重複できず、グローバルに一意である必要があります。

**3.`<repository_name>`**

ウェアハウス名。リポジトリは[CREATE REPOSITORY](./CREATE-REPOSITORY.md)を通じて作成できます。

## オプションパラメータ

**1.`<table_name>`**

バックアップするTableの名前。指定されない場合、データベース全体がバックアップされます。

- ON句は、バックアップが必要なTableとパーティションを識別します。パーティションが指定されない場合、デフォルトでTableの全パーティションがバックアップされます
- バックアップが不要なTableとパーティションはEXCLUDE句で識別されます。指定されたTableまたはパーティション以外の、このデータベース内の全Tableの全パーティションデータをバックアップします。

**2.`<partition_name>`**

バックアップするパーティションの名前。指定されない場合、対応するTableの全パーティションがバックアップされます。

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

データスナップショット属性、形式：`<key>` = `<value>`、現在以下のプロパティをサポートしています：

- "type" = "full"：これが完全更新であることを示します（デフォルト）
- "timeout" = "3600"：タスクタイムアウト期間、デフォルトは1日。単位は秒。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持つ必要があります：
| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | この操作はLOAD_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 使用上の注意

- OLAP タイプのTableのバックアップのみサポートされています。
- 同一データベース下では一度に一つのバックアップ操作のみ実行できます。
- バックアップ操作は、指定されたTableまたはパーティションの基底Tableと同期マテリアライズドビューをバックアップし、一つのレプリカのみがバックアップされます。非同期マテリアライズドビューはサポートされていません。
- バックアップ操作の効率性：バックアップ操作の効率性は、データ量、Compute Nodeの数、ファイル数に依存します。バックアップデータシャードが配置されている各Compute Nodeは、バックアップ操作のアップロードフェーズに参加します。ノード数が多いほど、アップロード効率は高くなります。ファイルデータ量は、シャード数と各シャード内のファイル数のみを指します。シャードが多い場合、またはシャード内に小さなファイルが多い場合、バックアップ操作時間が延長される可能性があります。

## 例

1. example_db下のTableexample_tblをウェアハウスexample_repoに完全バックアップ：

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```
2. フルバックアップの下で、example_db、Tableexample_tblのp1、p2パーティション、およびTableexample_tbl2をウェアハウスexample_repoに：

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```
3. example_db配下のtable example_tblを除く全Tableのフルバックアップをwarehouse example_repoに実行：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```
4. example_db 配下のTableを example_repo リポジトリに完全バックアップする：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```
