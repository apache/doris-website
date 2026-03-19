---
{
  "title": "TIME | 日付時間関数",
  "sidebar_label": "TIME",
  "description": "TIME関数はDatetime値の時刻部分を取得します。",
  "language": "ja"
}
---
# TIME

## デスクリプション
`TIME`関数はDatetime値の`time`部分を取得します。

## Syntax

```sql
TIME(<datetime>)
```
## パラメータ

| Parameter      | デスクリプション           |
|----------------|-----------------------|
| `<datetime>`   | datetime値。   |

## Return Value
`TIME`型の値を返します

## Example

```sql
SELECT TIME('2025-1-1 12:12:12');
```
```text
mysql> 
+---------------------------+
| time('2025-1-1 12:12:12') |
+---------------------------+
| 12:12:12                  |
+---------------------------+
```
