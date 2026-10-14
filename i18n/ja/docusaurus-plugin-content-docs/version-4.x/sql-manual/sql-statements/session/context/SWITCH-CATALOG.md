---
{
    "title": "SWITCH CATALOG",
    "language": "ja",
    "description": "使用するカタログを切り替えます。"
}
---

## 説明

使用するカタログを切り替えます。

## 構文

```sql
SWITCH <catalog_name>
```

## 必須パラメータ

**1. `<catalog_name>`**
> 切り替え先のカタログ名。

## 必要な権限

| 権限  | 対象     | 説明                                  |
|------------|------------|----------------------------------------|
| SELECT_PRIV  | Catalog    | 切り替え先のカタログに対する SELECT_PRIV 権限が必要です。 |

## 例

1. カタログ `hive` に切り替えます

   ```sql
   SWITCH hive;
   ```
