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

For score calculation to take effect, the query must meet all three of the following conditions:

1. The `SELECT` clause explicitly calls the `score()` function.
2. The `WHERE` clause contains at least one `MATCH_*` condition.
3. The query is a Top-N query, and `ORDER BY` is based on the `score()` result.

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

`|d|` comes from norms, which an index stores as one byte per row for every indexed field. The byte is written for every row of the segment, including rows that hold no value for that field, so an index that covers many sparse fields also pays for the rows it never matches.

Norms are controlled per index with the `norms` property, which defaults to `true`:

| Index                                  | Norms written                                                    |
| -------------------------------------- | ---------------------------------------------------------------- |
| Tokenized index on an ordinary column  | Yes, unless the index sets `"norms" = "false"`                   |
| Tokenized index on a VARIANT path      | The same, unless the BE config below turns them off              |
| Non-tokenized index                    | Never                                                            |

A VARIANT path index is an index declared with `field_pattern`, together with the copy of it that each extracted subpath inherits. One segment holds one such index per path, so writing norms there costs `rows × paths` bytes. Turning on the BE config `inverted_index_skip_norms_for_variant` (default `false`, changeable at runtime) drops norms for every index on a VARIANT path, whatever that index's `norms` property says, so a cluster can reclaim that space without rewriting its index definitions.

The `norms` property decides per index, and the copy inherited by a subpath carries the property of the index it comes from:

```sql
-- drop record-length normalization for one VARIANT path
INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")

-- drop it for an ordinary column
INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "english", "norms" = "false")
```

Relevance scoring needs norms: a query that computes `score()` on a tokenized index returns an error when any segment it reads has no norms for that field, which includes a table where only some segments were written without them. `MATCH_*` filtering is not affected. Set `"norms" = "false"`, or turn the config on, only for indexes that are never ranked with `score()`. The property and the config apply to newly written segments; segments written earlier keep their norms until compaction rewrites them. Change either one only after every BE has been upgraded to a version that supports them.

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

1. Whether the `score()` function is called in `SELECT`.
2. Whether the `WHERE` clause contains a `MATCH_*` condition.
3. Whether `ORDER BY` is based on `score()`.
4. Whether the index is a tokenized inverted index.

**Q2: What is the difference between BM25 and TF-IDF?**

BM25 builds on TF-IDF by introducing two improvements: **term frequency saturation** and **length normalization**. These make the scores of long and short text more balanced and provide better robustness.

**Q3: Can scores be compared across queries?**

This is not recommended. BM25 scores depend on the specific query terms and the data distribution in the table. Absolute values are not comparable between different queries. **Compare relative magnitudes only within the result set of the same query.**
