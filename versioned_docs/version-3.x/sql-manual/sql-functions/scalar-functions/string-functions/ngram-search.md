---
{
    "title": "NGRAM_SEARCH",
    "language": "en"
}
---

## Description

Calculate the N-gram similarity between `text` and `pattern`. The similarity ranges from 0 to 1, where a higher similarity indicates greater similarity between the two strings. 

Both `pattern` and `gram_num` must be constants. If the length of either `text` or `pattern` is less than `gram_num`, return 0.

N-gram similarity is a method for calculating text similarity based on N-grams. An N-gram is a set of continuous N characters or words extracted from a text string. For example, for the string "text" with N=2 (bigram), the bigrams are: {"te", "ex", "xt"}.

The N-gram similarity is calculated as:

2 * |Intersection| / (|text set| + |pattern set|)

where |text set| and |pattern set| are the N-grams of `text` and `pattern`, and `Intersection` is the intersection of the two sets.

Note that, by definition, a similarity of 1 does not necessarily mean the two strings are identical.

Only supports ASCII encoding.

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
