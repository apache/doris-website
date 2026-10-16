---
{
    "title": "DROP CATALOG",
    "language": "ja",
    "description": "外部カタログを削除します。"
}
---

## 説明

外部カタログを削除します。

## 構文

```sql
DROP CATALOG [IF EXISTS] <catalog_name>;
```

## 必須パラメータ

**1. `<catalog_name>`**
削除するカタログの名前。

## 必要な権限
| 権限      | 対象       | 説明                                             |
|:----------|:-----------|:-------------------------------------------------|
| DROP_PRIV | カタログ   | 対象のカタログに対する DROP_PRIV 権限が必要です。 |


## 例

1. カタログ hive を削除します

   ```sql
   DROP CATALOG hive;
   ```
