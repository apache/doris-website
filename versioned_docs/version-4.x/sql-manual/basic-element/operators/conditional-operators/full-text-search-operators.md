---
{
    "title": "Full Text Search Operators",
    "language": "en",
    "description": "Full-text search operators determine whether a column meets specified full-text search conditions (keywords, phrases, etc.), with results being TRUE,"
}
---

## Description

Full-text search operators determine whether a column meets specified full-text search conditions (keywords, phrases, etc.), with results being TRUE, FALSE, or UNKNOWN.

Limitations:

1. The left operand must be a column name, and the right operand must be a string literal.
2. It can only be used in the WHERE clause and cannot be used in other clauses such as SELECT, GROUP BY, ORDER BY, etc. It can be combined with other conditions in the WHERE clause using AND, OR, NOT logical operations.

## Operator Introduction

| Operator | Function | Example |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| MATCH | Equivalent to MATCH_ANY | `SELECT * FROM t WHERE column1 MATCH 'word1 word2'` |
| `<column_name>` MATCH_ANY `<string_literal>` | Tokenizes column_name and string_literal according to column_name's index tokenizer. If any token from column_name contains any word after tokenization of string_literal, the result is TRUE, otherwise FALSE. | `SELECT * FROM t WHERE column1 MATCH_ANY 'word1 word2'` |
| `<column_name>` MATCH_ALL `<string_literal>` | Tokenizes column_name and string_literal according to column_name's index tokenizer. If all tokens from column_name contain every word after tokenization of string_literal, the result is TRUE, otherwise FALSE. | `SELECT * FROM t WHERE column1 MATCH_ALL 'word1 word2'` |
| `<column_name>` MATCH_PHRASE `<string_literal>` | Tokenizes column_name and string_literal according to column_name's index tokenizer. If all tokens from column_name contain every word after tokenization of string_literal and the order of words is consistent (i.e., a phrase), the result is TRUE, otherwise FALSE. | `SELECT * FROM t WHERE column1 MATCH_PHRASE 'word1 word2'` |
| `<column_name>` MATCH_PHRASE_PREFIX `<string_literal>` | An extension of MATCH_PHRASE, allowing the last word after tokenization of string_literal to match only a prefix rather than the whole word. Similar to the suggest feature of web search engines. | `SELECT * FROM t WHERE column1 MATCH_PHRASE_PREFIX 'word1 wor'` |
| `<column_name>` MATCH_PHRASE_EDGE `<string_literal>` | An extension of MATCH_PHRASE_PREFIX, allowing the first word after tokenization of string_literal to match a suffix and the last word to match a prefix. | `SELECT * FROM t WHERE column1 MATCH_PHRASE_EDGE 'rd wor'` |
| `<column_name>` MATCH_REGEXP `<string_literal>` | An extension of MATCH_ANY, where string_literal specifies a regular expression, and tokens from column_name match the regular expression. | `SELECT * FROM t WHERE column1 MATCH_REGEXP 'word.'` |