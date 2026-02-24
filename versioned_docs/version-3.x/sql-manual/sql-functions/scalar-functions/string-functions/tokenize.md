---
{
    "title": "TOKENIZE",
    "language": "en",
    "description": "The TOKENIZE function tokenizes a string using a specified parser/analyzer and returns the tokenization results."
}
---

## Description

The `TOKENIZE` function tokenizes a string using a specified parser/analyzer and returns the tokenization results. This function is particularly useful for testing and understanding how text will be analyzed when using inverted indexes with full-text search capabilities.

:::tip Version Differences
The behavior of `TOKENIZE` differs between version 3.0 and 3.1+:
- **Version 3.0**: Uses `parser` parameter, returns simple string array
- **Version 3.1+**: Supports `built_in_analyzer` and custom `analyzer`, returns JSON object array with enhanced features

See the [Version 3.0 Specific Features](#version-30-specific-features) section for details on version 3.0 usage.
:::

---

## Version 3.1+ Features (Recommended)

### Syntax

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```

### Parameters

- `str`: The input string to be tokenized. Type: `VARCHAR`
- `properties`: A property string specifying the analyzer configuration. Type: `VARCHAR`

The `properties` parameter supports the following key-value pairs (format: `"key1"="value1", "key2"="value2"`):

| Property | Description | Example Values |
|----------|-------------|----------------|
| `built_in_analyzer` | Built-in analyzer type | `"standard"`, `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"none"` |
| `analyzer` | Custom analyzer name (created via `CREATE INVERTED INDEX ANALYZER`) | `"my_custom_analyzer"` |
| `parser` | Built-in parser type (backward compatible) | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | Parser mode for Chinese parser | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | Enable phrase support (stores position information) | `"true"`, `"false"` |
| `lower_case` | Convert tokens to lowercase | `"true"`, `"false"` |
| `char_filter_type` | Character filter type | `"char_replace"` |
| `char_filter_pattern` | Characters to be replaced (used with `char_filter_type`) | `"._=:,"` |
| `char_filter_replacement` | Replacement character (used with `char_filter_type`) | `" "` (space) |
| `stopwords` | Stop words configuration | `"none"` |

### Return Value

Returns a `VARCHAR` containing a JSON array of tokenization results. Each element in the array is an object with the following structure:
- `token`: The tokenized term
- `position`: (Optional) The position index of the token when `support_phrase` is enabled

### Examples

#### Example 1: Using built-in analyzers

```sql
-- Standard analyzer
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```

```sql
-- English analyzer with stemming
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```

```sql
-- Chinese analyzer
SELECT TOKENIZE('我来到北京清华大学', '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```

```sql
-- Unicode analyzer
SELECT TOKENIZE('Apache Doris数据库', '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```

```sql
-- ICU analyzer for multilingual text
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, { "token": "世界" }]
```

```sql
-- Basic analyzer
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, { "token": "hm" }, { "token": "bg" }, { "token": "jpg" }, { "token": "http" }, { "token": "1" }, { "token": "0" }]
```

```sql
-- IK analyzer for Chinese text
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```

#### Example 2: Chinese parser with fine-grained mode

```sql
SELECT TOKENIZE('我来到北京清华大学', '"built_in_analyzer"="chinese", "parser_mode"="fine_grained"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华" }, { "token": "清华大学" }, { "token": "华大" }, { "token": "大学" }]
```

#### Example 3: Using character filters

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"built_in_analyzer"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
[{ "token": "get" }, { "token": "images" }, { "token": "hm" }, { "token": "bg" }, { "token": "jpg" }, { "token": "http" }, { "token": "1" }, { "token": "0" }, { "token": "test" }, { "token": "abc" }, { "token": "bcd" }]
```

#### Example 4: With phrase support (position information)

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```

#### Example 5: Using custom analyzers

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

---

## Version 3.0 Specific Features

:::info
Version 3.0 has limited functionality compared to 3.1+. It's recommended to upgrade to 3.1+ for enhanced features.
:::

### Syntax

```sql
ARRAY<VARCHAR> TOKENIZE(VARCHAR str, VARCHAR properties)
```

### Parameters

The `properties` parameter in version 3.0 supports:

| Property | Description | Example Values |
|----------|-------------|----------------|
| `parser` | Built-in parser type | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | Parser mode for Chinese parser | `"fine_grained"`, `"coarse_grained"` |
| `char_filter_type` | Character filter type | `"char_replace"` |
| `char_filter_pattern` | Characters to be replaced | `"._=:,"` |
| `char_filter_replacement` | Replacement character | `" "` (space) |
| `stopwords` | Stop words configuration | `"none"` |

**Not supported in version 3.0:**
- `built_in_analyzer` parameter
- `analyzer` parameter (custom analyzers)
- `support_phrase` parameter
- `lower_case` parameter
- Additional analyzers: `icu`, `basic`, `ik`, `standard`

### Return Value

Returns an `ARRAY<VARCHAR>` containing the tokenized strings as individual array elements (simple string array, not JSON objects).

### Examples

#### Example 1: Using the Chinese parser

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese'");
```
```
["我", "来到", "北京", "清华大学"]
```

#### Example 2: Chinese parser with fine-grained mode

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese', 'parser_mode'='fine_grained'");
```
```
["我", "来到", "北京", "清华", "清华大学", "华大", "大学"]
```

#### Example 3: Using the Unicode parser

```sql
SELECT TOKENIZE('Apache Doris数据库', "'parser'='unicode'");
```
```
["apache", "doris", "数", "据", "库"]
```

#### Example 4: Using character filters

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"parser"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
["get", "images", "hm", "bg", "jpg", "http", "1", "0", "test", "abc", "bcd"]
```

#### Example 5: Stopwords configuration

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

---

## Notes

1. **Version Compatibility**:
   - Version 3.0 uses `parser` parameter and returns simple string arrays
   - Version 3.1+ supports both `parser` (backward compatible) and `built_in_analyzer`, returns JSON object arrays
   - Version 3.1+ adds custom analyzers, additional built-in analyzers, and phrase support

2. **Supported Analyzers**:
   - **Version 3.0**: `chinese`, `english`, `unicode`
   - **Version 3.1+**: `standard`, `english`, `chinese`, `unicode`, `icu`, `basic`, `ik`, `none`

3. **Parser Mode**: The `parser_mode` property is primarily used with the `chinese` parser:
   - `fine_grained`: Produces more detailed tokens with overlapping segments
   - `coarse_grained`: Default mode with standard segmentation

4. **Character Filters**: Use `char_filter_type`, `char_filter_pattern`, and `char_filter_replacement` together to replace specific characters before tokenization.

5. **Performance**: The `TOKENIZE` function is primarily intended for testing and debugging parser configurations. For production full-text search, use inverted indexes with the `MATCH` predicate.

6. **Compatibility with Inverted Indexes**: The same parser/analyzer configuration can be applied to inverted indexes:
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("parser"="chinese")
   )
   ```

7. **Testing Parser Behavior**: Use `TOKENIZE` to preview how text will be tokenized before creating inverted indexes.

## Keywords

TOKENIZE, STRING, FULL-TEXT SEARCH, INVERTED INDEX, PARSER, ANALYZER
