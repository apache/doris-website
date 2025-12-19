---
{
    "title": "TOKENIZE",
    "language": "en",
    "description": "The TOKENIZE function tokenizes a string using a specified analyzer and returns the tokenization results as a JSON-formatted string array."
}
---

## Description

The `TOKENIZE` function tokenizes a string using a specified analyzer and returns the tokenization results as a JSON-formatted string array. This function is particularly useful for understanding how text will be analyzed when using inverted indexes with full-text search capabilities.

## Syntax

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```

## Parameters

- `str`: The input string to be tokenized. Type: `VARCHAR`
- `properties`: A property string specifying the analyzer configuration. Type: `VARCHAR`

The `properties` parameter supports the following key-value pairs (format: `"key1"="value1", "key2"="value2"`):

### Common Properties

| Property | Description | Example Values |
|----------|-------------|----------------|
| `built_in_analyzer` | Built-in analyzer type | `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"standard"`, `"none"` |
| `analyzer` | Custom analyzer name (created via `CREATE INVERTED INDEX ANALYZER`) | `"my_custom_analyzer"` |
| `parser_mode` | Parser mode (for chinese analyzers) | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | Enable phrase support (stores position information) | `"true"`, `"false"` |
| `lower_case` | Convert tokens to lowercase | `"true"`, `"false"` |
| `char_filter_type` | Character filter type | Varies by filter |
| `stop_words` | Stop words configuration | Varies by implementation |

## Return Value

Returns a `VARCHAR` containing a JSON array of tokenization results. Each element in the array is an object with the following structure:

- `token`: The tokenized term
- `position`: (Optional) The position index of the token when `support_phrase` is enabled

## Examples

### Example 1: Using built-in analyzers

```sql
-- Using the standard analyzer
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```

```sql
-- Using the english analyzer
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```

```sql
-- Using the unicode analyzer with Chinese text
SELECT TOKENIZE("Apache Doris数据库", '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```

```sql
-- Using the chinese analyzer
SELECT TOKENIZE("我来到北京清华大学", '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```

```sql
-- Using the icu analyzer for multilingual text
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, {"token": "世界"}]
```

```sql
-- Using the basic analyzer
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, {"token": "hm"}, {"token": "bg"}, {"token": "jpg"}, {"token": "http"}, {"token": "1"}, {"token": "0"}]
```

```sql
-- Using the ik analyzer for Chinese text
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```

### Example 2: Using custom analyzers

First, create a custom analyzer:

```sql
CREATE INVERTED INDEX ANALYZER lowercase_delimited
PROPERTIES (
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, lowercase"
);
```

Then use it with `TOKENIZE`:

```sql
SELECT TOKENIZE("FOO-BAR", '"analyzer"="lowercase_delimited"');
```
```
[{ "token": "foo" }, { "token": "bar" }]
```

### Example 3: With phrase support (position information)

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```

## Notes

1. **Analyzer Configuration**: The `properties` parameter must be a valid property string. If using a custom analyzer, it must be created beforehand using `CREATE INVERTED INDEX ANALYZER`.

2. **Supported Analyzers**: Currently supported built-in analyzers include:
   - `standard`: Standard analyzer for general text
   - `english`: English language analyzer with stemming
   - `chinese`: Chinese text analyzer
   - `unicode`: Unicode-based analyzer for multilingual text
   - `icu`: ICU-based analyzer for advanced Unicode processing
   - `basic`: Basic tokenization
   - `ik`: IK analyzer for Chinese text
   - `none`: No tokenization (returns original string as single token)

3. **Performance**: The `TOKENIZE` function is primarily intended for testing and debugging analyzer configurations. For production full-text search, use inverted indexes with the `MATCH` or `SEARCH` operators.

4. **JSON Output**: The output is a formatted JSON string that can be further processed using JSON functions if needed.

5. **Compatibility with Inverted Indexes**: The same analyzer configuration used in `TOKENIZE` can be applied to inverted indexes when creating tables:
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("analyzer"="my_analyzer")
   )
   ```

6. **Testing Analyzer Behavior**: Use `TOKENIZE` to preview how text will be tokenized before creating inverted indexes, helping to choose the most appropriate analyzer for your data.

## Related Functions

- [MATCH](../../../../sql-manual/basic-element/operators/conditional-operators/full-text-search-operators): Full-text search using inverted indexes
- [SEARCH](../../../../ai/text-search/search-function): Advanced search with DSL support

## Keywords

TOKENIZE, STRING, FULL-TEXT SEARCH, INVERTED INDEX, ANALYZER
