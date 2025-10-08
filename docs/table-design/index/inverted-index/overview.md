---
{
    "title": "Inverted Index Overview",
    "language": "en"
}
---

## Indexing Principle

[Inverted Index](https://en.wikipedia.org/wiki/Inverted_index) is a commonly used indexing technique in the field of information retrieval. It divides text into individual words and constructs a word -> document IDs index, allowing for quick searches to determine which documents contain a specific word.

Starting from version 2.0.0, Doris supports inverted indexes, which can be used for full-text searches on text types, equality, and range queries on normal numerical and date types, and quickly filtering rows that meet the criteria from massive amounts of data.

In Doris's implementation of the inverted index, each row in the table corresponds to a document, and each column corresponds to a field in the document. Thus, using an inverted index, you can quickly locate rows containing specific keywords, thereby accelerating the WHERE clause.

Unlike other indexes in Doris, the inverted index uses independent files at the storage layer, corresponding one-to-one with data files but physically stored independently. This approach allows for creating and deleting indexes without rewriting data files, significantly reducing processing overhead.

## Usage Scenarios

Inverted indexes have a wide range of applications and can accelerate equality, range, and full-text searches (keyword matching, phrase matching, etc.). A table can have multiple inverted indexes, and the conditions of multiple inverted indexes can be combined arbitrarily during queries.

The functionality of inverted indexes is briefly introduced as follows:

**1. Accelerate full-text searches for string types**

- Support for keyword search, including matching multiple keywords simultaneously `MATCH_ALL` and matching any one keyword `MATCH_ANY`.

- Support for phrase queries `MATCH_PHRASE`
  - Support for specifying slop for word distence
  - Support for phrase + prefix `MATCH_PHRASE_PREFIX`

- Support for tokenized regular expression queries `MATCH_REGEXP`

- Support for English, Chinese, and Unicode tokenizers

**2. Accelerate normal equality and range queries, covering and replacing the functionality of BITMAP index**

- Support for fast filtering of string, numerical, and datetime types for =, !=, >, >=, <, <=

- Support for fast filtering of string, numerical, and datetime array types for `array_contains`

**3. Support for comprehensive logical combinations**

- Not only supports acceleration for AND conditions but also for OR and NOT conditions

- Supports arbitrary logical combinations of multiple conditions with AND, OR, NOT

**4. Flexible and efficient index management**

- Support for defining inverted indexes when creating a table

- Support for adding inverted indexes to existing tables, with incremental index construction without rewriting existing data in the table

- Support for deleting inverted indexes from existing tables without rewriting existing data in the table

:::tip

There are some limitations to using inverted indexes:

1. Floating-point types FLOAT and DOUBLE, which have precision issues, do not support inverted indexes due to inaccurate precision. The solution is to use the precisely accurate DECIMAL type, which supports inverted indexes.

2. Some complex data types do not yet support inverted indexes, including MAP, STRUCT, JSON, HLL, BITMAP, QUANTILE_STATE, AGG_STATE.

3. DUPLICATE and UNIQUE table models with Merge-on-Write enabled support building inverted indexes on any column. However, AGGREGATE and UNIQUE models without Merge-on-Write enabled only support building inverted indexes on Key columns, as non-Key columns cannot have inverted indexes. This is because these two models require reading all data for merging, so indexes cannot be used for pre-filtering.

:::
