---
{
  "title": "EXPLODE_NUMBERS",
  "language": "ja",
  "description": "explodenumbers テーブル関数は整数 n を受け取り、範囲内のすべての数値を複数の行に展開し、各行には単一の数値が含まれます。"
}
---
## 説明

`explode_numbers`テーブル関数は整数nを受け取り、範囲内のすべての数値を複数の行に展開し、各行には単一の数値が含まれます。連続する数値のシーケンスを生成するために一般的に使用され、しばしばLATERAL VIEWと組み合わせて使用されます。

`explode_numbers_outer`は、`explode_numbers`とは異なり、テーブル関数が0行を生成する場合にNULL行を追加します。

## 構文

```sql
EXPLODE_NUMBERS(<n>)
EXPLODE_NUMBERS_OUTER(<n>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<n>` | Integer型の入力 |

## 戻り値

[0, n)の連続値を返します。

- nが0またはNULLの場合は行を返しません。

## 例

```sql
select e1 from (select 1 k1) as t lateral view explode_numbers(5) tmp1 as e1;
```
```text
+------+
| e1   |
+------+
|    0 |
|    1 |
|    2 |
|    3 |
|    4 |
+------+
```
```sql
select e1 from (select 1 k1) as t lateral view explode_numbers(0) tmp1 as e1;
Empty set
```
```sql
select e1 from (select 1 k1) as t lateral view explode_numbers_outer(0) tmp1 as e1;
```
```text
+------+
| e1   |
+------+
| NULL |
+------+
```
