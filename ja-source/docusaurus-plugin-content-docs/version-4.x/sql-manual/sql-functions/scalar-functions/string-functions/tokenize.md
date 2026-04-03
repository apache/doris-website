---
{
  "title": "TOKENIZE",
  "description": "TOKENIZE関数は、指定されたアナライザを使用して文字列をトークン化し、トークン化の結果をJSON形式の文字列配列として返します。",
  "language": "ja"
}
---
## デスクリプション

`TOKENIZE`関数は、指定されたアナライザーを使用して文字列をトークン化し、トークン化結果をJSON形式の文字列配列として返します。この関数は、全文検索機能を持つ転置インデックスを使用する際に、テキストがどのように解析されるかを理解するのに特に有用です。

## Syntax

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```
## パラメータ

- `str`: トークン化する入力文字列。型: `VARCHAR`
- `properties`: アナライザー設定を指定するプロパティ文字列。型: `VARCHAR`

`properties`パラメータは以下のキーバリューペア（形式: `"key1"="value1", "key2"="value2"`）をサポートします:

### 共通プロパティ

| プロパティ | 説明 | 値の例 |
|----------|------|--------|
| `built_in_analyzer` | 組み込みアナライザータイプ | `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"standard"`, `"none"` |
| `analyzer` | カスタムアナライザー名（`CREATE INVERTED INDEX ANALYZER`で作成） | `"my_custom_analyzer"` |
| `parser_mode` | パーサーモード（chineseアナライザー用） | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | フレーズサポートを有効化（位置情報を保存） | `"true"`, `"false"` |
| `lower_case` | トークンを小文字に変換 | `"true"`, `"false"` |
| `char_filter_type` | 文字フィルタータイプ | フィルターにより異なる |
| `stop_words` | ストップワード設定 | 実装により異なる |

## 戻り値

トークン化結果のJSON配列を含む`VARCHAR`を返します。配列の各要素は以下の構造を持つオブジェクトです:

- `token`: トークン化された語句
- `position`: （オプション）`support_phrase`が有効な場合のトークンの位置インデックス

## 例

### 例1: 組み込みアナライザーの使用

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
### 例2: カスタムアナライザーの使用

まず、カスタムアナライザーを作成します：

```sql
CREATE INVERTED INDEX ANALYZER lowercase_delimited
PROPERTIES (
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, lowercase"
);
```
その後、`TOKENIZE`で使用します：

```sql
SELECT TOKENIZE("FOO-BAR", '"analyzer"="lowercase_delimited"');
```
```
[{ "token": "foo" }, { "token": "bar" }]
```
### 例3: フレーズサポート付き（位置情報）

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```
## 注意事項

1. **アナライザー設定**: `properties`パラメータは有効なプロパティ文字列である必要があります。カスタムアナライザーを使用する場合は、事前に`CREATE INVERTED INDEX ANALYZER`を使用して作成する必要があります。

2. **サポートされているアナライザー**: 現在サポートされている組み込みアナライザーには以下が含まれます：
   - `standard`: 一般的なテキスト用の標準アナライザー
   - `english`: ステミング機能付きの英語アナライザー
   - `chinese`: 中国語テキストアナライザー
   - `unicode`: 多言語テキスト用のUnicodeベースアナライザー
   - `icu`: 高度なUnicode処理用のICUベースアナライザー
   - `basic`: 基本的なトークン化
   - `ik`: 中国語テキスト用のIKアナライザー
   - `none`: トークン化なし（元の文字列を単一トークンとして返す）

3. **パフォーマンス**: `TOKENIZE`関数は主にアナライザー設定のテストとデバッグを目的としています。本番環境での全文検索には、`MATCH`または`SEARCH`演算子を使用したinverted indexesを使用してください。

4. **JSON出力**: 出力は整形されたJSON文字列で、必要に応じてJSON関数を使用してさらに処理できます。

5. **Inverted Indexesとの互換性**: `TOKENIZE`で使用されるのと同じアナライザー設定は、Table作成時にinverted indexesに適用できます：

   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("analyzer"="my_analyzer")
   )
   ```
6. **Analyzer動作のテスト**: `TOKENIZE`を使用して、転置インデックスを作成する前にテキストがどのようにトークン化されるかをプレビューし、データに最も適したanalyzerの選択に役立てます。

## 関連関数

- [MATCH](../../../../sql-manual/basic-element/operators/conditional-operators/full-text-search-operators): 転置インデックスを使用した全文検索
- [SEARCH](../../../../ai/text-search/search-function): DSLサポートを備えた高度な検索

## キーワード

TOKENIZE, STRING, FULL-TEXT SEARCH, INVERTED INDEX, ANALYZER
