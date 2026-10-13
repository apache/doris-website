---
{
    "title": "MAP_CONTAINS_KEY",
    "language": "ja",
    "description": "指定した Map に特定のキーが含まれるかを判定します。"
}
---

## 説明

指定した `map` に特定のキー `key` が含まれるかを判定します。

## 構文

```sql
MAP_CONTAINS_KEY(<map>, <key>)
```

## パラメータ
- `<map>`: [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型。入力する Map の内容。
- `<key>`: [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) でサポートされるキー型。検索するキー。

## 戻り値
指定した `map` に特定のキー `key` が含まれるかを判定し、含まれる場合は 1、含まれない場合は 0 を返します。

## 使用例

```sql
select map_contains_key(map(null, 1, 2, null), null),map_contains_key(map(1, "100", 0.1, 2), 0.11);
```

```text
+-----------------------------------------------+-----------------------------------------------+
| map_contains_key(map(null, 1, 2, null), null) | map_contains_key(map(1, "100", 0.1, 2), 0.11) |
+-----------------------------------------------+-----------------------------------------------+
|                                             1 |                                             0 |
+-----------------------------------------------+-----------------------------------------------+
```
> Map のキー比較には「NULL セーフな等値比較」を使用します (NULL 同士を等しいとみなします)。

```sql
select map_contains_key(map(null,1), null);
```
```text
+-------------------------------------+
| map_contains_key(map(null,1), null) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+