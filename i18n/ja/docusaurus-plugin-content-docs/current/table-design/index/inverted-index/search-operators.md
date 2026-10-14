---
{
    "title": "全文検索とクエリ高速化の演算子",
    "language": "ja",
    "description": "Apache Doris の転置インデックスがサポートする全文検索とクエリ高速化の演算子のリファレンス。8 種類の検索演算子（MATCH_ANY/ALL/PHRASE/REGEXP など）がキーワード、フレーズ、プレフィックス、正規表現の検索に対応し、等価条件、範囲条件、配列に対する構造化クエリも高速化します。"
}
---

<!-- Knowledge type: Operator reference / Usage examples -->
<!-- Applicable scenarios: Full-text search query authoring / Inverted index query acceleration -->

このドキュメントでは、Apache Doris の転置インデックスがサポートするクエリ演算子を、次の二つのカテゴリに分けて説明します。

- **全文検索演算子**：キーワード、フレーズ、プレフィックス、正規表現など、テキストフィールドのあいまい一致に使用します。
- **転置インデックスによるクエリ高速化**：等価条件、範囲条件、集合、配列など、構造化フィールドの厳密な絞り込みに使用します。

## 全文検索演算子

次の表に、全文検索演算子とその主な用途を示します。

| 演算子 | 主な用途 | 一致条件 |
|------|----------|----------|
| `MATCH_ANY` | キーワードの「OR」検索 | いずれかのキーワードに一致すればよい |
| `MATCH_ALL` | キーワードの「AND」検索 | すべてのキーワードに一致する必要がある |
| `MATCH_PHRASE` | 厳密なフレーズ検索 | 語が隣接し、同じ順序で並ぶ |
| `MATCH_PHRASE`（slop 指定あり） | 語間のずれを許容するフレーズ検索 | 語の間に別の語が入ることを許容する |
| `MATCH_PHRASE`（語順固定） | 語順を固定したフレーズ検索 | 指定した語間の範囲内で語順を固定する |
| `MATCH_PHRASE_PREFIX` | 入力候補の提示／プレフィックス補完 | 最後の語をプレフィックスで照合する |
| `MATCH_REGEXP` | 語単位の正規表現検索 | トークン化した結果に正規表現を適用する |
| `MATCH_PHRASE_EDGE` | 語の前後を利用するあいまい検索 | 最初の語はサフィックス、中間の語は完全一致、最後の語はプレフィックスで照合する |

### キーワード検索：MATCH_ANY / MATCH_ALL

「複数のキーワードを指定し、それらの語を含むドキュメントを探す」場合に適しています。

- **MATCH_ANY**：いずれかのキーワードを含む行に一致します。

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
    ```

- **MATCH_ALL**：すべてのキーワードを同時に含む行に一致します。

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
    ```

### フレーズ検索：MATCH_PHRASE ファミリー

「キーワードが隣接するか、語順を保つ必要がある」厳密なフレーズ検索に適しています。

#### 厳密なフレーズ一致

語が隣接し、同じ順序で並ぶ必要があります。インデックスによる高速化を有効にするには、インデックスのプロパティで `"support_phrase" = "true"` を設定します。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```

#### Slop を指定したフレーズ一致

キーワードの間に最大 `slop` 語を挟むことができ、語順も変えられます。

```sql
-- Allow up to 3 words between keyword1 and keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```

#### 語順を固定したフレーズ一致

slop に `+` を組み合わせ、語順を固定します。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```

### プレフィックスとエッジの一致

「入力候補の提示」や「プレフィックス／サフィックスによるあいまい一致」などに適しています。

#### MATCH_PHRASE_PREFIX

最後の語をプレフィックスで照合するフレーズ一致です。語を一つだけ指定すると、その語に対するプレフィックス一致になります。

```sql
-- The last word matches by prefix
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- A single word degenerates into a prefix match
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```

#### MATCH_PHRASE_EDGE

フレーズの両端を照合します。一致条件は次のとおりです。

- 最初の語は**サフィックス**で照合する
- 中間の語は**完全一致**で照合する
- 最後の語は**プレフィックス**で照合する
- 語は隣接している必要がある

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```

### 正規表現による一致：MATCH_REGEXP

トークン化された語に対して正規表現で照合します。

```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```

## USING ANALYZER によるアナライザーの指定

単一のカラムに異なるアナライザーを使用する複数の転置インデックスを作成した場合、`USING ANALYZER` 句を使用して、クエリ時に使うアナライザーを指定できます。

### 構文

```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```

### 対応する演算子

すべての MATCH 演算子が `USING ANALYZER` 句に対応します。

- `MATCH` / `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `MATCH_PHRASE_EDGE`
- `MATCH_REGEXP`

### 組み込みアナライザー

| 名前 | 説明 |
|------|------|
| `none` | トークン化せずに完全一致で照合する |
| `standard` | 標準的なトークン化を行う |
| `chinese` | 中国語のトークン化を行う |

### 使用例

```sql
-- Use the standard analyzer (tokenizes the text)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER std_analyzer;

-- Use the keyword analyzer (exact match, no tokenization)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER kw_analyzer;

-- Combined with MATCH_PHRASE
SELECT * FROM articles WHERE content MATCH_PHRASE 'hello world' USING ANALYZER std_analyzer;

-- Use built-in analyzers
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
```

### 注意事項

- 指定したアナライザーに対応するインデックスが構築されていない場合、クエリは自動的にインデックスを使わない実行経路に切り替わります。結果は正しいままですが、実行速度は低下します。
- アナライザーを指定しない場合、システムは使用可能ないずれかのインデックスを使用します。

## 転置インデックスによるクエリ高速化

転置インデックスは全文検索に加えて、構造化フィールドの厳密な絞り込みも高速化できます。対応する演算子と関数は次のとおりです。

| カテゴリ | 演算子／関数 |
|------|---------------|
| 等価条件と集合 | `=`, `!=`, `IN`, `NOT IN` |
| 範囲条件 | `>`, `>=`, `<`, `<=`, `BETWEEN` |
| NULL 判定 | `IS NULL`, `IS NOT NULL` |
| 配列 | `array_contains`, `array_overlaps` |

使用例：

```sql
-- Range query
SELECT * FROM t WHERE price >= 100 AND price < 200;

-- Set query
SELECT * FROM t WHERE tags IN ('a', 'b', 'c');

-- Array query
SELECT * FROM t WHERE array_contains(attributes, 'color');
```
