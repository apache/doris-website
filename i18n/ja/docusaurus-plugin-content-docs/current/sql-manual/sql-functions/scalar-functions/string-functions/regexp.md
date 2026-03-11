---
{
  "title": "REGEXP",
  "language": "ja",
  "description": "文字列strに対して正規表現マッチを実行し、マッチが成功した場合はtrueを、そうでなければfalseを返します。"
}
---
## 詳細
~
文字列strに対して正規表現マッチを実行し、マッチが成功した場合はtrueを、そうでなければfalseを返します。patternは正規表現パターンです。
文字セットマッチングを処理する際は、Utf-8標準文字クラスを使用すべきであることに注意してください。これにより、関数が異なる言語の様々な文字を正しく識別し処理できることが保証されます。

`pattern`が許可されたregexp正規表現でない場合、エラーをthrowします；

デフォルトでサポートされている文字マッチクラス：https://github.com/google/re2/wiki/Syntax

Dorisは、セッション変数`enable_extended_regex`（デフォルトは`false`）を通じて、先読み・後読みゼロ幅アサーションなど、より高度な正規表現機能の有効化をサポートしています。

セッション変数`enable_extended_regex`が`true`に設定されている場合にサポートされる文字マッチングタイプ：https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

注意：この変数を有効化した後、正規表現に高度な構文（先読み・後読みなど）が含まれている場合にのみパフォーマンスに影響します。そのため、より良いパフォーマンスのために、正規表現を可能な限り最適化し、このようなゼロ幅アサーションの使用を避けることを推奨します。

## Syntax

```sql
REGEXP(<str>, <pattern>)
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | String型。正規表現とマッチングする文字列を表します。テーブルのカラムまたはリテラル文字列を指定できます。|
| `<pattern>` | String型。文字列<str>とのマッチングに使用する正規表現パターン。正規表現は、文字クラス、量詞、アンカーを含む複雑な検索パターンを定義するための強力な方法を提供します。|

## Return Value

REGEXP関数はBOOLEAN値を返します。文字列<str>が正規表現パターン<pattern>とマッチした場合、関数はtrue（SQLでは1として表現）を返し、マッチしない場合はfalse（SQLでは0として表現）を返します。

**Default Behavior**:

| Default Setting                      | Behavior                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.`は改行にマッチ                  | `.`はデフォルトで`\n`（改行）にマッチできます。                                                  |
| Case-sensitive                       | マッチングは大文字小文字を区別します。                                                               |
| `^`/`$`は文字列全体の境界にマッチ | `^`は文字列の開始のみにマッチし、`$`は文字列の終了のみにマッチします。行の開始/終了にはマッチしません。 |
| 貪欲量詞                   | `*`、`+`などはデフォルトでできる限り多くマッチします。                                      |
| UTF-8                                | 文字列はUTF-8として処理されます。                                                           |

**Pattern Modifiers**:

`pattern`の前に`(?flags)`を付けることでデフォルトの動作をオーバーライドできます。複数の修飾子を組み合わせることができます（例：`(?im)`）。`-`プレフィックスは対応するオプションを無効にします（例：`(?-s)`）。

パターン修飾子はデフォルトのregexエンジンを使用する場合にのみ有効になります。ゼロ幅アサーション（例：`(?<=...)`、`(?=...)`）を使用しながら`enable_extended_regex=true`が有効になっている場合、クエリはBoost.Regexエンジンによって処理され、修飾子の動作が期待通りに機能しない可能性があります。これらを混在させないことを推奨します。

| Flag    | Meaning                                                                      |
| ------- | ---------------------------------------------------------------------------- |
| `(?i)`  | 大文字小文字を区別しないマッチング                                                    |
| `(?-i)` | 大文字小文字を区別する（デフォルト）                                                     |
| `(?s)`  | `.`は改行にマッチ（デフォルトで有効）                                     |
| `(?-s)` | `.`は改行にマッチ**しない**                                               |
| `(?m)`  | マルチラインモード：`^`は各行の開始にマッチ、`$`は各行の終了にマッチ |
| `(?-m)` | シングルラインモード：`^`/`$`は文字列全体の境界にマッチ（デフォルト）             |
| `(?U)`  | 非貪欲量詞：`*`、`+`などはできる限り少なくマッチ           |
| `(?-U)` | 貪欲量詞（デフォルト）：`*`、`+`などはできる限り多くマッチ       |

## Examples

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
中国語文字の例

```sql
mysql> select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```
単純な文字列マッチングのための挿入とテスト

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
特殊文字マッチングテスト

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
文字列終端マッチングのテスト

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
絵文字テスト

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
'str'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP(NULL, '^billie');
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```
'pattern'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP('billie eillish', NULL);
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```
全てのパラメータがNULLの場合、NULLを返します

```sql
mysql> SELECT REGEXP(NULL, NULL);
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```
`pattern`が正規表現として許可されていない場合、エラーをスローする

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

大文字小文字を区別しないマッチング：`(?i)` はマッチで大文字小文字を無視します

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
`.` はデフォルトで改行にマッチします。`.` が改行にマッチしないようにするには `(?-s)` を使用してください

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
マルチラインモード: `(?m)` は `^` と `$` を各行の開始/終了にマッチさせる

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
貪欲 vs 非貪欲: `(?U)` は量詞を可能な限り少なくマッチさせる

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
