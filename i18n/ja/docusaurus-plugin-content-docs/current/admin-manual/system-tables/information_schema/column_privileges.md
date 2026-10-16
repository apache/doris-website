---
{
    "title": "カラム権限",
    "language": "ja",
    "description": "このテーブルは MySQL との互換性のためだけに使用され、常に空です。"
}
---

## 概要

このテーブルは MySQL との互換性のためだけに使用され、常に空です。Doris のカラム権限情報を実際に反映するものではありません。

## データベース

```
information_schema
```

## テーブル情報

| カラム名       | 型           | 説明 |
| -------------- | ------------ | ---- |
| GRANTEE        | varchar(128) |      |
| TABLE_CATALOG  | varchar(512) |      |
| TABLE_SCHEMA   | varchar(64)  |      |
| TABLE_NAME     | varchar(64)  |      |
| COLUMN_NAME    | varchar(64)  |      |
| PRIVILEGE_TYPE | varchar(64)  |      |
| IS_GRANTABLE   | varchar(3)   |      |
