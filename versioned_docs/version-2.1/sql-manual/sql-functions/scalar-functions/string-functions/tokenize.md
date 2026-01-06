---
{
    "title": "TOKENIZE",
    "language": "en",
    "description": "The TOKENIZE function tokenizes a string using a specified parser and returns the tokenization results as a string array."
}
---

## Description

The `TOKENIZE` function tokenizes a string using a specified parser and returns the tokenization results as a string array. This function is particularly useful for testing and understanding how text will be analyzed when using inverted indexes with full-text search capabilities.

## Syntax

```sql
ARRAY<VARCHAR> TOKENIZE(VARCHAR str, VARCHAR properties)
```

## Parameters

- `str`: The input string to be tokenized. Type: `VARCHAR`
- `properties`: A property string specifying the parser configuration. Type: `VARCHAR`

The `properties` parameter supports the following key-value pairs (format: `'key1'='value1', 'key2'='value2'` or `"key1"="value1", "key2"="value2"`):

### Supported Properties

| Property | Description | Example Values |
|----------|-------------|----------------|
| `parser` | Built-in parser type | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | Parser mode for Chinese parser | `"fine_grained"`, `"coarse_grained"` |
| `char_filter_type` | Character filter type | `"char_replace"` |
| `char_filter_pattern` | Characters to be replaced (used with `char_filter_type`) | `"._=:,"` |
| `char_filter_replacement` | Replacement character (used with `char_filter_type`) | `" "` (space) |
| `stopwords` | Stop words configuration | `"none"` |

## Return Value

Returns an `ARRAY<VARCHAR>` containing the tokenized strings as individual array elements.

## Examples

### Example 1: Using the Chinese parser

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese'");
```
```
["我", "来到", "北京", "清华大学"]
```

### Example 2: Chinese parser with fine-grained mode

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese', 'parser_mode'='fine_grained'");
```
```
["我", "来到", "北京", "清华", "清华大学", "华大", "大学"]
```

### Example 3: Using the Unicode parser

```sql
SELECT TOKENIZE('Apache Doris数据库', "'parser'='unicode'");
```
```
["apache", "doris", "数", "据", "库"]
```

### Example 4: Using character filters

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"parser"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
["get", "images", "hm", "bg", "jpg", "http", "1", "0", "test", "abc", "bcd"]
```

### Example 5: Stopwords configuration

```sql
SELECT TOKENIZE('华夏智胜新税股票A', '"parser"="unicode"');
```
```
["华", "夏", "智", "胜", "新", "税", "股", "票"]
```

```sql
SELECT TOKENIZE('华夏智胜新税股票A', '"parser"="unicode","stopwords" = "none"');
```
```
["华", "夏", "智", "胜", "新", "税", "股", "票", "a"]
```

## Notes

1. **Parser Configuration**: The `properties` parameter must be a valid property string. Only built-in parsers are supported in this version.

2. **Supported Parsers**: Version 2.1 supports the following built-in parsers:
   - `chinese`: Chinese text parser with optional `parser_mode` (`fine_grained` or `coarse_grained`)
   - `english`: English language parser with stemming
   - `unicode`: Unicode-based parser for multilingual text

3. **Parser Mode**: The `parser_mode` property is primarily used with the `chinese` parser:
   - `fine_grained`: Produces more detailed tokens with overlapping segments
   - `coarse_grained`: Default mode with standard segmentation

4. **Character Filters**: Use `char_filter_type`, `char_filter_pattern`, and `char_filter_replacement` together to replace specific characters before tokenization.

5. **Performance**: The `TOKENIZE` function is primarily intended for testing and debugging parser configurations. For production full-text search, use inverted indexes with the `MATCH` predicate.

6. **Compatibility with Inverted Indexes**: The same parser configuration used in `TOKENIZE` can be applied to inverted indexes when creating tables:
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("parser"="chinese")
   )
   ```

7. **Testing Parser Behavior**: Use `TOKENIZE` to preview how text will be tokenized before creating inverted indexes, helping to choose the most appropriate parser for your data.

## Keywords

TOKENIZE, STRING, FULL-TEXT SEARCH, INVERTED INDEX, PARSER
