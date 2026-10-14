---
{
    "title": "共通テーブル式（CTE）",
    "language": "ja",
    "description": "Apache Doris の CTE（共通テーブル式）ガイド。WITH 句で一時的な結果セットを定義する方法、ネストした CTE と再帰 CTE、階層やグラフの探索などの用途を説明します。",
    "keywords": [
        "Doris CTE",
        "共通テーブル式",
        "WITH 句",
        "再帰 CTE",
        "RECURSIVE",
        "ネストした CTE",
        "階層クエリ",
        "ツリー構造のクエリ",
        "グラフ探索",
        "cte_max_recursion_depth"
    ]
}
---

<!-- Knowledge type: Capability definition + Syntax reference -->
<!-- Applicable scenarios: Writing complex queries / Hierarchical and graph-structure traversal -->

共通テーブル式（CTE）は、`SELECT` 文の中で一時的な結果セットを定義する Apache Doris の機能です。`WITH` 句で一度定義した CTE は、同じ SQL 文の中で何度でも参照できます。CTE は、複雑なクエリの簡素化、重複するサブクエリの削減、階層やグラフの探索のような自己参照ロジックの記述に使われます。

## 適用場面

<!-- Knowledge type: Applicable scenarios -->

次のような場合に CTE を使うと、SQL が読みやすく、保守しやすくなります。

- **同じサブクエリを複数回参照する場合**：サブクエリに CTE として名前を付けることで、メインクエリに繰り返し記述せずに済みます。
- **深くネストしたサブクエリが読みにくい場合**：ロジックを複数の CTE に分け、各段階に名前を付けると読みやすくなります。
- **前の段階の結果に基づいて計算する場合**：ネストした CTE を使うと、後続の CTE から先に定義した CTE の結果を直接参照できます。
- **階層構造やツリー構造を探索する場合**：組織階層、カテゴリ一覧、ネストしたコメントスレッドなどでは、再帰 CTE を使ってすべての階層を一つのクエリで展開できます。
- **グラフ上の到達可能なノードを探索する場合**：たとえば、指定したノードから辺をたどり、到達可能なすべてのノードを探します。

## 基本的な使い方

### 構文の概要

`WITH` 句を使い、カンマで区切って一つ以上の CTE を定義します。各 CTE は名前とサブクエリで構成されます。

```sql
WITH
    cte_name1 AS (subquery1),
    cte_name2 AS (subquery2)
SELECT ... FROM cte_name1 JOIN cte_name2 ON ...;
```

`WITH` 句を含む文では、各 CTE の名前を参照して、対応する一時的な結果セットにアクセスできます。

### 単純な CTE の例

次の例では、`cte1` と `cte2` を `WITH` 句で定義し、外側の `SELECT` から両方を参照します。

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM table2)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### ネストした CTE

別の CTE の中から CTE 名を参照できるため、先に定義した CTE に基づいて新しい CTE を定義できます。

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM cte1)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

## 再帰 CTE

<!-- Knowledge type: Capability definition + Syntax reference -->
<!-- Applicable scenarios: Tree/hierarchical traversal, graph traversal, hierarchical aggregation -->

再帰 CTE（`RECURSIVE` キーワードを使う CTE）は、一つの SQL 文の中で自己参照するクエリを表現します。ツリーや階層の探索、グラフ探索、階層集計によく使われます。

### 構文

```sql
WITH [RECURSIVE] cte_name [(col1, col2, ...)] AS (
    <anchor_query>     -- Non-recursive part (executed once)
    UNION [ALL]
    <recursive_query>  -- Recursive part that can reference cte_name
)
SELECT ... FROM cte_name;
```

主なポイントは次のとおりです。

- `RECURSIVE` キーワードを指定すると、CTE の定義からその CTE 自身を参照できます。
- アンカー部分と再帰部分は、列数と各列の型が完全に一致している必要があります。
- `recursive_query` は `cte_name` を参照でき、通常は `JOIN` を使います。

### 構成

再帰 CTE は二つの部分から構成され、通常は `UNION` または `UNION ALL` で結合されます。

| 構成要素 | 説明 |
|---|---|
| アンカークエリ | 再帰しない部分です。一度実行され、初期行の集合（シード）を生成します。 |
| 再帰クエリ | CTE 自身を参照でき、前の反復で生成された行に基づいて新しい行を生成します。 |

新しい行が生成されなくなるか、システムの上限に達するまで再帰が続きます。

### 実行の仕組み（反復モデル）

<!-- Knowledge type: Execution principle -->

再帰 CTE の一般的な実行の流れは次のとおりです。

1. `anchor_query` を実行し、その結果を出力集合（Output）に書き込み、最初の反復の作業集合（WorkSet）として使用します。
2. WorkSet が空でない間、次の処理を繰り返します。
    - WorkSet を `recursive_query` の入力として使用し、`recursive_query` を実行して `newRows` を取得します。
    - `UNION ALL` の場合：`newRows` をそのまま Output に追加し、`newRows` を次の反復の WorkSet として使用します。
    - `UNION` の場合（重複排除あり）：`newRows` と既存の Output との差分を求め（重複を排除し）、まだ出現していない行だけを Output と次の反復の WorkSet に追加します。
