---
{
  "title": "EXPLODE",
  "description": "explode関数は配列を入力として受け取り、配列の各要素を個別の行にマップします。",
  "language": "ja"
}
---
## 説明

`explode`関数は配列を入力として受け取り、配列の各要素を個別の行にマップします。通常、ネストされたデータ構造を標準的な表形式にフラット化するためにLATERAL VIEWと組み合わせて使用されます。explodeと`explode_outer`の主な違いは、空の値の処理方法にあります。

## 構文

```sql
EXPLODE(<array>)
EXPLODE_OUTER(<array>)
```
## 必須パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<arr>` | 	配列型 |

## 戻り値

配列が空でないまたはNULLでない場合、`explode`と`explode_outer`の戻り値は同じです。

データが空またはNULLの場合：

`explode`は行を生成せず、これらのレコードをフィルタアウトします。

`explode_outer`は配列が空の場合、単一の行を生成しますが、展開された列の値はNULLになります。配列がNULLの場合も、行を保持してNULLを返します。

## 例

```
select e1 from (select 1 k1) as t lateral view explode([1,2,3]) tmp1 as e1;
```
```text
+------+
| e1   |
+------+
|    1 |
|    2 |
|    3 |
+------+
```
```sql
select e1 from (select 1 k1) as t lateral view explode_outer(null) tmp1 as e1;
```
``` text
+------+
| e1   |
+------+
| NULL |
+------+
```
```sql
select e1 from (select 1 k1) as t lateral view explode([]) tmp1 as e1;
Empty set (0.010 sec)
```
```sql
select e1 from (select 1 k1) as t lateral view explode([null,1,null]) tmp1 as e1;
```
```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```
```sql
select e1 from (select 1 k1) as t lateral view explode_outer([null,1,null]) tmp1 as e1;
```
```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```
