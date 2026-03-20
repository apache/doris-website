---
{
  "title": "SET TABLE STATUS",
  "description": "SET TABLE STATUS文は、OLAPTableのステータスを手動で設定するために使用されます。この文には以下の機能があります：",
  "language": "ja"
}
---
## 説明

`SET TABLE STATUS`文は、OLAPTableのステータスを手動で設定するために使用されます。この文には以下の機能があります：

- OLAPTableのステータス設定のみをサポートします。
- tableステータスを指定されたターゲット状態に変更できます。
- tableステータスによって引き起こされるタスクブロッキングを解決するために使用されます。

**サポートされる状態**：

| 状態              | 説明                          |
|-------------------|--------------------------------------|
| NORMAL            | tableが正常な状態にあることを示します。 |
| ROLLUP            | tableがROLLUP操作を実行中であることを示します。 |
| SCHEMA_CHANGE     | tableがスキーマ変更を実行中であることを示します。 |
| BACKUP            | tableがバックアップ操作を実行中であることを示します。 |
| RESTORE           | tableがリストア操作を実行中であることを示します。 |
| WAITING_STABLE    | tableが安定状態を待機中であることを示します。 |

## 構文

```sql
ADMIN SET TABLE <table_name> STATUS PROPERTIES ("<key>" = "<value>" [, ...]);
```
どこで：

```sql
<key>
  : "state"

<value>
  : "NORMAL"
  | "ROLLUP"
  | "SCHEMA_CHANGE"
  | "BACKUP"
  | "RESTORE"
  | "WAITING_STABLE"
```
## 必須パラメータ

**1. `<table_name>`**

> ステータスを設定する必要があるTableの名前を指定します。
>
> Table名はそのデータベース内で一意である必要があります。

**2. `PROPERTIES ("state" = "<value>")`**

> Tableの対象ステータスを指定します。
>
> "state" プロパティは設定する必要があり、その値はサポートされている状態のいずれかである必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限       | オブジェクト      | 備考                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | システム      | このコマンドを実行するには、ユーザーはADMIN権限を持つ必要があります。 |

## 使用上の注意

- このコマンドは緊急時の障害復旧を目的としており、注意して使用してください。
- OLAPTableのみをサポートし、他の種類のTableはサポートしません。
- Tableが既に対象の状態にある場合、このコマンドは無視されます。
- 不適切な状態設定はシステム異常を引き起こす可能性があります。技術サポートの指導の下でこのコマンドを使用することを推奨します。
- ステータス変更後は、システムの動作状況を速やかに監視することをお勧めします。

## 例

- TableステータスをNORMALに設定する：

    ```sql
    ADMIN SET TABLE tbl1 STATUS PROPERTIES("state" = "NORMAL");
    ```
- TableのステータスをSCHEMA_CHANGEに設定します:

    ```sql
    ADMIN SET TABLE tbl2 STATUS PROPERTIES("state" = "SCHEMA_CHANGE");
    ```
