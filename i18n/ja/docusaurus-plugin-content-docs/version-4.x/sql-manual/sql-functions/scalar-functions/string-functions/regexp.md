---
{
    "title": "REGEXP",
    "language": "ja",
    "description": "~ 文字列 str が正規表現に一致するかを判定し、一致すれば true、一致しなければ false を返します。"
}
---

## 説明

文字列 str が正規表現に一致するかを判定し、一致すれば true、一致しなければ false を返します。pattern は正規表現のパターンです。
文字集合のマッチングには、UTF-8 標準の文字クラスを使用してください。これにより、関数はさまざまな言語の文字を正しく識別して処理できます。

`pattern` が有効な正規表現でない場合は、エラーが発生します。

デフォルトでサポートされる文字クラス: https://github.com/google/re2/wiki/Syntax

Doris では、セッション変数 `enable_extended_regex` を使用して、前後読みなどのゼロ幅アサーションを含む高度な正規表現機能を有効にできます。デフォルト値は `false` です。

`enable_extended_regex` を `true` に設定した場合にサポートされる文字マッチングの構文: https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

注: この変数を有効にしても、正規表現に前後読みなどの高度な構文が含まれる場合にのみ、パフォーマンスに影響します。パフォーマンスを高めるため、正規表現をできるだけ最適化し、このようなゼロ幅アサーションの使用を避けることを推奨します。


## 構文

```sql
REGEXP(<str>, <pattern>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<str>` | 文字列型。正規表現とのマッチング対象となる文字列です。テーブルの列または文字列リテラルを指定できます。|
| `<pattern>` | 文字列型。<str> とのマッチングに使用する正規表現パターンです。文字クラス、量指定子、アンカーなどを使って複雑な検索パターンを定義できます。|

## 戻り値

REGEXP 関数は BOOLEAN 値を返します。文字列 <str> が正規表現パターン <pattern> に一致する場合は true（SQL では 1）、一致しない場合は false（SQL では 0）を返します。いずれかの引数が NULL の場合は NULL を返します。

**デフォルトの動作**:

| デフォルトの設定 | 動作 |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.` は改行に一致 | デフォルトでは、`.` は `\n`（改行）に一致します。 |
| 大文字と小文字を区別 | マッチングでは大文字と小文字を区別します。 |
| `^`/`$` は文字列全体の境界に一致 | `^` は文字列の先頭にのみ、`$` は末尾にのみ一致し、各行の先頭や末尾には一致しません。 |
| 貪欲な量指定子 | デフォルトでは、`*` や `+` などは可能な限り長く一致します。 |
| UTF-8 | 文字列は UTF-8 として処理されます。 |

**パターン修飾子**:

`pattern` の先頭に `(?flags)` を付けると、デフォルトの動作を変更できます。`(?im)` のように複数の修飾子を組み合わせることも、`-` を付けて該当するオプションを無効にすることもできます（例: `(?-s)`）。

パターン修飾子は、デフォルトの正規表現エンジンを使用する場合にのみ有効です。`enable_extended_regex=true` を設定し、ゼロ幅アサーション（`(?<=...)`、`(?=...)` など）を使用すると、クエリは Boost.Regex エンジンで処理されるため、修飾子が期待どおりに動作しない場合があります。両者を併用しないことを推奨します。

| フラグ | 意味 |
| ------- | ---------------------------------------------------------------------------- |
| `(?i)`  | 大文字と小文字を区別せずにマッチングします。 |
| `(?-i)` | 大文字と小文字を区別します（デフォルト）。 |
| `(?s)`  | `.` が改行に一致します（デフォルトで有効）。 |
| `(?-s)` | `.` が改行に一致しなくなります。 |
| `(?m)`  | 複数行モード: `^` は各行の先頭に、`$` は各行の末尾に一致します。 |
| `(?-m)` | 単一行モード: `^`/`$` は文字列全体の先頭と末尾に一致します（デフォルト）。 |
| `(?U)`  | 非貪欲な量指定子: `*` や `+` などは可能な限り短く一致します。 |
| `(?-U)` | 貪欲な量指定子: `*` や `+` などは可能な限り長く一致します（デフォルト）。 |

## 例

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1")

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- Find all data in the k1 column starting with 'billie'
SELECT k1 FROM test WHERE k1 REGEXP '^billie'
--------------

+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
2 rows in set (0.02 sec)

--- Find data in the k1 column ending with 'ok':
SELECT k1 FROM test WHERE k1 REGEXP 'ok$'
--------------

+---------+
| k1      |
+---------+
| It's ok |
+---------+
1 row in set (0.03 sec)
```
中国語の文字の例

```sql
mysql> select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
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

末尾に一致する文字列のテスト
```sql
-- Find names ending with 'e'
SELECT id, name FROM test_regexp WHERE name REGEXP 'e$';
```

```text
+------+---------+
| id   | name    |
+------+---------+
|    1 | Alice   |
|    3 | Charlie |
+------+---------+
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


'str' が NULL の場合は NULL を返します

```sql
mysql> SELECT REGEXP(NULL, '^billie');
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern' が NULL の場合は NULL を返します

```sql
mysql> SELECT REGEXP('billie eillish', NULL);
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

すべての引数が NULL の場合は NULL を返します

```sql
mysql> SELECT REGEXP(NULL, NULL);
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```

`pattern` が有効な正規表現でない場合は、エラーが発生します

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```

高度な正規表現
```sql
SELECT REGEXP('Apache/Doris', '([a-zA-Z_+-]+(?:\/[a-zA-Z_0-9+-]+)*)(?=s|$)');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]Invalid regex expression: ([a-zA-Z_+-]+(?:/[a-zA-Z_0-9+-]+)*)(?=s|$). Error: invalid perl operator: (?=

SET enable_extended_regex = true;
SELECT REGEXP('Apache/Doris', '([a-zA-Z_+-]+(?:\/[a-zA-Z_0-9+-]+)*)(?=s|$)');
```
```text
+-----------------------------------------------------------------------+
| REGEXP('Apache/Doris', '([a-zA-Z_+-]+(?:\/[a-zA-Z_0-9+-]+)*)(?=s|$)') |
+-----------------------------------------------------------------------+
|                                                                     1 |
+-----------------------------------------------------------------------+
```

パターン修飾子

大文字と小文字を区別しないマッチング: `(?i)` を指定すると、大文字と小文字を区別せずにマッチングします

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

デフォルトでは `.` は改行に一致します。`(?-s)` を指定すると、`.` は改行に一致しなくなります

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

複数行モード: `(?m)` を指定すると、`^` と `$` は各行の先頭と末尾に一致します

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

貪欲なマッチングと非貪欲なマッチング: `(?U)` を指定すると、量指定子は可能な限り短く一致します

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
