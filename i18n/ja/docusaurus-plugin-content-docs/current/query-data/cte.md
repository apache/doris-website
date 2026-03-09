---
{
  "title": "共通テーブル式",
  "language": "ja",
  "description": "Common Table Expression (CTE) は、SQL文のスコープ内で複数回参照できる一時的な結果セットを定義する。"
}
---
## 説明

Common Table Expression (CTE) は、SQL文のスコープ内で複数回参照できる一時的な結果セットを定義します。CTEは主にSELECT文で使用されます。

CTEを指定するには、`WITH`句を使用して、1つまたは複数のカンマ区切りの句を記述します。各句は結果セットを生成するサブクエリを提供し、サブクエリに名前を関連付けます。

Dorisは入れ子のCTEをサポートしています。`WITH`句を含む文の中で、各CTE名を参照して対応するCTE結果セットにアクセスできます。CTE名は他のCTEで参照でき、他のCTEに基づいてCTEを定義することができます。

Dorisは再帰CTEを**サポートしていません**。詳細については、[recursive CTE](https://dev.mysql.com/doc/refman/8.4/en/with.html#common-table-expressions-recursive)についてのMySQLマニュアルをお読みください。

## 例

### シンプルなCTE

以下の例では、WITH句内でcte1とcte2という名前のCTEを定義し、WITH句の下のトップレベルSELECTでそれらを参照しています：

```sql
WITH
  cte1 AS (SELECT a, b FROM table1),
  cte2 AS (SELECT c, d FROM table2)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```
### ネストされたCTE

```sql
WITH
  cte1 AS (SELECT a, b FROM table1),
  cte2 AS (SELECT c, d FROM cte1)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```
### 再帰CTE

再帰CTE（`RECURSIVE`キーワードを持つCommon Table Expression）は、単一のSQL文内で自己参照クエリを表現するために使用され、ツリー/階層の走査、グラフの走査、階層集約などのシナリオで一般的に適用されます。再帰CTEは2つの部分で構成されます：

- **アンカークエリ**: 非再帰部分で、初期行セット（シード）を生成するために一度実行されます。
- **再帰クエリ**: CTE自体を参照でき、前の反復で生成された新しい行に基づいて新しい行を継続的に生成します。

アンカー部分と再帰部分は通常`UNION`または`UNION ALL`で接続されます。再帰実行は新しい行が生成されなくなるかシステム制限に達するまで続行されます。

## 構文

```sql
WITH [RECURSIVE] cte_name [(col1, col2, ...)] AS (
  <anchor_query>     -- Non-recursive part (executed once)
  UNION [ALL]
  <recursive_query>  -- Recursive part that can reference cte_name
)
SELECT ... FROM cte_name;
```
重要なポイント：
- `RECURSIVE`キーワードにより、CTE定義が自分自身を参照することが可能になります。
- アンカーメンバーと再帰メンバーが出力する列数とそのデータ型は厳密に一致している必要があります。
- `cte_name`は`recursive_query`内で参照でき、通常は`JOIN`の形式で使用されます。

## 実行セマンティクス（反復モデル）

典型的な反復実行フロー：
1. `anchor_query`を実行し、結果を出力セット（Output）に書き込み、それを最初の反復の作業セット（WorkSet）として使用します。
2. WorkSetが空でない間：
   - WorkSetを`recursive_query`の入力として使用し、`recursive_query`を実行して`newRows`を取得します。
   - `UNION ALL`が使用される場合：`newRows`を直接Outputに追加し、`newRows`を次の反復のWorkSetとして設定します。
   - `UNION`（重複排除）が使用される場合：`newRows`と既存のOutput間の差集合を計算し（重複を除去するため）、重複しない行のみをOutputと次の反復のWorkSetに追加します。
3. `newRows`が空になるか、あらかじめ設定されたシステムの上限に達するまでステップ2を繰り返します（Dorisセッション変数`cte_max_recursion_depth`が再帰深度を制限し、デフォルト値は100です；これを超えるとエラーが発生します）。

現在の反復で新しい行が生成されなくなった時点（またはシステムの最大再帰深度制限に達した時点）で終了します。

## UNION vs UNION ALL

- `UNION ALL`：重複を保持し、実行オーバーヘッドが低い（重複排除が不要）。重複が許可される、またはバックエンドのビジネスロジックで制御されるシナリオに適しています。
- `UNION`：暗黙的に重複排除を実行し、反復ごとまたはグローバルにソート/ハッシュベースの重複排除オーバーヘッドが追加されます—このコストは特に大容量データでは大きくなります。

推奨事項：セマンティクスが許可し、重複をアプリケーション層で後処理できる場合は`UNION ALL`を優先してください。

## 一般的な使用例とSQL例

### 1) シンプルな階層トラバーサル

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
### 2) グラフトラバーサル

```sql
CREATE TABLE graph
(
    c_from int,
    c_to int,
    label varchar(100)
) DUPLICATE KEY (c_from) DISTRIBUTED BY HASH(c_from) BUCKETS 1 PROPERTIES 'replication_num' = '1';

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
注意: `UNION`を使用すると各反復で重複除去が実行され、高いオーバーヘッドが発生します。

## 再帰CTEの制限事項

- 内部クエリのトップレベル演算子は UNION(ALL) である必要があります。
- 非再帰部分のサブクエリは再帰CTE自体を参照できません。
- 再帰部分のサブクエリは再帰CTEを一度だけ参照できます。
- 再帰部分内のサブクエリに別のネストしたサブクエリが含まれる場合、そのネストしたサブクエリは再帰CTEを参照できません。
- 再帰CTEの出力列のデータ型は非再帰サブクエリの出力によって決定されます。再帰側と非再帰側のデータ型が一致しない場合はエラーがスローされ、両側の一貫性を保つために手動でのキャストが必要です。
- セッション変数 `cte_max_recursion_depth` は無限ループを防ぐために最大再帰数を制限します（デフォルト値: 100）。

## よくあるエラー、原因、および解決策

### 1. エラー: アンカーメンバーと再帰メンバー間で列数またはデータ型が不一致
- **原因**: 2つの部分の `SELECT` 句における列数またはデータ型が一致していません。
- **解決策**: 両側の列の数、順序、データ型が一致していることを確認してください。必要に応じて `CAST` または明示的な列名を使用してください。

### 2. エラー: アンカークエリでの不正な自己参照
- **原因**: アンカークエリはCTE自体を参照することが許可されていません。
- **解決策**: 再帰メンバーでのみCTEを参照し、構文/パース木を確認してください。

### 3. エラー: 無限再帰 / 最大再帰深度の超過
- **原因**: 再帰に収束条件がないか、収束条件が正しく設定されていません。
- **解決策**: `WHERE` フィルターを追加する、システムの最大再帰深度を調整する、または無限再帰がロジックに固有である場合はクエリロジックを修正してください。
