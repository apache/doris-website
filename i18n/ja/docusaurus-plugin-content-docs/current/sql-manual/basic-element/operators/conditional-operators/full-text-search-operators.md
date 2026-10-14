---
{
    "title": "全文検索演算子",
    "language": "ja",
    "description": "全文検索演算子は、列が指定された全文検索条件（キーワードやフレーズなど）を満たすかどうかを判定し、TRUE、FALSE、または UNKNOWN を返します。"
}
---

## 説明

全文検索演算子は、列が指定された全文検索条件（キーワードやフレーズなど）を満たすかどうかを判定し、TRUE、FALSE、または UNKNOWN を返します。

制限事項：

1. 左オペランドには列名、右オペランドには文字列リテラルを指定する必要があります。
2. WHERE 句でのみ使用でき、SELECT、GROUP BY、ORDER BY などの句では使用できません。WHERE 句では、AND、OR、NOT の論理演算を使用して他の条件と組み合わせることができます。

## 演算子の概要

| 演算子 | 機能 | 例 |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| MATCH | MATCH_ANY と同等です。 | `SELECT * FROM t WHERE column1 MATCH 'word1 word2'` |
| `<column_name>` MATCH_ANY `<string_literal>` | column_name のインデックスに設定されたトークナイザーに従って、column_name と string_literal をトークン化します。column_name のいずれかのトークンが、string_literal をトークン化して得られたいずれかの単語を含む場合は TRUE、それ以外の場合は FALSE を返します。 | `SELECT * FROM t WHERE column1 MATCH_ANY 'word1 word2'` |
| `<column_name>` MATCH_ALL `<string_literal>` | column_name のインデックスに設定されたトークナイザーに従って、column_name と string_literal をトークン化します。column_name のすべてのトークンが、string_literal をトークン化して得られたすべての単語を含む場合は TRUE、それ以外の場合は FALSE を返します。 | `SELECT * FROM t WHERE column1 MATCH_ALL 'word1 word2'` |
| `<column_name>` MATCH_PHRASE `<string_literal>` | column_name のインデックスに設定されたトークナイザーに従って、column_name と string_literal をトークン化します。column_name のすべてのトークンが、string_literal をトークン化して得られたすべての単語を含み、単語の順序も一致する（つまりフレーズになっている）場合は TRUE、それ以外の場合は FALSE を返します。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE 'word1 word2'` |
| `<column_name>` MATCH_PHRASE_PREFIX `<string_literal>` | MATCH_PHRASE の拡張です。string_literal をトークン化して得られた最後の単語について、単語全体ではなくプレフィックスでの一致を許可します。Web 検索エンジンのサジェスト機能に似ています。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE_PREFIX 'word1 wor'` |
| `<column_name>` MATCH_PHRASE_EDGE `<string_literal>` | MATCH_PHRASE_PREFIX の拡張です。string_literal をトークン化して得られた最初の単語はサフィックス、最後の単語はプレフィックスでの一致を許可します。 | `SELECT * FROM t WHERE column1 MATCH_PHRASE_EDGE 'rd wor'` |
| `<column_name>` MATCH_REGEXP `<string_literal>` | MATCH_ANY の拡張です。string_literal で正規表現を指定し、column_name のトークンをその正規表現と照合します。 | `SELECT * FROM t WHERE column1 MATCH_REGEXP 'word.'` |
