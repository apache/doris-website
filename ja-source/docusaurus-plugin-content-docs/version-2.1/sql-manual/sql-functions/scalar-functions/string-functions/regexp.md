---
{
  "title": "REGEXP",
  "language": "ja",
  "description": "文字列strに対して正規表現マッチを実行し、マッチが成功した場合はtrueを、そうでなければfalseを返します。"
}
---
## 説明

文字列strに対して正規表現マッチを実行し、マッチが成功した場合はtrueを返し、そうでなければfalseを返します。patternは正規表現パターンです。
文字セットマッチングを処理する際は、Utf-8標準文字クラスを使用する必要があることに注意してください。これにより、関数が異なる言語の様々な文字を正しく識別し、処理できることが保証されます。

`pattern`が許可されたregexp正規表現でない場合、エラーをthrowします；

サポートされる文字マッチクラス : https://github.com/google/re2/wiki/Syntax

## 構文

```sql
REGEXP(<str>, <pattern>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<str>` | String型。正規表現に対してマッチングされる文字列を表し、テーブル内の列またはリテラル文字列を指定できます。|
| `<pattern>` | String型。文字列<str>に対してマッチングに使用される正規表現パターンです。正規表現は、文字クラス、量詞、アンカーを含む複雑な検索パターンを定義する強力な方法を提供します。|

## 戻り値

REGEXP関数はBOOLEAN値を返します。文字列<str>が正規表現パターン<pattern>にマッチする場合、関数はtrue（SQLでは1として表現）を返し、マッチしない場合はfalse（SQLでは0として表現）を返します。

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
中国文字の例

```sql
mysql> select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```
単純文字列マッチングの挿入とテスト

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
終端文字列マッチングのテスト

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
すべてのパラメータがNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP(NULL, NULL);
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```
`pattern`が正規表現として許可されていない場合、エラーをスローします。

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```
