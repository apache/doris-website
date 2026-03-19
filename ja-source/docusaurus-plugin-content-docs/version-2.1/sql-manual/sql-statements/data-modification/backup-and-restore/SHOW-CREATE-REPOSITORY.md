---
{
  "title": "SHOW CREATE REPOSITORY",
  "language": "ja",
  "description": "このステートメントは、リポジトリの作成ステートメントを実演するために使用されます。"
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

指定されたリポジトリの作成ステートメントを表示する

```sql
SHOW CREATE REPOSITORY for test_repository;
```
