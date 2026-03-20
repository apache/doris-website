---
{
  "title": "MINUTE_FLOOR",
  "description": "日時値を指定された分間隔の最も近い値に切り下げます。開始時刻（origin）が提供された場合、",
  "language": "ja"
}
---
## 説明

datetime値を指定された分間隔の最も近い値に切り捨てます。開始時刻（origin）が提供された場合、その時刻を間隔計算の基準として使用します。

## 構文

```sql
MINUTE_FLOOR(<datetime>)
MINUTE_FLOOR(<datetime>, <origin>)
MINUTE_FLOOR(<datetime>, <period>)
MINUTE_FLOOR(<datetime>, <period>, <origin>)
```
## パラメータ

| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | 切り下げる日時値。DATETIME型またはDATETIMEV2型 |
| `<period>`    | 分単位の間隔値。INT型で、各間隔の分数を表す |
| `<origin>`    | 間隔の開始点。DATETIME型またはDATETIMEV2型。デフォルトは0001-01-01 00:00:00 |

## Return Value

切り下げられた日時値を表すDATETIMEV2型の値を返します。

## Example

```sql
SELECT MINUTE_FLOOR("2023-07-13 22:28:18", 5);
```
```text
+---------------------------------------------------------------+
| minute_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+---------------------------------------------------------------+
| 2023-07-13 22:25:00                                           |
+---------------------------------------------------------------+
```
**注意:**
- 期間が指定されていない場合、デフォルトで1分間隔になります。
- 期間は正の整数である必要があります。
- 結果は常に過去の時刻に切り下げられます。
- MINUTE_CEILとは異なり、MINUTE_FLOORは常に間隔を超える部分を破棄します。

## ベストプラクティス

[date_floor](./date-floor)も参照してください
