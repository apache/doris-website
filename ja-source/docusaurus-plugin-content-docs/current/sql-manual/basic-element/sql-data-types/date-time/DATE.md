---
{
  "title": "日付 | 日付時刻",
  "language": "ja",
  "description": "DATE型は日付を格納し、値の範囲は[0000-01-01, 9999-12-31]で、デフォルトの出力フォーマットは'yyyy-MM-dd'です。",
  "sidebar_label": "DATE"
}
---
# DATE

## 説明

DATE型は日付を格納し、値の範囲は`[0000-01-01, 9999-12-31]`で、デフォルトの出力フォーマットは'yyyy-MM-dd'です。

Dorisはグレゴリオ暦の日付フォーマットを使用し、グレゴリオ暦に存在する日付はDorisに存在する日付と1対1で対応します。ここで`0000`は紀元前1年（BCE 1）を表します。

DATE型は主キー、パーティション列、またはバケット列として使用できます。DATE型のフィールドは実際にDorisで4バイトを占有します。DATEは実行時に年、月、日で個別に格納されるため、DATE列に対して`months_add`操作を実行することは`unix_timestamp`よりも効率的です。

他の型をDATEに変換する方法と変換時に受け入れられる入力については、[Cast to DATE](../conversion/date-conversion.md)を参照してください。

日付と時刻の型は、算術演算のための数学演算子の直接使用をサポートしていません。数学演算を実行する本質は、まず日付と時刻の型を数値型に暗黙的に変換し、その後演算を実行することです。時刻型に対して加算、減算、または丸めを実行する必要がある場合は、[DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md)、[DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md)、[TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md)、[DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md)などの関数の使用を検討してください。

TIME型はタイムゾーンを格納しません。つまり、セッション変数`time_zone`の変更はTIME型の格納値に影響しません。

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
