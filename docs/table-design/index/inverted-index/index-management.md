---
{
    "title": "Index Management",
    "language": "en"
}
---

## Defining Inverted Indexes When Creating a Table

In the table creation statement, after the COLUMN definition, is the index definition:

```sql
CREATE TABLE table_name
(
  column_name1 TYPE1,
  column_name2 TYPE2,
  column_name3 TYPE3,
  INDEX idx_name1(column_name1) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'],
  INDEX idx_name2(column_name2) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment']
)
table_properties;
```

Syntax explanation:

**1. `idx_column_name(column_name)` is mandatory, `column_name` is the name of the column for the index, must be a column defined earlier, `idx_column_name` is the index name, must be unique at the table level, recommended naming convention: prefix `idx_` before the column name**

**2. `USING INVERTED` is mandatory to specify that the index type is an inverted index**

**3. `PROPERTIES` is optional to specify additional properties of the inverted index, currently supported properties are:**

<details>
  <summary>parser: specifies the tokenizer</summary>
  <p>- By default, it is unspecified, meaning no tokenization</p>
  <p>- `english`: English tokenization, suitable for columns with English text, uses spaces and punctuation for tokenization, high performance</p>
  <p>- `chinese`: Chinese tokenization, suitable for columns with mainly Chinese text, lower performance than English tokenization</p>
  <p>- `unicode`: Unicode tokenization, suitable for mixed Chinese and English, and mixed multilingual texts. It can tokenize email prefixes and suffixes, IP addresses, and mixed character and number strings, and can tokenize Chinese by characters.</p>

  Tokenization results can be verified using the `TOKENIZE` SQL function, see the following sections for details.
</details>

<details>
  <summary>parser_mode</summary>

  **Specifies the tokenization mode, currently supported modes for `parser = chinese` are:**
  <p>- fine_grained: fine-grained mode, tends to generate shorter, more words, e.g., '武汉市长江大桥' will be tokenized into '武汉', '武汉市', '市长', '长江', '长江大桥', '大桥'</p>
  <p>- coarse_grained: coarse-grained mode, tends to generate longer, fewer words, e.g., '武汉市长江大桥' will be tokenized into '武汉市', '长江大桥'</p>
  <p>- default coarse_grained</p>
</details>

<details>
  <summary>support_phrase</summary>

  **Specifies whether the index supports MATCH_PHRASE phrase query acceleration**
  <p>- true: supported, but the index requires more storage space</p>
  <p>- false: not supported, more storage efficient, can use MATCH_ALL to query multiple keywords</p>
  <p>- From versions 2.0.14, 2.1.5 and 3.0.1, the default is true if parser is set. Otherwise default to false.</p>

  For example, the following example specifies Chinese tokenization, coarse-grained mode, and supports phrase query acceleration.
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "chinese", "parser_mode" = "coarse_grained", "support_phrase" = "true")
```
</details>

<details>
  <summary>char_filter</summary>

  **Specifies preprocessing the text before tokenization, usually to affect tokenization behavior**

  <p>char_filter_type: specifies different functional char_filters (currently only supports char_replace)</p>

  <p>char_replace replaces each char in the pattern with a char in the replacement</p>
  <p>- char_filter_pattern: characters to be replaced</p>
  <p>- char_filter_replacement: replacement character array, optional, defaults to a space character</p>

  For example, the following example replaces dots and underscores with spaces, thus treating them as word separators, affecting tokenization behavior.
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "unicode", "char_filter_type" = "char_replace", "char_filter_pattern" = "._", "char_filter_replacement" = " ")
```
`
</details>

<details>
  <summary>ignore_above</summary>

  **Specifies the length limit for non-tokenized string indexes (parser not specified)**
  <p>- Strings longer than the length set by ignore_above will not be indexed. For string arrays, ignore_above applies to each array element separately, and elements longer than ignore_above will not be indexed.</p>
  <p>- Default is 256, unit is bytes</p>

</details>

<details>
  <summary>lower_case</summary>

  **Whether to convert tokens to lowercase for case-insensitive matching**
  <p>- true: convert to lowercase</p>
  <p>- false: do not convert to lowercase</p>
  <p>- From versions 2.0.7 and 2.1.2, the default is true, automatically converting to lowercase. Earlier versions default to false.</p>
</details>

<details>
  <summary>stopwords</summary>

  **Specifying the stopword list to use, which will affect the behavior of the tokenizer**
  <p>- The default built-in stopword list includes meaningless words such as 'is,' 'the,' 'a,' etc. When writing or querying, the tokenizer will ignore words that are in the stopword list.</p>
  <p>- none: Use an empty stopword list</p>
</details>

**4. `COMMENT` is optional for specifying index comments**

## Adding Inverted Indexes to Existing Tables

**1. ADD INDEX**

Supports both `CREATE INDEX` and `ALTER TABLE ADD INDEX` syntax. The parameters are the same as those used when defining indexes during table creation.

```sql
-- Syntax 1
CREATE INDEX idx_name ON table_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
-- Syntax 2
ALTER TABLE table_name ADD INDEX idx_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
```

## Deleting Inverted Indexes from Existing Tables

```sql
-- Syntax 1
DROP INDEX idx_name ON table_name;
-- Syntax 2
ALTER TABLE table_name DROP INDEX idx_name;
```

:::tip

`DROP INDEX` deletes the index definition, so new data will no longer write to the index. This creates an asynchronous task to perform the index deletion, executed by multiple threads on each BE. The number of threads can be set using the BE parameter `alter_index_worker_count`, with a default value of 3.

:::

## Viewing Inverted Index

```sql
-- Syntax 1: The INDEX section in the table schema with USING INVERTED indicates an inverted index
SHOW CREATE TABLE table_name;

-- Syntax 2: IndexType as INVERTED indicates an inverted index
SHOW INDEX FROM idx_name;
```
