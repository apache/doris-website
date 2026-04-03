---
{
  "title": "YEARWEEK",
  "description": "日付の年と週を返します。mode引数の値はデフォルトで0です。日付の週が前年に属する場合、",
  "language": "ja"
}
---
## yearweek
### 説明
#### 構文

`INT YEARWEEK(DATE date[, INT mode])`

日付の年と週を返します。mode引数の値はデフォルトで0です。
日付の週が前年に属する場合は前年の年と週が返され、日付の週が翌年に属する場合は翌年の年が返され週は1になります。

以下の表はmode引数の動作を説明します。

|Mode |週の最初の日      |範囲    |週1は最初の週…                |
|:----|:----------------|:-------|:----------------------------|
|0    |Sunday           |1-53    |with a Sunday in this year   |
|1    |Monday           |1-53    |with 4 or more days this year|
|2    |Sunday           |1-53    |with a Sunday in this year   |
|3    |Monday           |1-53    |with 4 or more days this year|
|4    |Sunday           |1-53    |with 4 or more days this year|
|5    |Monday           |1-53    |with a Monday in this year   |
|6    |Sunday           |1-53    |with 4 or more days this year|
|7    |Monday           |1-53    |with a Monday in this year   |

パラメータはDateまたはDatetime型です

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
### keywords
    YEARWEEK
