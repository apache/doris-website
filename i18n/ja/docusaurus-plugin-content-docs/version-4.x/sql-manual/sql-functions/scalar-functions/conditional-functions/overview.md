---
{
    "title": "条件関数の概要",
    "language": "ja",
    "description": "条件関数は、SQL クエリで条件分岐を行うための組み込み関数です。"
}
---

# 条件関数の概要

条件関数は、SQL クエリで条件分岐を行うための組み込み関数です。指定した条件に応じて値を選択し、NULL を処理し、CASE 式のような分岐を実行できます。

## ベクトル化実行と条件関数

Doris はベクトル化実行エンジンです。一方、条件関数が直感に反する動作をする場合があります。

次の例を見てください。

```sql
mysql> set enable_strict_cast = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Value 128 out of range for type tinyint
```

この例では、`tinyint` への変換を `number < 128` の場合にだけ `if` 関数で行っていても、エラーが発生します。これは、`if(cond, colA, colB)` のような条件関数が従来、次の順序で実行されていたためです。

1. まず `colA` と `colB` の両方をすべて計算します
2. 次に `cond` の値に応じた結果を選択して返します

そのため、`colA` の値が実際には使われなくても、`colA` はすべて計算されるため、エラーが発生します。

`if`、`ifnull`、`case`、`coalesce` も同様に動作します。

`LEAST` のような関数は、値の比較にすべてのパラメータを計算する必要があるため、この問題は生じません。

## 短絡評価

Doris 4.0.4 では、条件関数の実行ロジックを改善し、短絡評価を可能にしました。

```sql
mysql> set short_circuit_evaluation = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
+--------------------------------------------------------------------------+
| count(if(number < 128, cast(number as tinyint), cast(number as String))) |
+--------------------------------------------------------------------------+
|                                                                      300 |
+--------------------------------------------------------------------------+
```

短絡評価を有効にすると、`if`、`ifnull`、`case`、`coalesce` などは多くの場面で不要な計算を避けられます。これにより、エラーを防ぎ、性能を改善できます。

### 短絡評価の有効化

短絡評価を有効にするには、次のセッション変数を設定します。

```sql
SET short_circuit_evaluation = true;
```

### 短絡評価の利点

1. **エラーの防止**: 条件によって選択されない分岐で、エラーを起こす処理を実行しません
2. **性能の向上**: 必要な分岐のみを評価し、不要な計算を減らします
3. **直感的な動作**: 条件関数が一般的なプログラミング言語の条件分岐に近い動作になります

## 主な条件関数

短絡評価の効果を得られる主な条件関数は次のとおりです。

- `IF`: 条件に応じて二つの値のどちらかを返します
- `IFNULL`: 最初の引数が NULL でなければその値を、NULL なら次の引数を返します
- `CASE`: switch-case 文のように複数の条件分岐を提供します
- `COALESCE`: 引数のリストから最初の NULL でない値を返します
- `NULLIF`: 二つの引数が等しければ NULL を、異なれば最初の引数を返します

各関数の詳細については、それぞれのドキュメントを参照してください。
