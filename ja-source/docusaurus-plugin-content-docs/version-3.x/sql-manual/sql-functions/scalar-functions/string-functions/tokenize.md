---
{
  "title": "TOKENIZE",
  "description": "TOKENIZE関数は、指定されたパーサー/アナライザーを使用して文字列をトークン化し、トークン化の結果を返します。",
  "language": "ja"
}
---
## 説明

`TOKENIZE`関数は、指定されたparser/analyzerを使用して文字列をトークン化し、トークン化の結果を返します。この関数は、全文検索機能を持つ転置インデックスを使用する際に、テキストがどのように解析されるかをテストし、理解するのに特に便利です。

:::tip バージョンの違い
`TOKENIZE`の動作はバージョン3.0と3.1+で異なります：
- **バージョン3.0**: `parser`パラメータを使用し、単純な文字列配列を返します
- **バージョン3.1+**: `built_in_analyzer`とカスタム`analyzer`をサポートし、拡張機能を持つJSONオブジェクト配列を返します

バージョン3.0の使用方法については、[バージョン3.0固有の機能](#version-30-specific-features)セクションを参照してください。
:::

---

## バージョン3.1+の機能（推奨）

### 構文

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```
### パラメータ

- `str`: トークン化される入力文字列。型: `VARCHAR`
- `properties`: アナライザー設定を指定するプロパティ文字列。型: `VARCHAR`

`properties`パラメータは以下のキー・バリューペアをサポートします（形式: `"key1"="value1", "key2"="value2"`）：

| プロパティ | 説明 | 値の例 |
|----------|-------------|----------------|
| `built_in_analyzer` | 組み込みアナライザータイプ | `"standard"`, `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"none"` |
| `analyzer` | カスタムアナライザー名（`CREATE INVERTED INDEX ANALYZER`で作成） | `"my_custom_analyzer"` |
| `parser` | 組み込みパーサータイプ（後方互換性のため） | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | 中国語パーサーのパーサーモード | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | フレーズサポートを有効化（位置情報を保存） | `"true"`, `"false"` |
| `lower_case` | トークンを小文字に変換 | `"true"`, `"false"` |
| `char_filter_type` | 文字フィルタータイプ | `"char_replace"` |
| `char_filter_pattern` | 置換対象の文字（`char_filter_type`と併用） | `"._=:,"` |
| `char_filter_replacement` | 置換文字（`char_filter_type`と併用） | `" "` (スペース) |
| `stopwords` | ストップワード設定 | `"none"` |

### 戻り値

トークン化結果のJSON配列を含む`VARCHAR`を返します。配列の各要素は以下の構造を持つオブジェクトです：
- `token`: トークン化された語句
- `position`: （オプション）`support_phrase`が有効な場合のトークンの位置インデックス

### 例

#### 例1: 組み込みアナライザーの使用

```sql
-- Standard analyzer
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```
```sql
-- English analyzer with stemming
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```
```sql
-- Chinese analyzer
SELECT TOKENIZE('我来到北京清华大学', '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```
```sql
-- Unicode analyzer
SELECT TOKENIZE('Apache Doris数据库', '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```
```sql
-- ICU analyzer for multilingual text
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, { "token": "世界" }]
```
```sql
-- Basic analyzer
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, { "token": "hm" }, { "token": "bg" }, { "token": "jpg" }, { "token": "http" }, { "token": "1" }, { "token": "0" }]
```
```sql
-- IK analyzer for Chinese text
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```
#### Example 2: 細粒度モードを使用した中国語パーサー

```sql
SELECT TOKENIZE('我来到北京清华大学', '"built_in_analyzer"="chinese", "parser_mode"="fine_grained"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华" }, { "token": "清华大学" }, { "token": "华大" }, { "token": "大学" }]
```
#### 例3: character filtersの使用

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"built_in_analyzer"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
[{ "token": "get" }, { "token": "images" }, { "token": "hm" }, { "token": "bg" }, { "token": "jpg" }, { "token": "http" }, { "token": "1" }, { "token": "0" }, { "token": "test" }, { "token": "abc" }, { "token": "bcd" }]
```
#### 例4: フレーズサポート使用時（位置情報）

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```
#### 例5: カスタムアナライザーの使用

最初に、カスタムアナライザーを作成します：

```sql
CREATE INVERTED INDEX ANALYZER lowercase_delimited
PROPERTIES (
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, lowercase"
);
```
その後、`TOKENIZE`と一緒に使用します：

```sql
SELECT TOKENIZE("FOO-BAR", '"analyzer"="lowercase_delimited"');
```
```
[{ "token": "foo" }, { "token": "bar" }]
```
## Version 3.0 固有の機能

:::info
Version 3.0 は 3.1+ と比較して機能が制限されています。拡張機能については 3.1+ へのアップグレードを推奨します。
:::

### 構文

```sql
ARRAY<VARCHAR> TOKENIZE(VARCHAR str, VARCHAR properties)
```
### パラメータ

バージョン3.0の`properties`パラメータは以下をサポートします：

| プロパティ | 説明 | 例の値 |
|----------|-------------|----------------|
| `parser` | ビルトインパーサータイプ | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | Chineseパーサーのパーサーモード | `"fine_grained"`, `"coarse_grained"` |
| `char_filter_type` | 文字フィルタータイプ | `"char_replace"` |
| `char_filter_pattern` | 置換対象の文字 | `"._=:,"` |
| `char_filter_replacement` | 置換文字 | `" "` (スペース) |
| `stopwords` | ストップワード設定 | `"none"` |

**バージョン3.0ではサポートされていません：**
- `built_in_analyzer`パラメータ
- `analyzer`パラメータ（カスタムアナライザー）
- `support_phrase`パラメータ
- `lower_case`パラメータ
- 追加アナライザー：`icu`, `basic`, `ik`, `standard`

### 戻り値

トークン化された文字列を個別の配列要素として含む`ARRAY<VARCHAR>`を返します（JSONオブジェクトではなく、シンプルな文字列配列）。

### 例

#### 例1：Chineseパーサーの使用

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese'");
```
```
["我", "来到", "北京", "清华大学"]
```
#### Example 2: 細粒度モードでのChinese parser

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese', 'parser_mode'='fine_grained'");
```
```
["我", "来到", "北京", "清华", "清华大学", "华大", "大学"]
```
#### 例3: Unicodeパーサーの使用

```sql
SELECT TOKENIZE('Apache Doris数据库', "'parser'='unicode'");
```
```
["apache", "doris", "数", "据", "库"]
```
#### 例4: character filtersの使用

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"parser"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
["get", "images", "hm", "bg", "jpg", "http", "1", "0", "test", "abc", "bcd"]
```
#### Example 5: Stopwords設定

```sql
SELECT TOKENIZE('华夏智胜新税股票A', '"parser"="unicode"');
```
```
["华", "夏", "智", "胜", "新", "税", "股", "票"]
```
```sql
SELECT TOKENIZE('华夏智胜新税股票A', '"parser"="unicode","stopwords" = "none"');
```
```
["华", "夏", "智", "胜", "新", "税", "股", "票", "a"]
```
## 注意事項

1. **バージョン互換性**:
   - バージョン3.0では`parser`パラメータを使用し、シンプルな文字列配列を返します
   - バージョン3.1+では`parser`（後方互換）と`built_in_analyzer`の両方をサポートし、JSONオブジェクト配列を返します
   - バージョン3.1+ではカスタムアナライザー、追加の組み込みアナライザー、フレーズサポートが追加されています

2. **サポートされるアナライザー**:
   - **バージョン3.0**: `chinese`、`english`、`unicode`
   - **バージョン3.1+**: `standard`、`english`、`chinese`、`unicode`、`icu`、`basic`、`ik`、`none`

3. **Parserモード**: `parser_mode`プロパティは主に`chinese`パーサーで使用されます:
   - `fine_grained`: オーバーラップするセグメントでより詳細なトークンを生成します
   - `coarse_grained`: 標準セグメンテーションのデフォルトモードです

4. **文字フィルター**: `char_filter_type`、`char_filter_pattern`、`char_filter_replacement`を組み合わせて使用し、トークン化前に特定の文字を置換します。

5. **パフォーマンス**: `TOKENIZE`関数は主にパーサー設定のテストとデバッグを目的としています。本番環境での全文検索には、`MATCH`述語を使用した転置インデックスを使用してください。

6. **転置インデックスとの互換性**: 同じparser/analyzer設定を転置インデックスに適用できます:

   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("parser"="chinese")
   )
   ```
7. **パーサー動作のテスト**: `TOKENIZE`を使用して、転置インデックスを作成する前にテキストがどのようにトークン化されるかをプレビューします。

## キーワード

TOKENIZE, STRING, FULL-TEXT SEARCH, INVERTED INDEX, PARSER, ANALYZER
