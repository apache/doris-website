---

{
"title": "Text Search Scoring",
"language": "en"
}
---

## Overview

Text search scoring measures how relevant each row in a table is to a given query text.
When executing a query that includes full-text search predicates (such as `MATCH_ANY` or `MATCH_ALL`), Doris computes a numeric score for each row, representing its degree of match with the query.
This score can be used for ranking query results, so that rows most relevant to the query appear first.

Doris currently uses the **BM25 (Best Matching 25)** algorithm for text relevance scoring.

## BM25 Algorithm

BM25 is a probabilistic relevance algorithm that evaluates how well a record matches the query terms by considering term frequency, inverse document frequency, and record length.
Compared with the traditional TF-IDF model, BM25 provides greater robustness and tunability, effectively balancing score differences between long and short text.

### Formula

The core BM25 scoring formula is:

```
score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × |d| / avgdl))
```

Where:

* **tf** – the frequency of a query term in the current row
* **IDF** – inverse document frequency, indicating how rare the term is across all rows
* **|d|** – the length of the current row (number of tokens after analysis)
* **avgdl** – the average row length in the table
* **k1**, **b** – algorithm tuning parameters

**Default parameters:**

| Parameter | Default | Description                                             |
| --------- | ------- | ------------------------------------------------------- |
| `k1`      | 1.2     | Controls how strongly term frequency affects the score. |
| `b`       | 0.75    | Controls the strength of length normalization.          |
| `boost`   | 1.0     | Optional query-level weighting factor.                  |

**Supporting statistics:**

```
IDF = log(1 + (N - n + 0.5) / (n + 0.5))
avgdl = total_terms / total_rows
```

Where:

* `N` – total number of rows in the table
* `n` – number of rows that contain the query term

The final score of a row is the sum of the BM25 scores for all query terms.


## Using Scoring in Doris

### Supported Index Types

* **Tokenized inverted index** – supports BM25 scoring.
* **Non-tokenized inverted index** – supports only exact matching; scoring is not calculated.

### Supported Query Types

* `MATCH_ANY`
* `MATCH_ALL`
* `MATCH_PHRASE`
* `MATCH_PHRASE_PREFIX`
* `SEARCH`

### Query Pushdown Rules

To enable scoring pushdown into the inverted index engine, the following conditions must be met:

1. The `SELECT` clause includes the `score()` function.
2. The `WHERE` clause contains at least one `MATCH_*` predicate.
3. The query is a Top-N query with an `ORDER BY` clause based on the score result.

---

## Example

```sql
SELECT *,
       score() AS relevance
FROM search_demo
WHERE content MATCH_ANY 'text search test'
ORDER BY relevance DESC
LIMIT 10;
```

This query returns the top 10 rows most relevant to the search terms, ranked by BM25 score.

---

## Result Interpretation

* **Score range** – BM25 scores are positive and unbounded. Only relative magnitude matters.
* **Multiple terms** – For multi-term queries, the total score is the sum of all term scores.
* **Length effect** – Shorter rows generally receive higher scores when containing the same terms.
* **No matching terms** – If none of the query terms appear in the table, the score is `0`.

