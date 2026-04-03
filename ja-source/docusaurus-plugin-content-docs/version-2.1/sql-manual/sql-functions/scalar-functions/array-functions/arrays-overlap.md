---
{
  "title": "ARRAYS_OVERLAP",
  "language": "ja",
  "description": "左と右の配列に共通の要素が含まれているかを判定する"
}
---
## 説明

左と右の配列に共通の要素が含まれているかどうかを判定する

## 構文

```sql
ARRAYS_OVERLAP(<left>, <right>)
```
## Parameters

| Parameter | Description |
|--|--|
| `<left>` | 判定対象の配列 |
| `<right>` | 判定対象の配列 |

## Return Value

判定結果を返す：1：leftとrightの配列に共通要素がある；0：leftとrightの配列に共通要素がない；NULL：leftまたはrightの配列がNULL；またはleftとrightの配列のいずれかの要素がNULL

## Example

```sql
SELECT ARRAYS_OVERLAP(['a', 'b', 'c'], [1, 2, 'b']);
```
```text
+--------------------------------------------------+
| arrays_overlap(['a', 'b', 'c'], ['1', '2', 'b']) |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```
