---
{
  "title": "SHOW CREATE REPOSITORY",
  "description": "この文は、リポジトリの作成文を実演するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、リポジトリの作成ステートメントを実演するために使用されます。

## Syntax

```sql
SHOW CREATE REPOSITORY for <repo_name>;
```
## Required パラメータ
**<repo_name>**
> リポジトリの一意な名前。

## Examples

指定されたリポジトリの作成ステートメントを表示する

```sql
SHOW CREATE REPOSITORY for test_repository;
```
