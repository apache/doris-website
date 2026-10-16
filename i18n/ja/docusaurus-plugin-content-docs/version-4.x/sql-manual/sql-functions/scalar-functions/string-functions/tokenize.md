---
{
    "title": "TOKENIZE",
    "language": "ja",
    "description": "TOKENIZE 関数は、指定したアナライザーで文字列をトークン化し、その結果を JSON 形式の文字列配列として返します。"
}
---

## 説明

`TOKENIZE` 関数は、指定したアナライザーで文字列をトークン化し、その結果を JSON 形式の文字列配列として返します。全文検索機能を備えた転置インデックスを使用する際に、テキストがどのように解析されるかを確認するのに役立ちます。

## 構文

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```

## パラメータ

- `str`: トークン化する入力文字列。型: `VARCHAR`
- `properties`: アナライザーの設定を指定するプロパティ文字列。型: `VARCHAR`

`properties` パラメータでは、次のキーと値のペアを指定できます（形式: `"key1"="value1", "key2"="value2"`）。

### 共通プロパティ

| プロパティ | 説明 | 値の例 |
|----------|-------------|----------------|
| `built_in_analyzer` | 組み込みアナライザーの種類 | `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"standard"`, `"none"` |
| `analyzer` | カスタムアナライザー名（`CREATE INVERTED INDEX ANALYZER` で作成） | `"my_custom_analyzer"` |
| `parser_mode` | パーサーモード（中国語アナライザー用） | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | フレーズ検索のサポートを有効にする（位置情報を保存） | `"true"`, `"false"` |
| `lower_case` | トークンを小文字に変換する | `"true"`, `"false"` |
| `char_filter_type` | 文字フィルターの種類 | フィルターによって異なる |
| `stop_words` | ストップワードの設定 | 実装によって異なる |

## 戻り値

トークン化結果の JSON 配列を含む `VARCHAR` を返します。配列の各要素は、次の構造を持つオブジェクトです。

- `token`: トークン化された語
- `position`: （省略可能）`support_phrase` が有効な場合のトークンの位置インデックス

## 使用例

### 例 1: 組み込みアナライザーを使用する

```sql
-- Using the standard analyzer
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```

```sql
-- Using the english analyzer
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```

```sql
-- Using the unicode analyzer with Chinese text
SELECT TOKENIZE("Apache Doris数据库", '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```

```sql
-- Using the chinese analyzer
SELECT TOKENIZE("我来到北京清华大学", '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```

```sql
-- Using the icu analyzer for multilingual text
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, {"token": "世界"}]
```

```sql
-- Using the basic analyzer
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, {"token": "hm"}, {"token": "bg"}, {"token": "jpg"}, {"token": "http"}, {"token": "1"}, {"token": "0"}]
```

```sql
-- Using the ik analyzer for Chinese text
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```

### 例 2: カスタムアナライザーを使用する

まず、カスタムアナライザーを作成します。

```sql
CREATE INVERTED INDEX ANALYZER lowercase_delimited
PROPERTIES (
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, lowercase"
);
```

次に、`TOKENIZE` で使用します。

```sql
SELECT TOKENIZE("FOO-BAR", '"analyzer"="lowercase_delimited"');
```
```
[{ "token": "foo" }, { "token": "bar" }]
```

### 例 3: フレーズ検索のサポートを有効にする（位置情報）

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```

## 注意事項

1. **アナライザーの設定**: `properties` パラメータには、有効なプロパティ文字列を指定する必要があります。カスタムアナライザーを使用する場合は、事前に `CREATE INVERTED INDEX ANALYZER` で作成する必要があります。

2. **サポートされるアナライザー**: 現在サポートされている組み込みアナライザーは次のとおりです。
   - `standard`: 一般的なテキスト向けの標準アナライザー
   - `english`: 語幹抽出を行う英語アナライザー
   - `chinese`: 中国語テキスト用アナライザー
   - `unicode`: 多言語テキスト向けの Unicode ベースのアナライザー
   - `icu`: 高度な Unicode 処理向けの ICU ベースのアナライザー
   - `basic`: 基本的なトークン化
   - `ik`: 中国語テキスト用の IK アナライザー
   - `none`: トークン化しない（元の文字列を単一のトークンとして返す）

3. **パフォーマンス**: `TOKENIZE` 関数は、主にアナライザー設定のテストとデバッグを目的としています。本番環境での全文検索には、`MATCH` または `SEARCH` 演算子とともに転置インデックスを使用してください。

4. **JSON 出力**: 出力は整形された JSON 文字列です。必要に応じて JSON 関数でさらに処理できます。

5. **転置インデックスとの互換性**: `TOKENIZE` で使用したものと同じアナライザー設定を、テーブル作成時に転置インデックスにも適用できます。
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("analyzer"="my_analyzer")
   )
   ```

6. **アナライザーの動作確認**: 転置インデックスを作成する前に `TOKENIZE` でテキストのトークン化結果を確認すると、データに適したアナライザーを選びやすくなります。

## 関連する関数

- [MATCH](../../../../sql-manual/basic-element/operators/conditional-operators/full-text-search-operators): 転置インデックスを使用した全文検索
- [SEARCH](../../../../table-design/index/inverted-index/search-function.md): DSL をサポートする高度な検索

## キーワード

TOKENIZE, 文字列, 全文検索, 転置インデックス, アナライザー
