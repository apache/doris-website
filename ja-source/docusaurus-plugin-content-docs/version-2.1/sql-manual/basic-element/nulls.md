---
{
  "title": "NULL",
  "language": "ja",
  "description": "行の列に値がない場合、それはNULLであると言われます。NULLは「NOT NULL」制約によって制限されていない任意の列に現れることができます。"
}
---
## NULLの基本紹介

行の列に値がない場合、それはNULLと言われます。NULLは"NOT NULL"制約によって制限されていない任意の列に現れることができます。実際の値が不明である場合や値に意味がない場合にNULLを使用してください。

数値のゼロや空文字列を表すためにNULLを使用しないでください。それらは等価ではありません。

NULLを含む任意の算術式は常にNULLという結果になります。例えば、NULLに10を加算してもやはりNULLという結果になります。実際、NULLがオペランドとして与えられた場合、すべての演算子はNULLを返します。

## 関数の引数としてのNULL

NULLが引数として提供された場合、ほとんどの集計関数はNULLを返します。NULL値が発生したときに値を返すためにIFNULL関数を使用できます。例えば、式IFNULL(arg, 0)はargがNULLの場合に0を返し、argがNULLでない場合にはその値を返します。各関数の具体的な動作については、「Functions」セクションを参照してください。

## NULLと比較演算子

NULL結果をテストするには、比較条件IS NULLとIS NOT NULLのみを使用できます。NULLに依存する条件が使用された場合、結果はUNKNOWNになります。NULLは欠損データを表すため、NULLは任意の値や別のNULLと等しいまたは等しくないということはできません。

## 条件でのNULL

UNKNOWNと評価される条件はFALSEとほぼ同じように動作します。例えば、WHERE句でUNKNOWNと評価される条件を持つSELECT文は行を返しません。しかし、UNKNOWNと評価される条件とFALSEの違いは、UNKNOWN条件の評価結果に対するさらなる操作もUNKNOWNと評価されることです。したがって、NOT FALSEの計算結果はTRUEですが、NOT UNKNOWNの計算結果はUNKNOWNです。

下の表は、条件でのNULLを含む様々な評価の例を示しています。UNKNOWNと評価される条件がSELECT文のWHERE句で使用された場合、そのクエリは行を返しません。

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
