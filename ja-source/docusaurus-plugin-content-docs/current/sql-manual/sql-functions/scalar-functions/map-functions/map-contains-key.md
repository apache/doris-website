---
{
  "title": "MAP_CONTAINS_KEY",
  "language": "ja",
  "description": "指定されたマップが特定のキーkeyを含んでいるかどうかを判定します"
}
---
## 説明

指定された`map`に特定のキー`key`が含まれているかどうかを判定します

## 構文

```sql
MAP_CONTAINS_KEY(<map>, <key>)
```
## パラメータ
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型、入力するmapの内容。
- `<key>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) でサポートされているKey型、検索対象のkey。

## 戻り値
指定された `map` が特定のkey `key` を含むかどうかを判定し、存在する場合は1を返し、存在しない場合は0を返します。

## 例

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
> Map におけるキーの比較では「null セーフな等価性」が使用され（null と null は等しいと見なされます）、これは

```sql
select map_contains_key(map(null,1), null);
```
```text
+-------------------------------------+
| map_contains_key(map(null,1), null) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
