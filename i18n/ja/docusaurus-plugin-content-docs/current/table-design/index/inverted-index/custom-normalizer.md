---
{
    "title": "カスタムノーマライザー",
    "language": "ja",
    "description": "Doris の転置インデックスで使用するカスタムノーマライザーのガイド。テキスト全体を一つのトークンとして扱い、大文字と小文字の変換やアクセント記号の正規化など、キーワードの完全一致検索に対応します。"
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenario: Keyword exact match / Standardization preprocessing without tokenization -->

カスタムノーマライザーは、テキストに統一した前処理を適用します。テキストを**分割せず**、全体を一つのトークンとして扱います。文字フィルター（`char_filter`）とトークンフィルター（`token_filter`）を組み合わせることで、大文字と小文字の変換や文字の正規化などを行えます。キーワード検索のように、トークン分割は不要でも表記の正規化が必要な場合によく使用します。

**ノーマライザーとアナライザーの違い**

| 比較項目 | ノーマライザー | アナライザー |
| --- | --- | --- |
| テキストの分割 | 分割せず、テキスト全体を一つのトークンとして扱う | 規則に従って複数のトークンに分割する |
| 主な用途 | キーワードの完全一致検索（商品コード、ID など） | 全文検索（記事本文など） |
| 一般的なフィルター | lowercase、ascii_folding など | tokenizer と各種フィルター |

## 適用シナリオ

- **キーワード検索**：トークン分割は不要でも表記の統一が必要な商品コード、商品名、ユーザー ID などのフィールド。
- **大文字と小文字を区別しない照合**：`ProductA` と `producta` を同じ値として扱います。
- **アクセント記号や特殊文字の正規化**：`Café` を `cafe` に正規化し、記号の違いによる検索漏れを防ぎます。

## 使用手順

手順は次の三つです。

1. （任意）カスタムの `char_filter` と `token_filter` を作成します。
2. これらのフィルターを組み合わせたカスタムノーマライザーを作成します。
3. テーブル作成文の転置インデックスのプロパティでノーマライザーを指定します。

### ステップ 1：カスタムフィルターを作成する（任意）

組み込みフィルターでは要件を満たせない場合は、先にカスタムフィルターを作成できます。

> `char_filter` と `token_filter` の作成方法は、[カスタムアナライザー](./custom-analyzer.md)を参照してください。

### ステップ 2：カスタムノーマライザーを作成する

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
    "char_filter" = "x_char_filter",          -- Optional, one or more character filters
    "token_filter" = "x_filter1, x_filter2"   -- Optional, one or more token filters, executed in order
);
```

**パラメータの説明**

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `char_filter` | いいえ | 一つ以上の文字フィルター名をカンマで区切って指定します。 |
| `token_filter` | いいえ | 一つ以上のトークンフィルター名を指定します。指定した順序で実行されます。 |

### ステップ 3：テーブル作成文でノーマライザーを指定する

転置インデックスのプロパティで、使用するノーマライザーを `normalizer` に指定します。

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```

:::caution Note
同じインデックスに `normalizer` と `analyzer` を同時に指定することはできません。
:::

## カスタムノーマライザーの管理

| 操作 | SQL 文 |
| --- | --- |
| 表示 | `SHOW INVERTED INDEX NORMALIZER;` |
| 削除 | `DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;` |

## 完全な例：大文字と小文字、アクセント記号を区別しない

**シナリオ**：商品名フィールドで、大文字と小文字、アクセント記号を区別しない完全一致検索を行います（たとえば、`Café-Products` と `cafe-products` を同じ値として扱います）。

**実装手順**：

1. アクセント記号を取り除くためのカスタムトークンフィルター `my_ascii_folding` を作成します。
2. ノーマライザー `lowercase_ascii_normalizer` を作成し、組み込みの `lowercase` フィルターと前のステップで作成した `my_ascii_folding` を組み合わせます。
3. テーブルを作成し、`product_name` フィールドにノーマライザーを適用します。
4. `tokenize` 関数で正規化の結果を確認します。

**SQL の例**：

```sql
-- 1. Create a custom token filter (when specific parameters are needed)
--    Here, create an ascii_folding filter
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. Create the normalizer
--    Combine lowercase (built-in) and my_ascii_folding
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS lowercase_ascii_normalizer
PROPERTIES
(
    "token_filter" = "lowercase, my_ascii_folding"
);

-- 3. Use the normalizer when creating a table
CREATE TABLE product_table (
    `id` bigint NOT NULL,
    `product_name` text NULL,
    INDEX idx_name (`product_name`) USING INVERTED PROPERTIES("normalizer" = "lowercase_ascii_normalizer")
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- 4. Verification test
select tokenize('Café-Products', '"normalizer"="lowercase_ascii_normalizer"');
```

**期待される結果**：

```json
[
    {"token":"cafe-products"}
]
```

このように、`Café-Products` は分割されずに一つのトークンとして処理され、大文字から小文字への変換とアクセント記号の除去が適用されます。

## 制限事項

1. `char_filter` と `token_filter` で参照する名前は、組み込みフィルター、または作成済みのフィルターの名前でなければなりません。
2. ノーマライザーを削除できるのは、どのテーブルでも使用されていない場合だけです。
3. `char_filter` または `token_filter` を削除できるのは、どのノーマライザーからも参照されていない場合だけです。
4. カスタムノーマライザーの作成文を実行してから、BE に同期されるまで約 10 秒かかります。その後に取り込まれたデータには通常どおり適用されます。
5. 同じ転置インデックスに `normalizer` と `analyzer` を同時に指定することはできません。
