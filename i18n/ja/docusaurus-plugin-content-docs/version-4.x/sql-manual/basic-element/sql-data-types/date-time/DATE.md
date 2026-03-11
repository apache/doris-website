---
{
  "title": "DATE | 日付時刻",
  "sidebar_label": "DATE",
  "description": "DATE型は日付を格納し、値の範囲は[0000-01-01, 9999-12-31]で、デフォルトの出力形式は'yyyy-MM-dd'です。",
  "language": "ja"
}
---
# DATE

## 説明

DATEタイプは日付を格納し、値の範囲は`[0000-01-01, 9999-12-31]`で、デフォルトの出力フォーマットは'yyyy-MM-dd'です。

DorisはGregorian calendarの日付フォーマットを使用し、Gregorian calendarに存在する日付はDorisに存在する日付と1対1で対応します。ここで`0000`は紀元前1年（BCE 1）を表します。

DATEタイプはプライマリキー、パーティションカラム、またはバケットカラムとして使用できます。DATEタイプのフィールドは実際にDorisで4バイトを占有します。DATEは実行時に年、月、日で個別に格納されるため、DATEカラムに対する`months_add`操作の実行は`unix_timestamp`よりも効率的です。

他のタイプをDATEに変換する方法と変換時に受け入れられる入力については、[Cast to DATE](../conversion/date-conversion.md)を参照してください。

日付と時刻のタイプは、算術演算での数学演算子の直接使用をサポートしていません。数学演算を実行する本質は、まず日付と時刻のタイプを数値タイプに暗黙的に変換してから演算を実行することです。時刻タイプに対して加算、減算、または丸めを実行する必要がある場合は、[DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md)、[DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md)、[TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md)、[DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md)などの関数の使用を検討してください。

TIMEタイプはタイムゾーンを格納せず、つまり、セッション変数`time_zone`の変更はTIMEタイプの格納された値に影響しません。

## 例

```sql
select cast('2020-01-02' as date);
```
```text
+----------------------------+
| cast('2020-01-02' as date) |
+----------------------------+
| 2020-01-02                 |
+----------------------------+
```
```sql
select cast('0120-02-29' as date);
```
```text
+----------------------------+
| cast('0120-02-29' as date) |
+----------------------------+
| 0120-02-29                 |
+----------------------------+
```
