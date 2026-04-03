---
{
  "title": "YEARWEEK",
  "language": "ja",
  "description": "日付の年と週を返します。mode引数の値はデフォルトで0です。日付の週が前年に属する場合、"
}
---
## yearweek
### 説明
#### 構文

`INT YEARWEEK(DATE date[, INT mode])`

日付の年と週を返します。mode引数の値はデフォルトで0です。
日付の週が前年に属する場合、前年の年と週が返されます。
日付の週が翌年に属する場合、翌年の年が返され、週は1になります。

以下の表は、mode引数の動作を説明しています。

|Mode |週の最初の日      |範囲    |第1週は以下を含む最初の週…     |
|:----|:-----------------|:-------|:-----------------------------|
|0    |Sunday            |1-53    |with a Sunday in this year    |
|1    |Monday            |1-53    |with 4 or more days this year |
|2    |Sunday            |1-53    |with a Sunday in this year    |
|3    |Monday            |1-53    |with 4 or more days this year |
|4    |Sunday            |1-53    |with 4 or more days this year |
|5    |Monday            |1-53    |with a Monday in this year    |
|6    |Sunday            |1-53    |with 4 or more days this year |
|7    |Monday            |1-53    |with a Monday in this year    |

パラメータはDate型またはDatetime型です

### 例

```
mysql> select yearweek('2021-1-1');
+----------------------+
| yearweek('2021-1-1') |
+----------------------+
|               202052 |
+----------------------+
```
```
mysql> select yearweek('2020-7-1');
+----------------------+
| yearweek('2020-7-1') |
+----------------------+
|               202026 |
+----------------------+
```
```
mysql> select yearweek('2024-12-30',1);
+------------------------------------+
| yearweek('2024-12-30 00:00:00', 1) |
+------------------------------------+
|                             202501 |
+------------------------------------+
```
### キーワード
    YEARWEEK
