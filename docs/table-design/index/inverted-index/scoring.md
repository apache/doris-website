---
{
    "title": "Relevance Scoring",
    "language": "en",
    "description": "Doris full-text search calculates a relevance score for query results using the BM25 algorithm, combining term frequency, inverse document frequency, and record length to rank results so that the most relevant content is returned first."
}
---

<!-- Knowledge type: Feature / Query usage -->
<!-- Applicable scenarios: Full-text search result ranking / Search relevance optimization -->

When you run full-text search queries (such as `MATCH_ANY`, `MATCH_ALL`, `MATCH_PHRASE`, and so on), you often need to sort results by "match degree" so that the most relevant records are returned first. Doris provides **Relevance Scoring**: each row is given a numeric score based on the query conditions, and a higher score indicates stronger relevance.

Doris currently uses the **BM25 (Best Matching 25)** algorithm as the default implementation for relevance scoring.

**Typical use cases:**

- Search engine applications: return the most relevant document list based on keywords
- Log analysis: sort by relevance to quickly locate the logs that best match the keywords
- Content recommendation: filter priority content based on text similarity
- Knowledge base retrieval: return candidate answers ranked by question relevance

## Quick Start

The following example shows how to enable relevance scoring in a query and sort by score:

```sql
SELECT *,
       score() AS relevance
FROM search_demo
WHERE content MATCH_ANY 'text search test'
ORDER BY relevance DESC
LIMIT 10;
```

After execution, Doris computes the score for each row using the BM25 algorithm and returns the top 10 most relevant records:

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

## Activation Conditions

In the current development version, the `SELECT` that computes `score()` must read one Doris internal table and contain at least one `MATCH_*` or `SEARCH` predicate in its own `WHERE` clause. Joins, subqueries in that `SELECT`, and lateral views are not supported.

For an outermost, non-aggregate `SELECT`, `score()` can appear in the select list, window functions, and `ORDER BY`; `ORDER BY` and `LIMIT` are optional. In a query with `GROUP BY`, aggregate functions, or `DISTINCT`, `score()` can only appear as a minimum-score filter in `WHERE`.

A scored `SELECT` inside a subquery, view, CTE, or set operation still requires ordering by its score with `LIMIT`. Correlated subqueries cannot call `score()`. The Top-N form in the quick start remains supported.

### Filter by Relevance Score

First prepare a separate example table with a tokenized inverted index. Run the following statements with permission to create the database and table, load data, and query it:

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

Doris 4.0.4 and later support filtering the minimum score directly in `WHERE`. The following Top-N form is compatible with Doris 4.0.4 and later:

```sql
SELECT *, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5
ORDER BY relevance DESC
LIMIT 10;
```

This returns up to 10 matching rows with a score greater than 5, ordered by score from highest to lowest. If no matching row passes the threshold, the result is empty. Scores depend on the query and corpus, so 5 is only an example threshold.

Use `score()` itself in `WHERE` and the select-list alias in `ORDER BY`. Direct filtering supports one minimum-score predicate, `score() > <threshold>` or `score() >= <threshold>`, where the threshold is a numeric constant. Use a numeric literal for compatibility with released 4.x versions. Combine the score and search predicates using `AND`. Upper bounds (`<`, `<=`), equality (`=`), multiple score predicates, and score predicates nested inside `OR` are not supported.

#### Filtering Without Top-N in the Development Version

In the current development version, an outermost single-table `SELECT` can filter by score without `ORDER BY` or `LIMIT`:

```sql
SELECT id, content, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5;
```

This returns all matching rows with a score greater than 5, without imposing an order or row limit. A scored `SELECT` inside a subquery, view, CTE, or set operation still needs its own score ordering and `LIMIT`.

#### Compatibility with Doris 4.0.0 to 4.0.3

Doris 4.0.0 through 4.0.3 do not allow `score()` in `WHERE`. On these versions, first select a bounded set of scored candidates in a subquery, with the `MATCH_*` predicate, `ORDER BY` on the score alias, and `LIMIT` all inside that subquery. Then filter the alias in the outer query:

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

This returns up to 10 rows with a score greater than 5 from the top 1000 candidates. It returns no rows if none of those candidates passes the threshold. Choose the candidate limit for your application; this pattern filters that candidate set rather than returning every matching row above the threshold.

