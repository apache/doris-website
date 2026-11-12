---
{
    "title": "REGEXP",
    "language": "ja",
    "description": "~ 文字列 str に対して正規表現によるマッチングを行い、マッチした場合は true、それ以外の場合は false を返します。"
}
---

## 説明 {#description}

正規表現を `<str>` に適用し、マッチした場合は true、それ以外の場合は false を返します。パターンは文字列全体にマッチする必要はありません。文字列全体にマッチさせるには `^` と `$` を使用します。いずれかの引数が NULL の場合は NULL を返し、無効なパターンの場合はエラーを報告します。文字列は UTF-8 として処理されます。Unicode の文字カテゴリにマッチさせるには、`\p{Han}` などの文字クラスを使用します。

通常のパターンについては、[RE2 の構文](https://github.com/google/re2/wiki/Syntax)を参照してください。

### マッチングエンジンとセッション変数 {#matching-engines-and-session-variables}

通常の `LIKE` と `REGEXP` のマッチングには Hyperscan による高速化を使用できます。次のセッション変数でフォールバックの動作を制御します。

| セッション変数 | デフォルト値 | 動作 |
| --- | --- | --- |
| `enable_hyperscan_fallback` | `true` | Doris 4.1 シリーズでは 4.1.5 以降でサポートされます。実際に Hyperscan でコンパイルする経路で、コンパイルに失敗した場合やマッチング用のスクラッチ領域を確保できない場合に、RE2 へのフォールバックを許可します。false の場合は、対応するエラーを返します。単純なパターンの最適化や、RE2 を直接使用する経路には影響しません。 |
| `enable_extended_regex` | `false` | RE2 がパターンを拒否した場合に、`REGEXP` が Boost.Regex を試せるようにします。これにより、先読み・後読みなどの拡張構文を使用できます。RE2 自体の構文は拡張されず、`LIKE`、`MATCH_REGEXP`、`MULTI_MATCH_ANY` に拡張構文が追加されることもありません。 |

Doris 4.1 シリーズの 4.1.5 以降では、`enable_extended_regex=true` は定数パターンと、カラムから読み取る非定数パターンの両方に適用されます。Hyperscan を使用する経路で `enable_hyperscan_fallback=false` が設定されている場合、Hyperscan の失敗時には引き続きエラーが返されます。`enable_extended_regex` を有効にしても、このエラーは回避できません。

`enable_hyperscan_fallback` の値と適用範囲については、[セッション変数のリファレンス](../../../basic-element/session-variables.md#enable_hyperscan_fallback)を参照してください。

拡張パターンについては、[Boost.Regex の Perl 構文](https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html)を参照してください。Boost.Regex のマッチングによるオーバーヘッドは、そのエンジンを使用する場合にのみ発生します。複雑なバックトラッキングを伴うパターンでは、`Failed to match regex expression` が報告されることもあります。

### 繰り返し回数の制限 {#repetition-limit}

Doris 4.1 シリーズの 4.1.5 以降では、Hyperscan に渡される正規表現に `{m}`、`{m,}`、`{m,n}` のいずれかの形式で 50 を超える数値が含まれる場合、Hyperscan でのコンパイルをスキップします。たとえば、`a{51}`、`a{51,}`、`a{0,51}` はこのチェックに該当しますが、`a{50}` と `a{0,50}` は該当しません。これは保守的なテキストチェックのため、文字クラスやコメント内に同じ形式があっても該当する場合があります。

| マッチング経路 | チェックに該当した場合の動作 |
| --- | --- |
| 通常の `LIKE` または `REGEXP` の Hyperscan 経路 | `enable_hyperscan_fallback=true` の場合はフォールバックを試み、それ以外の場合はエラーを返します。パターンは、フォールバック先のエンジンの構文と繰り返し回数の制限を満たす必要があります。 |
| `MATCH_REGEXP` の行マッチングと転置インデックスによる正規表現マッチング | パターンを直接拒否します。`enable_hyperscan_fallback` は使用しません。 |
| `MULTI_MATCH_ANY` の複数パターンマッチング | パターンを直接拒否します。`enable_hyperscan_fallback` は使用しません。 |

フォールバックせずにこのチェックに該当した場合、エラーには次の文字列が含まれます。

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
| `<str>` | 文字列型。正規表現とのマッチング対象となる文字列を表します。テーブルのカラムまたは文字列リテラルを指定できます。|
| `<pattern>` | 文字列型。文字列 `<str>` とのマッチングに使用する正規表現パターンです。正規表現では、文字クラス、量指定子、アンカーなどを使って複雑な検索パターンを定義できます。|

## 戻り値 {#return-value}

REGEXP 関数は BOOLEAN 値を返します。文字列 `<str>` が正規表現パターン `<pattern>` にマッチする場合は true（SQL では 1）、マッチしない場合は false（SQL では 0）を返します。いずれかの引数が NULL の場合は NULL を返します。

Doris 4.1 シリーズの 4.1.5 以降では、定数の空パターンはカラムのパターンと同じ動作をします。空パターンは、空文字列を含むすべての非 NULL 文字列にマッチします。

**デフォルトの動作**：

| デフォルトの設定 | 動作 |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.` は改行にマッチする | デフォルトでは、`.` は `\n`（改行）にマッチします。 |
| 大文字と小文字を区別する | マッチングでは大文字と小文字を区別します。 |
| `^`/`$` は文字列全体の境界にマッチする | `^` は文字列の先頭にのみ、`$` は文字列の末尾にのみマッチし、各行の先頭や末尾にはマッチしません。 |
| 貪欲な量指定子 | `*`、`+` などはデフォルトで可能な限り長くマッチします。 |
| UTF-8 | 文字列は UTF-8 として処理されます。 |

**パターン修飾子**：

`pattern` の先頭に `(?flags)` を付けると、デフォルトの動作を変更できます。`(?im)` のように複数の修飾子を組み合わせられます。`(?-s)` のように `-` を付けると、対応するオプションを無効にできます。

次の表は、通常の Hyperscan/RE2 経路での修飾子を示します。先読み・後読みなどの構文が原因で Boost.Regex にフォールバックした場合は、Boost.Regex の構文に従って修飾子を解釈してください。エンジン間で動作が必ずしも同じとは限りません。

| フラグ | 意味 |
| ------- | ---------------------------------------------------------------------------- |
| `(?i)` | 大文字と小文字を区別せずにマッチングする |
| `(?-i)` | 大文字と小文字を区別する（デフォルト） |
| `(?s)` | `.` が改行にマッチする（デフォルトで有効） |
| `(?-s)` | `.` が改行にマッチ**しない** |
| `(?m)` | 複数行モード：`^` は各行の先頭に、`$` は各行の末尾にマッチする |
| `(?-m)` | 単一行モード：`^`/`$` は文字列全体の境界にマッチする（デフォルト） |
| `(?U)` | 非貪欲な量指定子：`*`、`+` などは可能な限り短くマッチする |
| `(?-U)` | 貪欲な量指定子（デフォルト）：`*`、`+` などは可能な限り長くマッチする |

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
中国語の文字の例

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

単純な文字列マッチングのためのデータ挿入とテスト

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

特殊文字のマッチングテスト

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

末尾の文字とのマッチングテスト
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


空パターンは、空文字列を含むすべての非 NULL 文字列にマッチします。

```sql
SELECT REGEXP('abc', ''), REGEXP('', ''), REGEXP(NULL, '');
```

```text
1    1    NULL
```

'str' が NULL の場合は NULL を返します。

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

'pattern' が NULL の場合は NULL を返します。

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

すべてのパラメータが NULL の場合は NULL を返します。

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

`pattern` が有効な正規表現ではない場合は、エラーを返します。

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```

高度なパターンには拡張構文が必要です。通常の RE2 へのフォールバックでは、先読み・後読みはサポートされません。

```sql
SET enable_hyperscan_fallback = true;
SET enable_extended_regex = true;
SELECT REGEXP('foobar', '(?<=foo)bar');
```

```text
1
```

非定数パターンでも拡張構文を使用できます（Doris 4.1 シリーズの 4.1.5 以降）。

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

大文字と小文字を区別しないマッチング：`(?i)` を使うと大文字と小文字を区別せずにマッチングします。

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

デフォルトでは `.` は改行にマッチします。`.` が改行にマッチしないようにするには `(?-s)` を使用します。

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

複数行モード：`(?m)` を使うと、`^` と `$` が各行の先頭と末尾にマッチします。

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

貪欲と非貪欲：`(?U)` を使うと、量指定子が可能な限り短くマッチします。

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
