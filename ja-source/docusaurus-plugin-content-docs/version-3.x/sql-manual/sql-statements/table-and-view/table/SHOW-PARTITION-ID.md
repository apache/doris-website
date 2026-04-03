---
{
  "title": "SHOW PARTITION ID",
  "description": "この文は、パーティションIDに基づいて対応するデータベース名、table名、およびパーティション名を見つけるために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、パーティションIDに基づいて対応するデータベース名、table名、およびパーティション名を検索するために使用されます。

## 構文

```sql
SHOW PARTITION <partition_id>
```
## 必須パラメータ

**1. `<partition_id>`**

> partition id

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege                  | Object | 注釈 |
|---------------------|----|----|
| ADMIN_PRIV |    |    |

## 例

1. パーティションIDに基づいて、対応するデータベース名、Table名、およびパーティション名を見つけるには。

    ```sql
    SHOW PARTITION 10002;
    ```
