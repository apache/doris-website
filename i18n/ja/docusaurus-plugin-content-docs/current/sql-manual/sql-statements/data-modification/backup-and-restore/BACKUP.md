---
{
    "title": "BACKUP",
    "language": "ja",
    "description": "このステートメントは、指定したデータベース内のデータをバックアップするために使用します。このコマンドは非同期で実行されます。"
}
---

## 説明

このステートメントは、指定したデータベース内のデータをバックアップするために使用します。このコマンドは非同期で実行されます。送信後は、`SHOW BACKUP` コマンドで進行状況を確認できます。

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

バックアップ対象のデータが属するデータベース名。

**2.`<snapshot_name>`**

データスナップショットの名前を指定します。スナップショット名は重複できず、グローバルに一意である必要があります。

**3.`<repository_name>`**

リポジトリ名。[CREATE REPOSITORY](./CREATE-REPOSITORY.md) でリポジトリを作成できます。

## オプションパラメータ

**1.`<table_name>`**

バックアップするテーブルの名前。指定しない場合は、データベース全体をバックアップします。

- ON 句では、バックアップ対象のテーブルとパーティションを指定します。パーティションを指定しない場合は、デフォルトでそのテーブルのすべてのパーティションをバックアップします。
- EXCLUDE 句では、バックアップしないテーブルとパーティションを指定します。指定したテーブルまたはパーティションを除き、このデータベース内のすべてのテーブルのパーティションデータをバックアップします。

**2.`<partition_name>`**

バックアップするパーティションの名前。指定しない場合は、該当するテーブルのすべてのパーティションをバックアップします。

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

データスナップショットの属性。`<key>` = `<value>` の形式で指定します。現在、次のプロパティをサポートしています。

- "type" = "full": 全量更新であることを示します（デフォルト）。
- "timeout" = "3600": タスクのタイムアウト時間。単位は秒で、デフォルトは一日です。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。
| 権限     | オブジェクト    | 説明 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER または ROLE    | この操作は、LOAD_PRIV 権限を持つユーザーまたはロールのみ実行できます。 |

## 使用上の注意

- バックアップできるのは OLAP タイプのテーブルのみです。
- 同一データベースに対して実行できるバックアップ操作は一件のみです。
- バックアップ操作では、指定したテーブルまたはパーティションの基になるテーブルと[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)をバックアップします。バックアップされるレプリカは一つだけです。[非同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/async-materialized-view/overview.md)はサポートされません。
- バックアップ操作の効率: データ量、Compute Node の数、ファイル数によって異なります。バックアップ対象のデータシャードが配置されている各 Compute Node が、バックアップ操作のアップロード段階に参加します。ノード数が多いほど、アップロード効率は高くなります。ファイルデータ量とは、シャード数と各シャード内のファイル数のみを指します。シャードが多い場合や、シャード内に小さなファイルが多数ある場合は、バックアップ操作にかかる時間が長くなることがあります。

## 例

1. example_db 内のテーブル example_tbl を example_repo にフルバックアップします。

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```

2. example_db 内のテーブル example_tbl のパーティション p1、p2 と、テーブル example_tbl2 を example_repo にフルバックアップします。

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```

3. example_db 内のテーブル example_tbl を除くすべてのテーブルを example_repo にフルバックアップします。

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```

4. example_db 内のテーブルを example_repo にフルバックアップします。

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```
