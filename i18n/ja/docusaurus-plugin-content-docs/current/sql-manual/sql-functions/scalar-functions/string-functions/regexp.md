---
{
    "title": "REGEXP",
    "language": "ja",
    "description": "~ 文字列 str に対して正規表現で一致判定を行い、一致すれば true、そうでなければ false を返します。"
}
---

## 説明 {#description}

`<str>` に対して正規表現で一致判定を行い、一致すれば true、そうでなければ false を返します。パターンは文字列全体に一致する必要はありません。文字列全体との一致には `^` と `$` を使用します。いずれかの引数が NULL の場合は NULL を返し、パターンが無効な場合はエラーを報告します。文字列は UTF-8 として処理されます。Unicode の文字カテゴリに一致させるには、`\p{Han}` などの文字クラスを使用します。

通常のパターンについては、[RE2 の構文](https://github.com/google/re2/wiki/Syntax)を参照してください。

### マッチングエンジンとセッション変数 {#matching-engines-and-session-variables}

通常の `LIKE` と `REGEXP` の一致判定には、Hyperscan による高速化を利用できます。以下のセッション変数でフォールバックの動作を制御します。

| セッション変数 | デフォルト値 | 動作 |
| --- | --- | --- |
| `enable_hyperscan_fallback` | `true` | Doris 4.1 系では 4.1.5 以降でサポートされます。実際に Hyperscan でコンパイルする処理経路で、コンパイルに失敗した場合や一致判定用の作業領域を確保できない場合に、RE2 へのフォールバックを許可します。false の場合は、対応するエラーを返します。単純なパターン向けの最適化や、RE2 を直接使用する処理経路には影響しません。 |
| `enable_extended_regex` | `false` | RE2 がパターンを受け付けない場合に、`REGEXP` が Boost.Regex を試せるようにします。これにより、先読みや後読みなどの拡張構文を使用できます。RE2 の構文が拡張されるわけではなく、`LIKE`、`MATCH_REGEXP`、`MULTI_MATCH_ANY` で拡張構文が使えるようになるわけでもありません。 |

Doris 4.1 系では 4.1.5 以降、`enable_extended_regex=true` は定数パターンと、カラムから読み取る非定数パターンの両方に適用されます。Hyperscan を使う処理経路で `enable_hyperscan_fallback=false` の場合、Hyperscan での失敗は引き続きエラーになります。`enable_extended_regex` を有効にしても、そのエラーは回避されません。

`enable_hyperscan_fallback` の値と適用範囲については、[セッション変数のリファレンス](../../../basic-element/session-variables.md#enable_hyperscan_fallback)を参照してください。

拡張パターンについては、[Boost.Regex の Perl 構文](https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html)を参照してください。Boost.Regex の一致判定に伴うオーバーヘッドが発生するのは、そのエンジンを使用する場合だけです。複雑なバックトラッキングを伴うパターンでは、`Failed to match regex expression` が報告されることもあります。

### 繰り返し回数の上限 {#repetition-limit}

Doris 4.1 系では 4.1.5 以降、Hyperscan に渡される正規表現の `{m}`、`{m,}`、`{m,n}` 形式に 50 を超える数値が含まれる場合、Hyperscan でのコンパイルをスキップします。たとえば、`a{51}`、`a{51,}`、`a{0,51}` はこのチェックの対象になりますが、`a{50}` と `a{0,50}` は対象になりません。これは保守的なテキスト上のチェックなので、文字クラスやコメント内に同じ形式がある場合も対象になることがあります。

| 一致判定の処理経路 | チェックの対象になった場合の動作 |
| --- | --- |
| 通常の `LIKE` または `REGEXP` で Hyperscan を使う処理経路 | `enable_hyperscan_fallback=true` の場合はフォールバックを試み、それ以外の場合はエラーを返します。パターンは、フォールバック先のエンジンの構文と繰り返し回数の上限も満たす必要があります。 |
| `MATCH_REGEXP` の行単位の一致判定と、転置インデックスを使う正規表現の一致判定 | パターンを直接拒否します。`enable_hyperscan_fallback` は使用しません。 |
| `MULTI_MATCH_ANY` の複数パターンによる一致判定 | パターンを直接拒否します。`enable_hyperscan_fallback` は使用しません。 |

フォールバックせずにこのチェックの対象になった場合、エラーには次のメッセージが含まれます。

```text
Skip hyperscan compilation because bounded repetition exceeds 50
```

## 構文 {#syntax}

```sql
REGEXP(<str>, <pattern>)
<str> [NOT] REGEXP <pattern>
<str> [NOT] RLIKE <pattern>
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<str>` | 文字列型。正規表現との一致判定の対象となる文字列を表します。テーブルのカラムまたは文字列リテラルを指定できます。|
| `<pattern>` | 文字列型。文字列 `<str>` との一致判定に使用する正規表現パターンです。正規表現では、文字クラス、量指定子、アンカーなどを使って複雑な検索パターンを定義できます。|

## 戻り値 {#return-value}

REGEXP 関数は BOOLEAN 値を返します。文字列 `<str>` が正規表現パターン `<pattern>` に一致する場合は true（SQL では 1）、一致しない場合は false（SQL では 0）を返します。いずれかの引数が NULL の場合は NULL を返します。

Doris 4.1 系では 4.1.5 以降、定数の空パターンはカラムのパターンと同じように動作します。空パターンは、空文字列を含む、NULL 以外のすべての文字列に一致します。

**デフォルトの動作**:

| デフォルトの設定 | 動作 |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.` は改行に一致する | デフォルトでは、`.` は `\n`（改行）に一致します。 |
| 大文字と小文字を区別する | 一致判定では大文字と小文字を区別します。 |
| `^`/`$` は文字列全体の境界に一致する | `^` は文字列の先頭だけに、`$` は文字列の末尾だけに一致し、各行の先頭や末尾には一致しません。 |
| 貪欲な量指定子 | デフォルトでは、`*`、`+` などは可能な限り長く一致します。 |
| UTF-8 | 文字列は UTF-8 として処理されます。 |

**パターン修飾子**:

`pattern` の先頭に `(?flags)` を付けると、デフォルトの動作を変更できます。`(?im)` のように複数の修飾子を組み合わせることができます。また、`(?-s)` のように `-` を付けると、対応するオプションを無効にできます。

以下の表は、通常の Hyperscan/RE2 の処理経路での修飾子を示します。先読みや後読みなどの構文が原因でパターンが Boost.Regex にフォールバックした場合は、Boost.Regex の構文に従って修飾子を解釈してください。エンジン間で動作が必ずしも同じになるとは限りません。

| フラグ | 意味 |
| ------- | ---------------------------------------------------------------------------- |
| `(?i)` | 大文字と小文字を区別せずに一致判定する |
| `(?-i)` | 大文字と小文字を区別する（デフォルト） |
| `(?s)` | `.` が改行に一致する（デフォルトで有効） |
| `(?-s)` | `.` が改行に一致**しない** |
| `(?m)` | 複数行モード：`^` は各行の先頭に、`$` は各行の末尾に一致する |
| `(?-m)` | 単一行モード：`^`/`$` は文字列全体の境界に一致する（デフォルト） |
| `(?U)` | 非貪欲な量指定子：`*`、`+` などは可能な限り短く一致する |
| `(?-U)` | 貪欲な量指定子（デフォルト）：`*`、`+` などは可能な限り長く一致する |

<a id="examples"></a>

## 例 {#example}

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1");

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- Find all data in the k1 column starting with 'billie'
SELECT k1 FROM test WHERE k1 REGEXP '^billie' ORDER BY k1;
```

```text
+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
```

```sql
--- Find data in the k1 column ending with 'ok':
SELECT k1 FROM test WHERE k1 REGEXP 'ok$';
```

```text
+---------+
| k1      |
+---------+
| It's ok |
+---------+
```
中国語の漢字の例

```sql
select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
```

```text
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```

単純な文字列の一致判定用データの挿入とテスト

```sql
CREATE TABLE test_regexp (
    id INT,
    name VARCHAR(255)
) PROPERTIES("replication_num"="1");

INSERT INTO test_regexp (id, name) VALUES
    (1, 'Alice'),
    (2, 'Bob'),
    (3, 'Charlie'),
    (4, 'David');

-- Find all names starting with 'A'
SELECT id, name FROM test_regexp WHERE name REGEXP '^A';
```

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
+------+-------+
```

特殊文字の一致判定テスト

```sql
-- Insert names with special characters
INSERT INTO test_regexp (id, name) VALUES
    (5, 'Anna-Maria'),
    (6, 'John_Doe');

-- Find names containing the '-' character
SELECT id, name FROM test_regexp WHERE name REGEXP '-';
```
```text
+------+------------+
| id   | name       |
+------+------------+
|    5 | Anna-Maria |
+------+------------+
```

末尾の文字列との一致判定テスト
```sql
-- Find names ending with 'e'
SELECT id, name FROM test_regexp WHERE name REGEXP 'e$' ORDER BY id;
```

```text
+------+----------+
| id   | name     |
+------+----------+
|    1 | Alice    |
|    3 | Charlie  |
|    6 | John_Doe |
+------+----------+
```

絵文字のテスト

```sql
SELECT 'Hello' REGEXP '😀';
```

```text
+-----------------------+
| 'Hello' REGEXP '😀'     |
+-----------------------+
|                     0 |
+-----------------------+
```


空パターンは、空文字列を含む、NULL 以外のすべての文字列に一致します。

```sql
SELECT REGEXP('abc', ''), REGEXP('', ''), REGEXP(NULL, '');
```

```text
1    1    NULL
```

'str' が NULL の場合、NULL を返します

```sql
SELECT REGEXP(NULL, '^billie');
```

```text
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern' が NULL の場合、NULL を返します

```sql
SELECT REGEXP('billie eillish', NULL);
```

```text
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

すべてのパラメータが NULL の場合、NULL を返します

```sql
SELECT REGEXP(NULL, NULL);
```

```text
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```

`pattern` が無効な正規表現の場合、エラーが発生します。

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```

高度なパターンには拡張構文が必要です。通常の RE2 へのフォールバックでは、先読みや後読みはサポートされません。

```sql
SET enable_hyperscan_fallback = true;
SET enable_extended_regex = true;
SELECT REGEXP('foobar', '(?<=foo)bar');
```

```text
1
```

非定数パターンも拡張構文をサポートします（Doris 4.1 系では 4.1.5 以降）。

```sql
CREATE TABLE regexp_patterns (
    id INT,
    s VARCHAR(32),
    p VARCHAR(64)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO regexp_patterns VALUES
    (1, 'foobar', '(?<=foo)bar'),
    (2, 'fobar', '(?<=foo)bar'),
    (3, 'foo123bar', 'foo(?=123)'),
    (4, 'foo124bar', 'foo(?=123)');

SELECT id, REGEXP(s, p) FROM regexp_patterns ORDER BY id;
```

```text
1    1
2    0
3    1
4    0
```

以下の通常の構文の例を実行する前に、セッション設定を元に戻します。

```sql
SET enable_extended_regex = false;
```

パターン修飾子

大文字と小文字を区別しない一致判定：`(?i)` を使うと、大文字と小文字を区別せずに一致判定します

```sql
SELECT REGEXP('Hello World', 'hello') AS case_sensitive, REGEXP('Hello World', '(?i)hello') AS case_insensitive;
```

```text
+----------------+------------------+
| case_sensitive | case_insensitive |
+----------------+------------------+
|              0 |                1 |
+----------------+------------------+
```

デフォルトでは `.` は改行に一致します。`.` が改行に一致しないようにするには `(?-s)` を使用します

```sql
SELECT REGEXP('foo\nbar', '^.+$') AS dot_match_nl, REGEXP('foo\nbar', '(?-s)^.+$') AS dot_not_match_nl;
```

```text
+--------------+------------------+
| dot_match_nl | dot_not_match_nl |
+--------------+------------------+
|            1 |                0 |
+--------------+------------------+
```

複数行モード：`(?m)` を使うと、`^` と `$` が各行の先頭と末尾に一致します

```sql
SELECT REGEXP('foo\nbar', '^bar') AS single_line, REGEXP('foo\nbar', '(?m)^bar') AS multi_line;
```

```text
+-------------+------------+
| single_line | multi_line |
+-------------+------------+
|           0 |          1 |
+-------------+------------+
```

貪欲な一致判定と非貪欲な一致判定：`(?U)` を使うと、量指定子が可能な限り短く一致します

```sql
SELECT REGEXP_EXTRACT('aXbXc', '(a.*X)', 1) AS greedy, REGEXP_EXTRACT('aXbXc', '(?U)(a.*X)', 1) AS non_greedy;
```

```text
+--------+------------+
| greedy | non_greedy |
+--------+------------+
| aXbX   | aX         |
+--------+------------+
```
