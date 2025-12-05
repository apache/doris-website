---
{
    "title": "CREATE INDEX",
    "language": "en"
}
---

## Description

Create a new index on a table. The table name and index name must be specified. Optionally, you can specify the index type, properties, and comments.

## Syntax


```sql
CREATE INDEX [IF NOT EXISTS] <index_name> 
             ON <table_name> (<column_name> [, ...])
             [USING {INVERTED | NGRAM_BF | ANN}]
             [PROPERTIES ("<key>" = "<value>"[ , ...])]
             [COMMENT '<index_comment>']
```

## Required Parameters

**1. `<index_name>`**

> Specifies the identifier (i.e., name) of the index, which must be unique within its table.
>
> The identifier must start with a letter character (if Unicode name support is enabled, it can be any character from any language) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot be a reserved keyword.
>
> For more details, refer to the requirements for identifiers and reserved keywords.

**2. `<table_name>`**

> Specifies the identifier (i.e., name) of the table, which must be unique within its database.
>
> The identifier must start with a letter character (if Unicode name support is enabled, it can be any character from any language) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot be a reserved keyword.
>
> For more details, refer to the requirements for identifiers and reserved keywords.

**3. `<column_name> [, ...]`**

> Specifies the columns on which the index is created (currently only one column is supported), and the column must be unique within its table.
>
> The identifier must start with a letter character (if Unicode name support is enabled, it can be any character from any language) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot be a reserved keyword.
>
> For more details, refer to the requirements for identifiers and reserved keywords.

## Optional Parameters

**1. `USING {INVERTED | NGRAM_BF}`**

> Specifies the index type. Currently, two types are supported: **INVERTED** (inverted index) and **NGRAM_BF** (ngram bloomfilter index).

**2. `PROPERTIES ("<key>" = "<value>"[ ,  ...])`**

> Specifies the parameters of the index using the general PROPERTIES format. For the parameters and semantics supported by each index, refer to the documentation for the specific index type.

**3. `COMMENT '<index_comment>'`**

> Specifies a comment for the index to facilitate maintenance.

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege  | Object | Notes                                                |
| ---------- | ------ | ---------------------------------------------------------- |
| ALTER_PRIV | Table  | CREATE INDEX is considered an ALTER operation on the table |

## Usage Notes

- The **INVERTED** inverted index takes effect immediately for newly inserted data. For historical data, the index needs to be built using the BUILD INDEX operation.
- The **NGRAM_BF** NGram BloomFilter index will perform a schema change in the background on all data to complete the index construction after creation. The progress can be checked using SHOW ALTER TABLE COLUMN.

## Examples

- Create an inverted index `index1` on `table1`

  

  ```sql
  CREATE INDEX index1 ON table1 USING INVERTED;
  ```

- Create an NGram BloomFilter index `index2` on `table1`

  

  ```sql
  CREATE INDEX index2 ON table1 USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024");
  ```


- Create an ANN index `index3` on `table1` (`embedding`) vector column.


  ```sql
  CREATE INDEX index3 ON table1 (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128"
  );
    ```
