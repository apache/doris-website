---
{
  "title": "column_privileges",
  "language": "ja",
  "description": "このテーブルはMySQLの動作との互換性のためにのみ使用され、常に空です。"
}
---
## 概要

このテーブルはMySQLの動作との互換性のためだけに使用されており、常に空です。Dorisの列権限情報を真に反映するものではありません。

## Database

```
information_schema
```
## テーブル情報

| Column Name    | Type         | Description |
| -------------- | ------------ | ----------- |
| GRANTEE        | varchar(128) |             |
| TABLE_CATALOG  | varchar(512) |             |
| TABLE_SCHEMA   | varchar(64)  |             |
| TABLE_NAME     | varchar(64)  |             |
| COLUMN_NAME    | varchar(64)  |             |
| PRIVILEGE_TYPE | varchar(64)  |             |
| IS_GRANTABLE   | varchar(3)   |             |
