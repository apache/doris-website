---
{
  "title": "全文検索演算子",
  "language": "ja",
  "description": "全文検索演算子は、列が指定された全文検索条件（キーワード、フレーズなど）を満たすかどうかを判定し、結果はTRUEとなります。"
}
---
## 説明

全文検索演算子は、列が指定された全文検索条件（キーワード、フレーズなど）を満たすかどうかを判定し、結果はTRUE、FALSE、またはUNKNOWNになります。

制限事項：

1. 左オペランドは列名である必要があり、右オペランドは文字列リテラルである必要があります。
2. WHERE句でのみ使用でき、SELECT、GROUP BY、ORDER BYなどの他の句では使用できません。WHERE句では、AND、OR、NOT論理演算を使用して他の条件と組み合わせることができます。

## 演算子の紹介

| 演算子 | 機能 | 例 |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| MATCH | MATCH_ANYと同等 | `SELECT * FROM t WHERE column1 MATCH 'word1 word2'` |
| `<column_name>` MATCH_ANY `<string_literal>` | column_nameのindexトークナイザーに従ってcolumn_nameとstring_literalをトークン化します。column_nameの任意のトークンがstring_literalのトークン化後の任意の単語を含む場合、結果はTRUE、そうでなければFALSEです。 | `SELECT * FROM t WHERE column1 MATCH_ANY 'word1 word2'` |
| `<column_name>` MATCH_ALL `<string_literal>` | column_nameのindexトークナイザーに従ってcolumn_nameとstring_literalをトークン化します。column_nameのすべてのトークンがstring_literalのトークン化後のすべての単語を含む場合、結果はTRUE、そうでなければFALSEです。 | `SELECT * FROM t WHERE column1 MATCH_ALL 'word1 word2'` |
| `<column_name>` MATCH_PHRASE `<string_literal>` | column_nameのindexトークナイザーに従ってcolumn_nameとstring_literalをトークン化します。column_nameのすべてのトークンがstring_literalのトークン化後のすべての単語を含み、かつ単語の順序が一致している（つまりフレーズ）場合、結果はTRUE、そうでなければFALSEです。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE 'word1 word2'` |
| `<column_name>` MATCH_PHRASE_PREFIX `<string_literal>` | MATCH_PHRASEの拡張で、string_literalのトークン化後の最後の単語が完全な単語ではなく接頭辞のみマッチすることを許可します。Web検索エンジンのサジェスト機能に類似しています。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE_PREFIX 'word1 wor'` |
| `<column_name>` MATCH_PHRASE_EDGE `<string_literal>` | MATCH_PHRASE_PREFIXの拡張で、string_literalのトークン化後の最初の単語が接尾辞とマッチし、最後の単語が接頭辞とマッチすることを許可します。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE_EDGE 'rd wor'` |
| `<column_name>` MATCH_REGEXP `<string_literal>` | MATCH_ANYの拡張で、string_literalが正規表現を指定し、column_nameのトークンが正規表現とマッチします。 | `SELECT * FROM t WHERE column1 MATCH_REGEXP 'word.'` |
