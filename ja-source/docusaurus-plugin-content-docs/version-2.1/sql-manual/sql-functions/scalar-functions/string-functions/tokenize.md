---
{
  "title": "TOKENIZE",
  "language": "ja",
  "description": "TOKENIZE関数は、指定されたパーサーを使用して文字列をトークン化し、トークン化結果を文字列配列として返します。"
}
---
## 説明

`TOKENIZE`関数は、指定されたパーサーを使用して文字列をトークン化し、トークン化の結果を文字列配列として返します。この関数は、全文検索機能で転置インデックスを使用する際にテキストがどのように解析されるかをテストし理解するのに特に有用です。

## 構文

```sql
ARRAY<VARCHAR> TOKENIZE(VARCHAR str, VARCHAR properties)
```
## パラメータ

- `str`: トークン化される入力文字列。型: `VARCHAR`
- `properties`: パーサー設定を指定するプロパティ文字列。型: `VARCHAR`

`properties` パラメータは以下のキーと値のペアをサポートします（形式: `'key1'='value1', 'key2'='value2'` または `"key1"="value1", "key2"="value2"`）：

### サポートされるプロパティ

| プロパティ | 説明 | 例の値 |
|----------|-------------|----------------|
| `parser` | 組み込みパーサータイプ | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | 中国語パーサーのパーサーモード | `"fine_grained"`, `"coarse_grained"` |
| `char_filter_type` | 文字フィルタータイプ | `"char_replace"` |
| `char_filter_pattern` | 置換される文字（`char_filter_type` と併用） | `"._=:,"` |
| `char_filter_replacement` | 置換文字（`char_filter_type` と併用） | `" "` （スペース） |
| `stopwords` | ストップワード設定 | `"none"` |

## 戻り値

トークン化された文字列を個別の配列要素として含む `ARRAY<VARCHAR>` を返します。

## 例

### 例 1: 中国語パーサーの使用

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese'");
```
```
["我", "来到", "北京", "清华大学"]
```
### 例2: 細粒度モードでの中国語パーサー

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese', 'parser_mode'='fine_grained'");
```
```
["我", "来到", "北京", "清华", "清华大学", "华大", "大学"]
```
### 例3: Unicodeパーサーの使用

```sql
SELECT TOKENIZE('Apache Doris数据库', "'parser'='unicode'");
```
```
["apache", "doris", "数", "据", "库"]
```
### 例4: character filtersの使用

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"parser"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
["get", "images", "hm", "bg", "jpg", "http", "1", "0", "test", "abc", "bcd"]
```
### 例5: Stopwords設定

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

1. **パーサー設定**: `properties`パラメータは有効なプロパティ文字列である必要があります。このバージョンでは組み込みパーサーのみがサポートされています。

2. **サポートされているパーサー**: バージョン2.1では以下の組み込みパーサーがサポートされています：
   - `chinese`: オプションの`parser_mode`（`fine_grained`または`coarse_grained`）を持つ中国語テキストパーサー
   - `english`: ステミング機能付きの英語パーサー
   - `unicode`: 多言語テキスト用のUnicodeベースパーサー

3. **パーサーモード**: `parser_mode`プロパティは主に`chinese`パーサーで使用されます：
   - `fine_grained`: 重複するセグメントでより詳細なトークンを生成
   - `coarse_grained`: 標準セグメンテーションを使用するデフォルトモード

4. **文字フィルター**: `char_filter_type`、`char_filter_pattern`、`char_filter_replacement`を組み合わせて使用し、トークン化前に特定の文字を置換します。

5. **パフォーマンス**: `TOKENIZE`関数は主にパーサー設定のテストとデバッグを目的としています。本番環境での全文検索には、`MATCH`述語を使用した転置インデックスを使用してください。

6. **転置インデックスとの互換性**: `TOKENIZE`で使用されるパーサー設定は、テーブル作成時の転置インデックスにも適用できます：

   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("parser"="chinese")
   )
   ```
7. **パーサー動作のテスト**: `TOKENIZE`を使用して、転置インデックスを作成する前にテキストがどのようにトークン化されるかをプレビューし、データに最も適切なパーサーを選択するのに役立てます。

## キーワード

TOKENIZE, STRING, FULL-TEXT SEARCH, INVERTED INDEX, PARSER
