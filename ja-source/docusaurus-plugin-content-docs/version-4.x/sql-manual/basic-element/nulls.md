---
{
  "title": "NULL",
  "description": "行内のカラムに値がない場合、そのカラムはNULLであると言われます。NULLは\"NOT NULL\"制約によって制限されていない任意のカラムに現れることができます。",
  "language": "ja"
}
---
## NULLの基本概念

行の列に値が存在しない場合、その列はNULLであると言われます。NULLは「NOT NULL」制約によって制限されていない任意の列に出現できます。実際の値が不明な場合や値に意味がない場合にNULLを使用してください。

数値のゼロや空文字列を表現するためにNULLを使用しないでください。これらは等価ではありません。

NULLを含む算術式は常にNULLになります。例えば、NULLに10を加算してもNULLのままです。実際、NULLがオペランドとして与えられた場合、すべての演算子はNULLを返します。

## 関数の引数としてのNULL

引数としてNULLが提供された場合、ほとんどの集約関数はNULLを返します。NULL値が発生した場合に値を返すためにIFNULL関数を使用できます。例えば、式IFNULL(arg, 0)は、argがNULLの場合は0を返し、argがNULLでない場合はその値を返します。各関数の具体的な動作については、「Functions」セクションを参照してください。

## NULLと比較演算子

NULLの結果をテストするには、比較条件IS NULLおよびIS NOT NULLのみを使用できます。NULLに依存する条件が使用された場合、結果はUNKNOWNになります。NULLは欠損データを表すため、NULLは任意の値や他のNULLと等しいことも等しくないこともありえません。

比較可能なシナリオ（内部の値がNULLである入れ子型の比較など）では、NULLは常に現在の型で表現できる任意の値よりも小さいとみなされます。つまり、自分自身を除く任意の値よりも小さいということです：

```sql
select array(null) < array(-1), array(null) > array(-1);
+-------------------------+-------------------------+
| array(null) < array(-1) | array(null) > array(-1) |
+-------------------------+-------------------------+
|                       1 |                       0 |
+-------------------------+-------------------------+

select array(cast("nan" as double)) > array(null);
+--------------------------------------------+
| array(cast("nan" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+

select array(cast("inf" as double)) > array(null);
+--------------------------------------------+
| array(cast("inf" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
## 条件におけるNULL

UNKNOWNと評価される条件は、FALSEとほぼ同じように動作します。例えば、WHERE句でUNKNOWNと評価される条件を持つSELECT文は、行を返しません。しかし、UNKNOWNと評価される条件とFALSEとの違いは、UNKNOWN条件の評価結果に対するさらなる操作も、UNKNOWNとして評価されることです。したがって、NOT FALSEの計算結果はTRUEですが、NOT UNKNOWNの計算結果はUNKNOWNです。

下の表は、条件におけるNULLを含む様々な評価の例を示しています。UNKNOWNと評価される条件がSELECT文のWHERE句で使用された場合、クエリは行を返しません。

| **Condition**   | **Value of A** | **Evaluation** |
| :-------------- | :------------- | :------------- |
| `a IS NULL`     | `10`           | `FALSE`        |
| `a IS NOT NULL` | `10`           | `TRUE`         |
| `a IS NULL`     | `NULL`         | `TRUE`         |
| `a IS NOT NULL` | `NULL`         | `FALSE`        |
| `a = NULL`      | `10`           | `UNKNOWN`      |
| `a != NULL`     | `10`           | `UNKNOWN`      |
| `a = NULL`      | `NULL`         | `UNKNOWN`      |
| `a != NULL`     | `NULL`         | `UNKNOWN`      |
| `a = 10`        | `NULL`         | `UNKNOWN`      |
| `a != 10`       | `NULL`         | `UNKNOWN`      |
