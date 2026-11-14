---
{
    "title": "関連性スコアリング",
    "language": "ja",
    "description": "Doris の全文検索では、BM25 アルゴリズムを用い、語の出現頻度、逆文書頻度、レコード長を組み合わせてクエリ結果の関連性スコアを計算し、関連性の高いコンテンツから返すように結果を順位付けします。"
}
---

<!-- Knowledge type: Feature / Query usage -->
<!-- Applicable scenarios: Full-text search result ranking / Search relevance optimization -->

全文検索クエリ（`MATCH_ANY`、`MATCH_ALL`、`MATCH_PHRASE` など）を実行するとき、関連性の高いレコードを先に返せるよう、結果を「一致度」で並べ替えたい場合があります。Doris は **関連性スコアリング** を提供します。各行にはクエリ条件に基づく数値スコアが付与され、スコアが高いほど関連性が高いことを示します。

現在、Doris は関連性スコアリングのデフォルトの実装として **BM25（Best Matching 25）** アルゴリズムを使用しています。

**主な用途：**

- 検索エンジンアプリケーション：キーワードに基づいて、関連性の高い文書のリストを返す
- ログ分析：関連性で並べ替え、キーワードに最も一致するログをすばやく見つける
- コンテンツ推薦：テキストの類似度に基づいて優先度の高いコンテンツを選ぶ
- ナレッジベース検索：質問との関連性で順位付けした回答候補を返す

## クイックスタート {#quick-start}

次の例は、クエリで関連性スコアリングを有効にし、スコアで並べ替える方法を示します。

```sql
SELECT *,
       score() AS relevance
FROM search_demo
WHERE content MATCH_ANY 'text search test'
ORDER BY relevance DESC
LIMIT 10;
```

実行すると、Doris は BM25 アルゴリズムを使って各行のスコアを計算し、関連性が最も高いレコードを上位 10 件返します。

```text
+------+-----------------------------------+---------+--------------+-----------+
| id   | content                           | author  | publish_date | relevance |
+------+-----------------------------------+---------+--------------+-----------+
|    1 | Full text search engine test demo | Alice   | 2024-01-01   |  2.915228 |
|    7 | Text processing techniques        | Grace   | 2024-01-07   |  1.341931 |
|    5 | Performance test framework        | Eve     | 2024-01-05   |  1.341931 |
|    3 | Advanced search algorithms        | Charlie | 2024-01-03   |  1.341931 |
+------+-----------------------------------+---------+--------------+-----------+
```

## 有効になる条件 {#activation-conditions}

現在の開発版では、`SELECT` が `score()` を計算するには、単一の Doris 内部テーブルを読み取り、その `WHERE` 句に少なくとも一つの `MATCH_*` または `SEARCH` 条件を含める必要があります。その `SELECT` では、結合、サブクエリ、ラテラルビューはサポートされません。

集約を行わない最外側の `SELECT` では、`score()` を選択リスト、ウィンドウ関数、`ORDER BY` に指定できます。`ORDER BY` と `LIMIT` は省略できます。`GROUP BY`、集約関数、または `DISTINCT` を含むクエリでは、`score()` は `WHERE` の最小スコアによるフィルタリングにのみ使用できます。

サブクエリ、ビュー、CTE、または集合演算内でスコアを計算する `SELECT` でも、自身のスコアで並べ替えて `LIMIT` を指定する必要があります。相関サブクエリでは `score()` を呼び出せません。クイックスタートで示した Top-N 形式は引き続きサポートされます。

### 関連性スコアによるフィルタリング {#filter-by-relevance-score}

まず、トークン化された転置インデックスを持つ別のサンプルテーブルを用意します。以下の文の実行には、データベースとテーブルの作成、データロード、およびクエリの権限が必要です。

```sql
CREATE DATABASE IF NOT EXISTS score_filter_example;
USE score_filter_example;

CREATE TABLE score_filter_demo (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED
        PROPERTIES("parser" = "english", "support_phrase" = "true")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO score_filter_demo VALUES
(1, 'Full text search engine test demo'),
(2, 'Database performance analysis'),
(3, 'Search engine examples');
```

Doris 4.0.4 以降では、`WHERE` で最小スコアを直接指定してフィルタリングできます。次の Top-N 形式は Doris 4.0.4 以降で使用できます。

