---
{
    "title": "SHOW CREATE REPOSITORY",
    "language": "ja",
    "description": "このステートメントは、リポジトリの作成文を表示します。"
}
---

## 説明

このステートメントは、リポジトリの作成文を表示します。

## 構文

```sql
SHOW CREATE REPOSITORY for <repo_name>;
```

## 必須パラメータ
**<repo_name>**
> リポジトリの一意な名前です。

## 例

指定したリポジトリの作成文を表示します。

```sql
SHOW CREATE REPOSITORY for test_repository;
```
