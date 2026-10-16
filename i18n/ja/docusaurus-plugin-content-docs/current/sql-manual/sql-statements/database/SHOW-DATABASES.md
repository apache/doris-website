---
{
    "title": "SHOW DATABASES",
    "language": "ja",
    "description": "このステートメントは、現在参照できるデータベースを表示します。"
}
---

## 説明

このステートメントは、現在参照できるデータベースを表示します。

## 構文

```sql
SHOW DATABASES [FROM <catalog>] [<filter_expr>];
```

## 省略可能なパラメータ

** 1. `<catalog>`**
>  対象のカタログ

** 2. `<filter_expr>`**
>  指定した条件でデータベースを絞り込みます

## 戻り値

| 列 | 説明 |
|:---------|:-----------|
| Database |  データベース名 |

## 権限制御

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限         | 対象    | 備考             |
|:-----------|:------|:---------------|
| SELECT_PRIV | 対象のデータベース | 対象のデータベースに対する読み取り権限が必要です |

## 例

- 現在のすべてのデータベース名を表示します。

   ```sql
   SHOW DATABASES;
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | test               |
   | information_schema |
   +--------------------+
   ```

- `hms_catalog` 内のすべてのデータベース名を表示します。

   ```sql
   SHOW DATABASES FROM hms_catalog;
   ```

   ```text
   +---------------+
   | Database      |
   +---------------+
   | default       |
   | tpch          |
   +---------------+
   ```

- 式 `like 'infor%'` で絞り込んだデータベース名を表示します。

   ```sql
   SHOW DATABASES like 'infor%';
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | information_schema |
   +--------------------+
   ```
