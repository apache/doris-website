---
{
    "title": "エイリアス関数",
    "language": "ja",
    "description": "Apache Doris のエイリアス関数のガイド。関数や式の一部に新しいシグネチャを登録し、異種システムからの移行時の互換性を高めたり、複雑なクエリを簡素化したりする方法を説明します。",
    "keywords": [
        "Doris エイリアス関数",
        "エイリアス関数",
        "CREATE ALIAS FUNCTION",
        "SQL 関数の互換性",
        "ユーザー定義関数",
        "クエリの簡素化",
        "データベース移行"
    ]
}
---

<!-- Knowledge type: Capability definition / Use cases -->
<!-- Applicable scenarios: Heterogeneous database migration / Complex query simplification -->

エイリアス関数は、既存の関数や式の一部に新しいシグネチャを登録し、別の名前で呼び出せるようにします。エイリアス関数を使うと、異種データベースからクエリを移行する際に関数名の違いを吸収できます。また、複雑な式の一部を簡潔な関数呼び出しにまとめることもできます。

## 概念

エイリアス関数は、関数や式の一部に対してシステムに登録される新しいシグネチャです。エイリアスの呼び出しは、そのエイリアスが参照する基の式を呼び出すことと同じです。

ほかのユーザー定義関数と同様に、エイリアス関数には次の二種類のスコープがあります。

| スコープ | 登録範囲 | 呼び出し方法 |
| --- | --- | --- |
| `LOCAL` | 現在のデータベース | 別のデータベースから呼び出す場合は、完全修飾名 `<database name>.<function name>` を使用します |
| `GLOBAL` | グローバル | どのデータベースからでも関数名で直接呼び出せます |

## ユースケース

<!-- Knowledge type: Use cases -->

### シナリオ 1：異種データベースの移行時に関数にエイリアスを付ける

システムの移行時には、既存のクエリが別のデータベースシステムから来ている場合があります。こうしたクエリには、Doris の関数と同じ動作をしながら名前が異なる関数が含まれていることがよくあります。

移行元のデータベースの関数と同じ名前のエイリアス関数を Doris で定義すれば、SQL 文を一つずつ書き換えることなく、ユーザーに意識させずに移行できます。

### シナリオ 2：複雑なクエリを簡素化する

複雑な分析では、同じ SQL 文や異なる SQL 文に、繰り返し使う式の一部が多数含まれることがあります。

このような複雑な式にエイリアス関数を作成すると、次のことができます。

- クエリの記述を簡素化する。
- SQL の読みやすさと保守性を高める。
- 繰り返し使う式の不一致による保守コストを減らす。

## サポート範囲

<!-- Knowledge type: Constraints and limitations -->

### 式の要件

エイリアス関数が参照する基の式のルートノードは、現時点では関数式である必要があります。

有効な例：

```sql
-- Create an alias function named func with parameters INT, INT. The underlying expression is abs(foo + bar).
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS abs(foo + bar);

-- Create an alias function named func with parameters DATETIMEV2(3), INT. The underlying expression is date_trunc(days_sub(foo, bar), 'day').
CREATE ALIAS FUNCTION func(DATETIMEV2(3), INT) WITH PARAMETER (foo, bar) AS date_trunc(days_sub(foo, bar), 'day');
```

無効な例：

```sql
-- The root expression is not a function but an arithmetic operator.
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS foo + bar;
```

### パラメータの要件

エイリアス関数のパラメータは、現時点では次の両方の条件を満たす必要があります。

- 可変長パラメータはサポートされません。
- パラメータが少なくとも一つ必要です。