```sql
SELECT *, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5
ORDER BY relevance DESC
LIMIT 10;
```

このクエリは、スコアが 5 を超える一致行を、スコアの高い順に最大 10 件返します。しきい値を満たす一致行がなければ、結果は空です。スコアはクエリとコーパスによって変わるため、5 はあくまでしきい値の例です。

`WHERE` では `score()` 自体を使用し、`ORDER BY` では選択リストで付けた別名を使用します。直接フィルタリングで指定できる最小スコア条件は一つだけです。形式は `score() > <threshold>` または `score() >= <threshold>` で、しきい値には数値定数を指定します。リリース済みの 4.x バージョンとの互換性を保つには、数値リテラルを使用してください。スコア条件と検索条件は `AND` で結合します。上限（`<`、`<=`）、等値（`=`）、複数のスコア条件、`OR` の内部にネストしたスコア条件はサポートされません。

#### 開発版での Top-N を使用しないフィルタリング {#filtering-without-top-n-in-the-development-version}

現在の開発版では、最外側の単一テーブルを読む `SELECT` で、`ORDER BY` や `LIMIT` を指定せずにスコアでフィルタリングできます。

```sql
SELECT id, content, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5;
```

このクエリは、スコアが 5 を超える一致行をすべて返します。結果の順序と行数には制限を設けません。サブクエリ、ビュー、CTE、または集合演算内でスコアを計算する `SELECT` には、引き続き自身のスコアによる並べ替えと `LIMIT` が必要です。

#### Doris 4.0.0 から 4.0.3 との互換性 {#compatibility-with-doris-400-to-403}

Doris 4.0.0 から 4.0.3 では、`WHERE` に `score()` を指定できません。これらのバージョンでは、まずサブクエリで件数を制限したスコア付き候補を選択します。そのサブクエリ内に `MATCH_*` 条件、スコアの別名を使った `ORDER BY`、`LIMIT` をすべて指定し、外側のクエリで別名を使ってフィルタリングします。

```sql
SELECT a.*
FROM (
    SELECT *, score() AS relevance
    FROM score_filter_demo
    WHERE content MATCH_ANY 'text search test'
    ORDER BY relevance DESC
    LIMIT 1000
) AS a
WHERE a.relevance > 5
ORDER BY a.relevance DESC
LIMIT 10;
```

このクエリは、上位 1000 件の候補から、スコアが 5 を超える行を最大 10 件返します。候補の中にしきい値を満たす行がなければ、結果は空です。候補の件数はアプリケーションに合わせて選んでください。この方法では候補集合をフィルタリングするため、しきい値を超える一致行をすべて返すわけではありません。

Doris 4.0.0 から 4.0.3 では、内側の `LIMIT` を残してください。これを省くと、サブクエリが必要な Top-N 形式を満たさなくなり、オプティマイザが外側のスコア条件をスコア計算用のクエリに移動させる可能性があります。外側の `ORDER BY` と `LIMIT` だけでは、必要な内側の Top-N 操作を満たせません。

### 対応するインデックスの種類 {#supported-index-types}

| インデックスの種類 | スコア計算に対応 | 説明 |
| ------------------ | ---------------- | ---- |
| トークン化された転置インデックス | はい | BM25 の関連性スコアを計算できる |
| トークン化されていない転置インデックス | いいえ | 完全一致のみをサポートし、スコアは計算しない |

### 対応するクエリの種類 {#supported-query-types}

