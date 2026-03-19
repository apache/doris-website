---
{
  "title": "NGRAM_SEARCH",
  "description": "textとpattern間のN-gram類似度を計算します。類似度は0から1の範囲で、",
  "language": "ja"
}
---
## 説明

`text`と`pattern`間のN-gram類似度を計算します。類似度は0から1の範囲で、値が高いほど2つの文字列間の類似度が高いことを示します。

`pattern`と`gram_num`の両方は定数である必要があります。`text`または`pattern`の長さが`gram_num`未満の場合は0を返します。

N-gram類似度は、N-gramに基づいてテキストの類似度を計算する手法です。N-gramは、テキスト文字列から抽出された連続するN個の文字または単語の集合です。例えば、文字列"text"でN=2（bigram）の場合、bigramは次のようになります：{"te", "ex", "xt"}。

N-gram類似度は以下のように計算されます：

2 * |Intersection| / (|text set| + |pattern set|)

ここで、|text set|と|pattern set|は`text`と`pattern`のN-gramであり、`Intersection`は2つの集合の積集合です。

定義上、類似度が1であっても、必ずしも2つの文字列が同一であることを意味するわけではないことに注意してください。

ASCII エンコーディングのみサポートしています。

## 構文

`DOUBLE ngram_search(VARCHAR text,VARCHAR pattern,INT gram_num)`

## 例

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