3. 手順 2 を、`newRows` が空になるか、システムで定義された再帰の深さの上限に達するまで繰り返します。

セッション変数 `cte_max_recursion_depth` は再帰の最大深度を制御します。デフォルト値は 100 で、これを超えるとエラーが発生します。

### UNION と UNION ALL

<!-- Knowledge type: Selection comparison -->

| 形式 | 動作 | 性能 | 適用場面 |
|---|---|---|---|
| `UNION ALL` | 重複する行を保持する | 重複排除がないためオーバーヘッドが小さい | 重複が許容される場合、またはアプリケーション側で重複を処理する場合 |
| `UNION` | 暗黙的に重複を排除する | 各反復または全体でソートやハッシュによる重複排除が加わり、大量のデータではコストが高い | データベース内で重複を排除する必要がある場合 |

推奨：要件上問題がなく、アプリケーション側で重複を処理できる場合は、`UNION ALL` を優先してください。

### 例

#### 単純な階層探索

ルートノードから始めて、ツリー全体を再帰的に探索します。

```sql
CREATE TABLE tree
(
    id int,
    parent_id int,
    data varchar(100)
) DUPLICATE KEY (id)
DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ('replication_num' = '1');

INSERT INTO tree VALUES (0, NULL, 'ROOT'), (1, 0, 'Child_1'), (2, 0, 'Child_2'), (3, 1, 'Child_1_1');

WITH RECURSIVE search_tree AS (
    SELECT id, parent_id, data
    FROM tree t
    WHERE t.id = 0
UNION ALL
    SELECT t.id, t.parent_id, t.data
    FROM tree t, search_tree st
    WHERE t.parent_id = st.id
)
SELECT * FROM search_tree ORDER BY id;
```

#### グラフ探索

辺の向きに沿って、グラフ内で到達可能なすべての経路を探索します。

```sql
CREATE TABLE graph
(
    c_from int,
    c_to int,
    label varchar(100)
) DUPLICATE KEY (c_from) DISTRIBUTED BY HASH(c_from) BUCKETS 1 PROPERTIES ('replication_num' = '1');

INSERT INTO graph VALUES (1, 2, '1 -> 2'), (1, 3, '1 -> 3'), (2, 3, '2 -> 3'), (1, 4, '1 -> 4'), (4, 5, '4 -> 5');

WITH RECURSIVE search_graph AS (
    SELECT c_from, c_to, label FROM graph g
UNION ALL
    SELECT g.c_from, g.c_to, g.label
    FROM graph g, search_graph sg
    WHERE g.c_from = sg.c_to
)
SELECT DISTINCT * FROM search_graph ORDER BY c_from, c_to;
```

注：上の例では、最後に `SELECT DISTINCT` を使って重複を排除しています。再帰処理の内部で `UNION` を使って重複を排除すると、反復のたびに重複排除が行われるため、コストが高くなります。

## 再帰 CTE の制限

<!-- Knowledge type: Restrictions and constraints -->

再帰 CTE には次の制約があります。

- CTE 内の最上位の演算子は、`UNION` または `UNION ALL` でなければなりません。
- 非再帰サブクエリから再帰 CTE 自身を参照することはできません。
- 再帰サブクエリから再帰 CTE を参照できるのは一度だけです。
- 再帰サブクエリに内部サブクエリが含まれる場合、その内部サブクエリから再帰 CTE を参照することはできません。
- 再帰 CTE の出力列の型は、非再帰部分によって決まります。再帰部分と非再帰部分の型が一致しない場合はエラーになるため、明示的な `CAST` を追加して両側のデータ型を揃える必要があります。
- セッション変数 `cte_max_recursion_depth` は、無限ループを防ぐために再帰回数の上限を設定します。デフォルト値は 100 です。

## よくあるエラーとトラブルシューティング

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Debugging when writing recursive CTEs -->

| 症状 | 考えられる原因 | 対処方法 |
|---|---|---|
| アンカー部分と再帰部分の列数または列の型が一致しない | 二つの `SELECT` リストで列数または列の型が異なる | 両側の列数、列の順序、型を一致させてください。必要に応じて `CAST` または明示的な列名を使用してください。 |
| アンカー部分が CTE 自身を参照している（無効） | アンカー部分から CTE 自身を参照することは許可されていない | CTE は再帰部分からのみ参照してください。構文または構文解析木を確認してください。 |
| 無限再帰が発生する／再帰の最大深度を超える | 終了条件がないか、終了条件が正しくない | `WHERE` フィルターを追加するか、システム全体の再帰の最大深度を調整してください。ロジックが実際に無限再帰を起こす場合は、クエリのロジックを修正してください。 |

## 参考資料

- [MySQL の再帰 CTE マニュアル](https://dev.mysql.com/doc/refman/8.4/en/with.html#common-table-expressions-recursive)：再帰 CTE の標準的な定義と例。
