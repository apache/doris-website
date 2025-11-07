---
{
    "title": "NGRAM_SEARCH",
    "language": "zh-CN"
}
---

## Description

`DOUBLE ngram_search(VARCHAR text,VARCHAR pattern,INT gram_num)`

计算 text 和 pattern 的 N-gram 相似度。相似度从 0 到 1，相似度越高证明两个字符串越相似。
其中`pattern`，`gram_num`必须为常量。
如果`text`或者`pattern`的长度小于`gram_num`，返回 0。

N-gram 相似度（N-gram similarity）是一种基于 N-gram（N 元语法）的文本相似度计算方法。N-gram 是指将一个文本串分成连续的 N 个字符或词语的集合。例如，对于字符串“text”，当 N=2 时，其二元组（bi-gram）为：{“te”, “ex”, “xt”}。

N-gram 相似度的计算为 2 * |Intersection| / (|text set| + |pattern set|)

其中|text set|，|pattern set|为 text 和 pattern 的 N-gram，`Intersection`为两个集合的交集。

注意，根据定义，相似度为 1 不代表两个字符串相同。

仅支持 ASCII 编码。

## Syntax

`DOUBLE ngram_search(VARCHAR text,VARCHAR pattern,INT gram_num)`

## Example

```sql
mysql> select ngram_search('123456789' , '12345' , 3);
+---------------------------------------+
| ngram_search('123456789', '12345', 3) |
+---------------------------------------+
|                                   0.6 |
+---------------------------------------+

mysql> select ngram_search("abababab","babababa",2);
+-----------------------------------------+
| ngram_search('abababab', 'babababa', 2) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```
## keywords
    NGRAM_SEARCH,NGRAM,SEARCH
