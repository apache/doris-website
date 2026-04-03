---
{
  "title": "SHOW CREATE REPOSITORY",
  "language": "ja",
  "description": "この文は、リポジトリの作成文を実演するために使用されます。"
}
---
## 説明

このステートメントは、リポジトリの作成ステートメントを実演するために使用されます。

## 構文

```sql
SHOW CREATE REPOSITORY for <repo_name>;
```
## 必須パラメータ
**<repo_name>**
> リポジトリの一意な名前。

## 例

指定されたリポジトリの作成文を表示する

```sql
SHOW CREATE REPOSITORY for test_repository;
```
