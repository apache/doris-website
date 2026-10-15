---
{
    "title": "ALTER TABLE COMMENT",
    "language": "ja",
    "description": "このステートメントは、既存のテーブルのコメントを変更するために使用します。操作は同期的に実行され、コマンドが返った時点で処理は完了しています。"
}
---

## 説明

このステートメントは、既存のテーブルのコメントを変更するために使用します。操作は同期的に実行され、コマンドが返った時点で処理は完了しています。

## 構文

```sql
ALTER TABLE [database.]table alter_clause;
```

1. テーブルのコメントを変更する

## 構文

```sql
MODIFY COMMENT "new table comment";
```

2. 列のコメントを変更する

## 構文

```sql
MODIFY COLUMN col1 COMMENT "new column comment";
```

## 例

1. table1 のコメントを table1_comment に変更する

```sql
ALTER TABLE table1 MODIFY COMMENT "table1_comment";
```

2. table1 の col1 列のコメントを table1_comment に変更する

```sql
ALTER TABLE table1 MODIFY COLUMN col1 COMMENT "table1_col1_comment";
```

## キーワード

```text
ALTER, TABLE, COMMENT, ALTER TABLE
```

## ベストプラクティス
