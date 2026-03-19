---
{
  "title": "MONTHNAME",
  "description": "指定された日付に対応する月の英語名を返します。",
  "language": "ja"
}
---
## デスクリプション

指定された日付に対応する月の英語名を返します。返される値は月の完全な英語名です（January から December まで）。

## Syntax

```sql
MONTHNAME(<date>)
```
## パラメータ

| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<date>`  | 入力される日時値で、DATE、DATETIME、またはDATETIMEV2型を指定できます |

## Return Value

月の英語名を表すVARCHAR型の値を返します：
- 戻り値の候補: January, February, March, April, May, June, July, August, September, October, November, December
- 入力がNULLの場合、関数はNULLを返します。
- 戻り値の最初の文字は大文字で、残りの文字は小文字です。

## Example

```sql
SELECT MONTHNAME('2008-02-03 00:00:00');
```
```text
+---------------------------------------------------------+
| monthname(cast('2008-02-03 00:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------+
| February                                                |
+---------------------------------------------------------+
```
