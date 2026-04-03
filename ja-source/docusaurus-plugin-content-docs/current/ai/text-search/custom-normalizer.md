---
{
  "title": "カスタムノーマライザー",
  "language": "ja",
  "description": "カスタムノーマライザーは統一されたテキスト前処理に使用されます。"
}
---
## 概要

Custom Normalizerは統一されたテキスト前処理に使用され、通常はトークン化を必要とせず正規化が必要なシナリオ（キーワード検索など）で使用されます。Analyzerとは異なり、Normalizerはテキストを分割せず、テキスト全体を1つの完全なTokenとして処理します。character filtersとtoken filtersを組み合わせて、大文字小文字変換や文字正規化などの機能を実現することをサポートします。

## Custom Normalizerの使用

### 作成

custom normalizerは主にcharacter filters（`char_filter`）とtoken filters（`token_filter`）で構成されます。

> 注意: `char_filter`と`token_filter`の詳細な作成方法については、[Custom Analyzer]ドキュメントを参照してください。

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
  "char_filter" = "x_char_filter",          -- Optional, one or more character filters
  "token_filter" = "x_filter1, x_filter2"   -- Optional, one or more token filters, executed in order
);
```
### ビュー

```sql
SHOW INVERTED INDEX NORMALIZER;
```
### Drop

```sql
DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;
```
## テーブル作成での使用方法

転置インデックスプロパティで`normalizer`を使用してカスタムノーマライザーを指定します。

**注意**: `normalizer`と`analyzer`は相互排他的であり、同じインデックスで同時に指定することはできません。

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```
## 制限事項

1. `char_filter` と `token_filter` で参照される名前は存在する必要があります（組み込みまたは作成されたもの）。
2. normalizerは、それを使用しているテーブルがない場合のみ削除できます。
3. `char_filter` または `token_filter` は、それを使用しているnormalizerがない場合のみ削除できます。
4. カスタムnormalizer構文を使用した後、BEへの同期に約10秒かかり、その後インポート操作はエラーなく正常に機能します。

## 完全な例

### 例：大文字小文字の区別と特殊なアクセント記号の無視

この例では、テキストを小文字に変換し、アクセント記号を削除する（例：`Café` を `cafe` に正規化する）normalizerを作成する方法を示しており、大文字小文字を区別せず、アクセント記号を区別しない完全一致に適しています。

```sql
-- 1. Create a custom token filter (if specific parameters are needed)
-- Create an ascii_folding filter here
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. Create the normalizer
-- Combine lowercase (built-in) and my_ascii_folding
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS lowercase_ascii_normalizer
PROPERTIES
(
    "token_filter" = "lowercase, my_ascii_folding"
);

-- 3. Use in table creation
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

-- 4. Verify and test
select tokenize('Café-Products', '"normalizer"="lowercase_ascii_normalizer"');
```
結果:

```json
[
  {"token":"cafe-products"}
]
```
