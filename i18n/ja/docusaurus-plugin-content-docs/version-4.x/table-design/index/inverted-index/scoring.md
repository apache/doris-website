---
{
    "title": "関連度スコアリング",
    "language": "ja",
    "description": "Doris の全文検索では、BM25 アルゴリズムを使用してクエリ結果の関連度スコアを計算します。語の出現頻度、逆文書頻度、レコード長を組み合わせて結果を順位付けし、関連度の高い内容から返します。"
}
---

<!-- Knowledge type: Feature / Query usage -->
<!-- Applicable scenarios: Full-text search result ranking / Search relevance optimization -->

全文検索クエリ（`MATCH_ANY`、`MATCH_ALL`、`MATCH_PHRASE` など）を実行するときは、関連度の高いレコードから返すために、結果を「一致度」で並べ替えたい場合があります。Doris の **関連度スコアリング** では、クエリ条件に基づいて各行に数値のスコアを付けます。スコアが高いほど関連度が高いことを示します。

現在、Doris は関連度スコアリングのデフォルトの実装として **BM25 (Best Matching 25)** アルゴリズムを使用します。

**主な用途：**

- 検索エンジンアプリケーション：キーワードに最も関連する文書の一覧を返す
- ログ分析：関連度で並べ替え、キーワードに最も一致するログをすばやく見つける
- コンテンツ推薦：テキストの類似度に基づいて優先するコンテンツを選別する
- ナレッジベース検索：質問との関連度順に回答候補を返す

## クイックスタート {#quick-start}

次の例は、クエリで関連度スコアリングを有効にし、スコア順に並べ替える方法を示します。

```sql
SELECT *,
       score() AS relevance
FROM search_demo
WHERE content MATCH_ANY 'text search test'
ORDER BY relevance DESC
LIMIT 10;
```

実行すると、Doris は BM25 アルゴリズムで各行のスコアを計算し、関連度の高い上位 10 件のレコードを返します。

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

## 有効化の条件 {#activation-conditions}

上記の Top-N 形式でスコアリングを使用するには、`score()` を計算する `SELECT` が次の条件をすべて満たす必要があります。

1. `SELECT` 句で `score()` 関数を明示的に呼び出す。
2. その `WHERE` 句に、`MATCH_*` または `SEARCH` の述語を少なくとも含める。
3. `ORDER BY` のキーをスコアの別名だけにし、`LIMIT` を指定する。

Doris 4.0.x および 4.1.0 から 4.1.5 では、この Top-N 形式が必要です。

### 関連度スコアによるフィルタリング {#filter-by-relevance-score}

まず、トークン化された転置インデックスを持つ別のサンプルテーブルを用意します。次の文を実行するには、データベースとテーブルの作成、データロード、クエリの権限が必要です。

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

Doris 4.0.4 以降では、`WHERE` で最低スコアを直接指定してフィルタリングできます。次の Top-N 形式は Doris 4.0.4 以降で使用できます。

```sql
SELECT *, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5
ORDER BY relevance DESC
LIMIT 10;
```

このクエリは、スコアが 5 を超える一致行を、スコアの高い順に最大 10 件返します。しきい値を超える一致行がなければ、結果は空になります。スコアはクエリとデータ集合によって変わるため、5 はしきい値の例にすぎません。

`WHERE` では `score()` 自体を使用し、`ORDER BY` では SELECT リスト内のスコアの別名を使用します。直接フィルタリングで指定できる最低スコアの述語は、`score() > <threshold>` または `score() >= <threshold>` のいずれか一つで、しきい値には数値リテラルを指定します。検索の述語とは `AND` で結合します。上限（`<`、`<=`）、等価比較（`=`）、複数のスコア述語、`OR` 内にネストしたスコア述語はサポートされません。

#### Doris 4.0.0 から 4.0.3 での互換性 {#compatibility-with-doris-400-to-403}

Doris 4.0.0 から 4.0.3 では、`WHERE` に `score()` を指定できません。これらのバージョンでは、まずサブクエリ内で件数を制限したスコア付きの候補を取得します。そのサブクエリ内に `MATCH_*` 述語、スコアの別名を使った `ORDER BY`、`LIMIT` をすべて配置し、外側のクエリで別名を使ってフィルタリングします。

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

このクエリは、上位 1000 件の候補から、スコアが 5 を超える行を最大 10 件返します。その候補の中にしきい値を超える行がなければ、結果は空になります。候補の件数上限はアプリケーションに合わせて選んでください。この形式でフィルタリングする対象は候補集合であり、しきい値を超えるすべての一致行を返すわけではありません。

Doris 4.0.0 から 4.0.3 では、内側の `LIMIT` を残してください。これがないと、サブクエリは必要な Top-N 形式を満たさなくなり、オプティマイザが外側のスコア述語をスコア計算用のクエリへ移動する可能性があります。外側の `ORDER BY` と `LIMIT` だけでは、必要な内側の Top-N 操作を満たせません。

### サポートされるインデックスの種類 {#supported-index-types}

