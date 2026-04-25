---
{
    "title": "全文检索操作符",
    "language": "zh-CN",
    "description": "全文检索操作符判断一个列是否满足指定的全文检索条件（关键词、短语等），结果可以是 TRUE、FALSE 或 UNKNOWN。"
}
---

## 描述

全文检索操作符判断一个列是否满足指定的全文检索条件（关键词、短语等），结果可以是 TRUE、FALSE 或 UNKNOWN。

限制：

1. 左操作数必须是一个列名，右操作数必须是字符串字面常量。
2. 只能用于 WHERE 子句，不能用于 SELECT、GROUP BY、ORDER BY 等其他子句。可以与 WHERE 子句中的其他条件进行 AND OR NOT 逻辑组合。

## 操作符介绍

| 操作符                                             | 作用                                                         | 示例                                                         |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| MATCH                                              | 等同 MATCH_ANY                                               | `SELECT * FROM t WHERE column1 MATCH 'word1 word2'`          |
| <column_name> MATCH_ANY <string_literal>           | 对 column_name 和 string_literal 按照 column_name 的索引分词器进行分词，如果 column_name 分出来的词包含 string_literal 分词后的任意一个词，结果为 TRUE，否则为 FALSE。 | `SELECT * FROM t WHERE column1 MATCH_ANY 'word1 word2'`      |
| <column_name> MATCH_ALL <string_literal>           | 对 column_name 和 string_literal 按照 column_name 的索引分词器进行分词，如果 column_name 分出来的词包含 string_literal 分词后的每一个词，结果为 TRUE，否则为 FALSE。 | `SELECT * FROM t WHERE column1 MATCH_ALL 'word1 word2'`      |
| <column_name> MATCH_PHRASE <string_literal>        | 对 column_name 和 string_literal 按照 column_name 的索引分词器进行分词，如果 column_name 分出来的词包含 string_literal 分词后的每一个词、而且词的顺序一致（即为短语），结果为 TRUE，否则为 FALSE。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE 'word1 word2'`   |
| <column_name> MATCH_PHRASE_PREFIX <string_literal> | MATCH_PHRASE 的扩展功能，允许 string_literal 分词后的最后一个词只匹配前缀而不是整个词。类似 Web 搜索引擎 suggest 的效果。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE_PREFIX 'word1 wor'` |
| <column_name> MATCH_PHRASE_EDGE <string_literal>   | MATCH_PHRASE_PREFIX 的扩展功能，允许 string_literal 分词后第一个词匹配后缀，最后一个词匹配前缀 | `SELECT * FROM t WHERE column1 MATCH_PHRASE_EDGE 'rd wor'`   |
| <column_name> MATCH_REGEXP <string_literal>        | MATCH_ANY 的扩展功能，string_literal 指定一个正则表达式，column_name 分出来的词与正则表达式匹配。 | `SELECT * FROM t WHERE column1 MATCH_REGEXP 'word.'`         |