---
{
    "title": "文本检索算子",
    "language": "zh-CN"
}
---

## 全文索引检索算子

| 算子 | 典型用途 | 语法示例 | 额外说明 |
|------|---------|---------|---------|
| **MATCH_ANY** | 匹配包含任一关键词的文档 | `SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';` | 返回 content 列中包含 keyword1 或 keyword2 中至少一个的所有行。比如包含 "keyword1" 或者 "keyword2" 或两者都包含的文档都能匹配 |
| **MATCH_ALL** | 匹配同时包含所有关键词的文档 | `SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';` | 返回 content 列中同时包含 keyword1 和 keyword2 的所有行。只有两个关键词都出现的行才会匹配 |
| **MATCH_PHRASE** | 短语匹配，关键词按顺序相邻 | `SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';` | 例如 "keyword1 keyword2", "wordx keyword1 keyword2", "wordx keyword1 keyword2 wordy" 能匹配，因为 keyword2 必须紧跟 keyword1 后面。注意必须在 PROPERTIES 中开启 "support_phrase" = "true" |
| **MATCH_PHRASE slop** | 松散短语匹配，允许关键词之间有间隔，但间隔词数不超过指定的slop值 | `SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';` | slop=3，表示 keyword1 和 keyword2 之间最多可以隔3个词。'keyword1 keyword2', 'keyword1 a keyword2', 'keyword1 a b c keyword2' 等都能匹配，因为 keyword1 keyword2 中间隔的词分别是 0 1 3 都不超过 3。'keyword2 keyword1', 'keyword2 a keyword1', 'keyword2 a b c keyword1' 也能匹配，因为指定 slop > 0 时不再要求 keyword1 keyword2 的顺序。若用正号 +，则要求关键词顺序固定 |
| **MATCH_PHRASE slop 顺序严格模式** | 松散短语匹配，但严格保持关键词顺序 | `SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';` | slop=3 且顺序严格，"keyword1 a b c keyword2" 能匹配，但 "keyword2 a b c keyword1" 不能匹配，因为顺序反了 |
| **MATCH_PHRASE_PREFIX** | 短语匹配，但最后一个词允许前缀匹配 | `SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 keyword';` | "keyword1 keyword2abc", "keyword1 keyword2" 能匹配，因为 keyword2abc 和 keyword2 都满足 keyword2 的前缀匹配，而 "keyword1 keyword3" 无法匹配 |
| **MATCH_PHRASE_PREFIX 单词退化模式** | 如果只指定一个词，会退化为该词的前缀匹配 | `SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';` | 只匹配以 keyword1 开头的词 |
| **MATCH_REGEXP** | 正则匹配查询词的模式，记住这里的查询词不分词 | `SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';` | 匹配任何以 "key_word" 开头的词，例如 "key_word", "key_words", 而keyword不会匹配，就算_是stop word |
| **MATCH_PHRASE_EDGE** | 对标ES query_string，边缘短语匹配，匹配以指定短语作为完整单词边界的文档 | `SELECT * FROM table WHERE column MATCH_PHRASE_EDGE 'GET';` | 假设我们有以下行（字段名为 content）：<br/>1. "The quick brown fox jumps over the lazy dog."<br/>2. "Spotlight on new lighthouse project."<br/>3. "Research shows search engine optimization is key."<br/>4. "Doris is a powerful SQL database."<br/><br/>用户查询: `content MATCH_PHRASE_EDGE 'search engine optim'`<br/><br/>**原理:**<br/>- 第一个词 "search" 被视为后缀词，匹配 "research" 和 "search"<br/>- 中间词 "engine" 要求精确匹配<br/>- 最后一个词 "optim" 被视为前缀词，匹配 "optimization"<br/>- 同时phrase要求这三个词紧挨着<br/><br/>**匹配文档:** 文档3 "Research shows search engine optimization is key." |

## 查询加速

### 索引加速的运算符和函数列表

| 运算符 / 函数 | 倒排索引 | BloomFilter 索引 | NGram BloomFilter 索引 |
|--------------|---------|-----------------|----------------------|
| = | YES | YES | NO |
| != | YES | NO | NO |
| IN | YES | YES | NO |
| NOT IN | YES | NO | NO |
| >, >=, <, <=, BETWEEN | YES | NO | NO |
| IS NULL | YES | NO | NO |
| IS NOT NULL | YES | NO | NO |
| LIKE | NO | NO | YES |
| array_contains | YES | NO | NO |
| array_overlaps | YES | NO | NO |
| is_ip_address_in_range | YES | NO | NO |