On Doris 4.0.0 through 4.0.3, keep the inner `LIMIT`: without it, the query no longer has the required inner Top-N shape, and the optimizer can move the outer score predicate into the scoring query. An outer `ORDER BY` and `LIMIT` alone do not supply the required inner Top-N operation.

### Supported Index Types

| Index Type                       | Scoring Supported | Description                                                |
| -------------------------------- | ----------------- | ---------------------------------------------------------- |
| Tokenized inverted index         | Yes               | Can compute BM25 relevance scores                          |
| Non-tokenized inverted index     | No                | Supports only exact match; does not compute scores         |

### Supported Query Types

- `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `SEARCH`

## BM25 Algorithm

BM25 is a text relevance algorithm based on a probabilistic model. It performs a weighted calculation on matching results by considering three factors together: **term frequency (TF)**, **inverse document frequency (IDF)**, and **record length**. Compared with the traditional TF-IDF model, BM25 offers better robustness and tunability, and effectively balances the score difference between long and short text.

### Core Formula

```text
score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × |d| / avgdl))
```

The variables in the formula are defined as follows:

| Variable    | Meaning                                              |
| ----------- | ---------------------------------------------------- |
| `tf`        | Number of occurrences of the query term in the current row |
| `IDF`       | Inverse document frequency, which measures how rare the term is |
| `\|d\|`     | Length of the current row (number of tokens after tokenization) |
| `avgdl`     | Average length of all rows in the table              |
| `k1`, `b`   | Algorithm tuning parameters                          |

### Parameters

| Parameter | Default | Description                                            |
| --------- | ------- | ------------------------------------------------------ |
| `k1`      | 1.2     | Controls how much term frequency influences the score  |
| `b`       | 0.75    | Controls the strength of record-length normalization   |
| `boost`   | 1.0     | Query-level weight factor                              |

### Auxiliary Statistics

```text
IDF   = log(1 + (N - n + 0.5) / (n + 0.5))
avgdl = total_terms / total_rows
```

Where:

- `N`: total number of rows in the table
- `n`: number of rows that contain the query term

When a query contains multiple terms, **the final score is the sum of the scores of each term**.

### Record Length and the `norms` Property

The `norms` index property and the `inverted_index_skip_norms_for_variant` BE config are supported since Doris 4.1.5.

`|d|` comes from norms, which cost one byte per row per indexed field, including rows with no value for that field. Tokenized indexes write norms by default (`"norms" = "true"`); non-tokenized indexes do not. For indexes used only for filtering, set `"norms" = "false"` to save space:

```sql
INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "english", "norms" = "false")
```

VARIANT subpaths inherit the index's `norms` property, costing `rows × paths` bytes. Setting the BE config `inverted_index_skip_norms_for_variant` (default `false`, changeable at runtime) to `true` disables norms for all VARIANT path indexes, overriding the index property.

Disabling norms does not affect `MATCH_*` filtering, but `score()` returns an error if it reads any segment without norms. These settings affect newly written segments; existing segments remain unchanged until compaction rewrites them. Upgrade all BEs to a version supporting these settings before changing them.

## Interpreting the Results

Understanding the scoring results helps you use relevance ranking more accurately:

| Characteristic | Description                                                                            |
| -------------- | -------------------------------------------------------------------------------------- |
| Score range    | Positive number with no fixed upper bound; usually only relative magnitude matters, not the absolute value |
| Multi-term query | When multiple terms are involved, the total score equals the sum of the per-term scores |
| Length effect  | Given the same matching terms, a shorter record receives a slightly higher score        |
| No matching term | If the query term does not appear in the table, the corresponding score is 0          |

## FAQ

**Q1: Why does my query not return scores?**

Check the following in order:

1. Whether `score()` is projected in `SELECT` when you want it in the output.
2. Whether the same `SELECT` reads one internal table and contains a `MATCH_*` or `SEARCH` predicate in `WHERE`.
3. For a scored `SELECT` inside a subquery, view, CTE, or set operation, whether it orders by its score and has its own `LIMIT`.
4. Whether the index is a tokenized inverted index.

**Q2: What is the difference between BM25 and TF-IDF?**

BM25 builds on TF-IDF by introducing two improvements: **term frequency saturation** and **length normalization**. These make the scores of long and short text more balanced and provide better robustness.

**Q3: Can scores be compared across queries?**

This is not recommended. BM25 scores depend on the specific query terms and the data distribution in the table. Absolute values are not comparable between different queries. **Compare relative magnitudes only within the result set of the same query.**
