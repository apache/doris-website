---
{
    "title": "SHOW STREAMS",
    "language": "ja",
    "description": "データベース内のテーブルストリームを一覧表示します。"
}
---

## 説明

現在のデータベースまたは指定したデータベース内のテーブルストリームを一覧表示します。ユーザーが SHOW 権限を持つストリームのみが表示されます。各ストリームの種類、ベーステーブル、状態は [information_schema.table_streams](../../../../admin-manual/system-tables/information_schema/table_streams) で確認できます。

## 構文

```sql
SHOW STREAMS [{FROM | IN} <db_name>] [LIKE '<pattern>' | WHERE <expr>]
```

## オプションのパラメータ

**1. `<db_name>`**
> データベース名。省略した場合は現在のデータベースが使用されます。

**2. `LIKE '<pattern>'`**
> `SHOW TABLES LIKE` と同じ構文のパターンを使用して、ストリーム名を照合します。

**3. `WHERE <expr>`**
> `SHOW TABLES WHERE` と同じ構文の条件を使用して絞り込みます。

## 戻り値

| 列 | 説明 |
|---|---|
| `Tables_in_<db_name>` | ストリーム名 |

## アクセス権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| SHOW_PRIV | ストリーム | この権限を持つストリームのみが一覧表示されます |

## 例

```sql
SHOW STREAMS;
```

```text
+----------------+
| Tables_in_demo |
+----------------+
| orders_stream  |
| events_stream  |
+----------------+
```

```sql
SHOW STREAMS FROM demo LIKE 'orders%';
```