| インデックスの種類 | スコアリングのサポート | 説明 |
| ------------------ | ---------------------- | ---- |
| トークン化された転置インデックス | あり | BM25 による関連度スコアを計算できる |
| トークン化されていない転置インデックス | なし | 完全一致のみをサポートし、スコアは計算しない |

### サポートされるクエリの種類 {#supported-query-types}

- `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `SEARCH`

## BM25 アルゴリズム {#bm25-algorithm}

BM25 は確率モデルに基づくテキスト関連度アルゴリズムです。**語の出現頻度（TF）**、**逆文書頻度（IDF）**、**レコード長**という三つの要素を組み合わせて、一致した結果に重みを付けて計算します。従来の TF-IDF モデルと比べて、BM25 は頑健性と調整のしやすさに優れ、長いテキストと短いテキストのスコア差を効果的に調整します。

### 基本式 {#core-formula}

```text
score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × |d| / avgdl))
```

式中の変数は次のとおりです。

| 変数 | 意味 |
| ---- | ---- |
| `tf` | 現在の行にクエリの語が出現する回数 |
| `IDF` | 語の珍しさを表す逆文書頻度 |
| `\|d\|` | 現在の行の長さ（トークン化後のトークン数） |
| `avgdl` | テーブル内の全行の平均長 |
| `k1`、`b` | アルゴリズムの調整パラメータ |

### パラメータ {#parameters}

| パラメータ | デフォルト値 | 説明 |
| ---------- | ------------ | ---- |
| `k1` | 1.2 | 語の出現頻度がスコアに与える影響の大きさを制御する |
| `b` | 0.75 | レコード長の正規化の強さを制御する |
| `boost` | 1.0 | クエリ単位の重み係数 |

### 補助統計量 {#auxiliary-statistics}

```text
IDF   = log(1 + (N - n + 0.5) / (n + 0.5))
avgdl = total_terms / total_rows
```

各記号の意味は次のとおりです。

- `N`：テーブル内の総行数
- `n`：クエリの語を含む行数

クエリに複数の語が含まれる場合、**最終スコアは各語のスコアの合計**です。

### レコード長と `norms` プロパティ {#record-length-and-the-norms-property}

`norms` インデックスプロパティと `inverted_index_skip_norms_for_variant` BE 設定は、Doris 4.1.5 以降でサポートされます。

`|d|` は norms から取得されます。norms は、対象フィールドに値がない行も含め、インデックス対象フィールドごとに各行で一バイトを使用します。トークン化されたインデックスはデフォルトで norms を書き込み（`"norms" = "true"`）、トークン化されていないインデックスは書き込みません。フィルタリングにのみ使用するインデックスでは、`"norms" = "false"` を設定すると領域を節約できます。

```sql
INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "english", "norms" = "false")
```

VARIANT のサブパスはインデックスの `norms` プロパティを継承し、`行数 × パス数` バイトを使用します。BE 設定の `inverted_index_skip_norms_for_variant`（デフォルトは `false`、実行中に変更可能）を `true` にすると、インデックスプロパティよりも優先され、すべての VARIANT パスインデックスで norms が無効になります。

norms を無効にしても `MATCH_*` によるフィルタリングには影響しませんが、`score()` が norms のないセグメントを読み取るとエラーになります。これらの設定が影響するのは新しく書き込まれるセグメントです。既存のセグメントは compaction によって書き直されるまで変わりません。設定を変更する前に、すべての BE をこれらの設定に対応したバージョンへアップグレードしてください。

## 結果の解釈 {#interpreting-the-results}

スコアの意味を理解すると、関連度に基づく順位付けをより正確に利用できます。

| 特性 | 説明 |
| ---- | ---- |
| スコアの範囲 | 固定の上限がない正の数。通常は絶対値よりも相対的な大きさが重要 |
| 複数語のクエリ | 複数の語が含まれる場合、合計スコアは各語のスコアの合計になる |
| 長さの影響 | 一致する語が同じなら、短いレコードのスコアがやや高くなる |
| 一致する語がない場合 | クエリの語がテーブル内に出現しない場合、対応するスコアは 0 |

## よくある質問 {#faq}

**Q1: クエリでスコアが返されないのはなぜですか？**

次の順に確認してください。

1. `SELECT` で `score()` 関数を呼び出しているか。
2. 同じ `SELECT` の `WHERE` に `MATCH_*` または `SEARCH` 述語が含まれているか。
3. Top-N 形式の場合、`ORDER BY` がスコアの別名を参照し、クエリに `LIMIT` があるか。
4. インデックスがトークン化された転置インデックスか。

**Q2: BM25 と TF-IDF の違いは何ですか？**

BM25 は TF-IDF を基に、**語の出現頻度の飽和**と**長さの正規化**という二つの改善を加えています。これにより、長いテキストと短いテキストのスコアのバランスがよくなり、頑健性が高まります。

**Q3: 異なるクエリ間でスコアを比較できますか？**

推奨しません。BM25 のスコアは、具体的なクエリの語とテーブル内のデータ分布に依存します。異なるクエリ間で絶対値は比較できません。**相対的な大きさは、同じクエリの結果集合内でのみ比較してください。**
