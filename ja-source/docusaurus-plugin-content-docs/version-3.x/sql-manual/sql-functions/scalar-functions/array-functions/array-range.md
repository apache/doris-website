---
{
  "title": "ARRAY_RANGE",
  "language": "ja"
}
---
## デスクリプション

1. int配列を生成する
2. 日付と時刻の配列を生成する

## Aliases

- SEQUENCE

## Syntax

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end>)
ARRAY_RANGE(<start>, <end>, <step>)
ARRAY_RANGE(<start_datetime>, <end_datetime>)
ARRAY_RANGE(<start_datetime>, <end_datetime>, INTERVAL <interval_step> <unit>)
```
## パラメータ

| Parameter | デスクリプション |
|--|--|
| `<start>` | 開始値は正の整数、デフォルト値は0 |
| `<end>` | 終了値、正の整数 |
| `<step>` | ステップサイズ、正の整数、デフォルトは1 |
| `<start_datetime>` | 開始日、datetimev2型 |
| `<end_datetime>` | 終了日、datetimev2型 |
| `<interval_step>` | 間隔値、デフォルトは1 |
| `<unit>` | 間隔単位、year/quarter/month/week/day/hour/minute/secondをサポート、デフォルトはday |

:::tip 
quarterはバージョン3.0.8および3.1.0以降でサポートされています。
:::

## 戻り値

1. startからend - 1までのstepのステップ長を持つ配列を返します。第三引数stepが負の値またはゼロの場合、関数の結果はNULLになります
2. start_datetimeと最も近いend_datetime（Interval_step UNITで計算）間のdatetimev2の配列を返します。第三引数interval_stepが負の値またはゼロの場合、関数の結果はNULLになります

## 例

```sql
SELECT ARRAY_RANGE(0,20,2),ARRAY_RANGE(cast('2019-05-15 12:00:00' as datetimev2(0)), cast('2022-05-17 12:00:00' as datetimev2(0)), interval 2 year);
```
```text
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| array_range(0, 20, 2)               | array_range_year_unit(cast('2019-05-15 12:00:00' as DATETIMEV2(0)), cast('2022-05-17 12:00:00' as DATETIMEV2(0)), 2) |
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| [0, 2, 4, 6, 8, 10, 12, 14, 16, 18] | ["2019-05-15 12:00:00", "2021-05-15 12:00:00"]                                                                       |
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
```