- `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `SEARCH`

## BM25 アルゴリズム {#bm25-algorithm}

BM25 は確率モデルに基づくテキストの関連性アルゴリズムです。**語の出現頻度（TF）**、**逆文書頻度（IDF）**、**レコード長**という三つの要素を組み合わせ、一致した結果のスコアを重み付きで計算します。従来の TF-IDF モデルと比べて、BM25 は頑健性と調整のしやすさに優れ、長いテキストと短いテキストのスコア差を効果的に調整できます。

### 基本式 {#core-formula}

```text
score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × |d| / avgdl))
```

式に含まれる変数の意味は次のとおりです。

| 変数 | 意味 |
| ---- | ---- |
| `tf` | 現在の行にクエリ語が出現する回数 |
| `IDF` | 語の希少性を表す逆文書頻度 |
| `\|d\|` | 現在の行の長さ（トークン化後のトークン数） |
| `avgdl` | テーブル内の全行の平均長 |
| `k1`、`b` | アルゴリズムの調整パラメータ |

### パラメータ {#parameters}

| パラメータ | デフォルト値 | 説明 |
| ---------- | ------------ | ---- |
| `k1` | 1.2 | 語の出現頻度がスコアに与える影響を調整する |
| `b` | 0.75 | レコード長の正規化の強さを調整する |
| `boost` | 1.0 | クエリ単位の重み係数 |

### 補助統計量 {#auxiliary-statistics}

```text
IDF   = log(1 + (N - n + 0.5) / (n + 0.5))
avgdl = total_terms / total_rows
```

ここで、各変数の意味は次のとおりです。

- `N`：テーブル内の総行数
- `n`：クエリ語を含む行数

クエリに複数の語が含まれる場合、**最終スコアは各語のスコアの合計**です。

### レコード長と `norms` プロパティ {#record-length-and-the-norms-property}

`norms` インデックスプロパティと `inverted_index_skip_norms_for_variant` BE 設定は、Doris 4.1.5 以降でサポートされています。

`|d|` は norms から取得されます。norms は、該当フィールドに値がない行も含め、インデックス対象フィールドごとに各行で一バイトを消費します。トークン化されたインデックスはデフォルトで norms を書き込みます（`"norms" = "true"`）。トークン化されていないインデックスは書き込みません。フィルタリングにのみ使用するインデックスでは、`"norms" = "false"` を設定すると容量を節約できます。

```sql
INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "english", "norms" = "false")
```

VARIANT のサブパスはインデックスの `norms` プロパティを継承し、`行数 × パス数` バイトを消費します。BE 設定の `inverted_index_skip_norms_for_variant`（デフォルトは `false`、実行時に変更可能）を `true` にすると、インデックスプロパティの設定より優先して、すべての VARIANT パスインデックスで norms が無効になります。

norms を無効にしても `MATCH_*` によるフィルタリングには影響しませんが、`score()` が norms のないセグメントを読み取るとエラーになります。これらの設定が影響するのは新しく書き込まれるセグメントです。既存のセグメントは compaction によって書き換えられるまで変わりません。設定を変更する前に、すべての BE をこれらの設定に対応したバージョンへアップグレードしてください。

## 結果の解釈 {#interpreting-the-results}

スコアの特性を理解すると、関連性による順位付けをより適切に利用できます。

| 特性 | 説明 |
| ---- | ---- |
| スコアの範囲 | 正の数で、固定の上限はない。通常は絶対値より相対的な大きさが重要 |
| 複数語のクエリ | 複数の語が含まれる場合、合計スコアは語ごとのスコアの合計になる |
| 長さの影響 | 一致する語が同じ場合、短いレコードのスコアがやや高くなる |
| 一致する語がない場合 | クエリ語がテーブル内に出現しなければ、その語に対応するスコアは 0 になる |

## よくある質問 {#faq}

**Q1: クエリでスコアが返されないのはなぜですか？**

次の項目を順に確認してください。

1. スコアを出力したい場合、`SELECT` の選択リストに `score()` を指定しているか。
2. 同じ `SELECT` が単一の内部テーブルを読み取り、`WHERE` に `MATCH_*` または `SEARCH` 条件を含んでいるか。
3. スコアを計算する `SELECT` がサブクエリ、ビュー、CTE、または集合演算内にある場合、自身のスコアで並べ替え、自身の `LIMIT` を指定しているか。
4. インデックスがトークン化された転置インデックスか。

**Q2: BM25 と TF-IDF の違いは何ですか？**

BM25 は TF-IDF に、**語の出現頻度の飽和**と**長さの正規化**という二つの改良を加えています。これにより、長いテキストと短いテキストのスコアがより均衡し、頑健性も向上します。

**Q3: 異なるクエリ間でスコアを比較できますか？**

推奨しません。BM25 のスコアは、具体的なクエリ語とテーブル内のデータ分布に依存します。異なるクエリ間で絶対値を比較することはできません。**相対的な大きさは、同じクエリの結果集合内でのみ比較してください。**
