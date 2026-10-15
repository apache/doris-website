---
{
    "title": "IS_VALID_UTF8",
    "language": "ja",
    "description": "IS_VALID_UTF8 関数は、文字列が有効な UTF-8 エンコードのデータかどうかを検査します。有効な UTF-8 なら true、それ以外は false を返します。"
}
---

## 説明

IS_VALID_UTF8 関数は、文字列が有効な UTF-8 エンコードのデータかどうかを検査します。入力内のすべてのバイト列を検証し、すべてが UTF-8 のエンコード規則に適合する場合は `true` を、無効なバイト列が見つかった場合は `false` を返します。

この関数は、バイナリデータや誤ってエンコードされた内容を含む可能性のある外部ソース（ファイル、ネットワークストリームなど）からデータを取り込み、文字列操作を行う前にデータの整合性を確認する場合に役立ちます。

## エイリアス

- `ISVALIDUTF8()`

## 構文

```sql
IS_VALID_UTF8(<str>)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<str>` | 検証する文字列。型: VARCHAR または STRING |

## 戻り値

BOOLEAN 型を返します。

- 文字列が有効な UTF-8 エンコードのデータである場合は `true` を返します。
- 文字列に無効な UTF-8 バイト列が含まれる場合は `false` を返します。

特殊なケース:
- 引数が NULL の場合は NULL を返します。
- 空文字列は有効な UTF-8 とみなされ、`true` を返します。

## 例

1. 有効な ASCII 文字列

```sql
SELECT IS_VALID_UTF8('hello');
```

```text
+------------------------+
| is_valid_utf8('hello') |
+------------------------+
|                      1 |
+------------------------+
```

2. 有効なマルチバイト UTF-8 文字（中国語）

```sql
SELECT IS_VALID_UTF8('Hello, 世界');
```

```text
+-----------------------------+
| is_valid_utf8('Hello, 世界') |
+-----------------------------+
|                           1 |
+-----------------------------+
```

3. 空文字列

```sql
SELECT IS_VALID_UTF8('');
```

```text
+--------------------+
| is_valid_utf8('')  |
+--------------------+
|                  1 |
+--------------------+
```

4. 無効な UTF-8 バイト列（UNHEX で生成）

```sql
SELECT IS_VALID_UTF8(UNHEX('C0AF'));
```

```text
+------------------------------+
| is_valid_utf8(unhex('C0AF')) |
+------------------------------+
|                            0 |
+------------------------------+
```

5. NULL 値の処理

```sql
SELECT IS_VALID_UTF8(NULL);
```

```text
+---------------------+
| is_valid_utf8(NULL) |
+---------------------+
|                NULL |
+---------------------+
```

6. テーブルデータでの使用

```sql
CREATE TABLE test_utf8 (
    id INT,
    val VARCHAR(200)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_utf8 VALUES
(1, 'hello'),
(2, ''),
(3, 'Hello, 世界'),
(4, NULL);

INSERT INTO test_utf8 VALUES (5, UNHEX('C0AF'));
INSERT INTO test_utf8 VALUES (6, UNHEX('FF'));

SELECT id, IS_VALID_UTF8(val) FROM test_utf8 ORDER BY id;
```

```text
+------+--------------------+
| id   | is_valid_utf8(val) |
+------+--------------------+
|    1 |                  1 |
|    2 |                  1 |
|    3 |                  1 |
|    4 |               NULL |
|    5 |                  0 |
|    6 |                  0 |
+------+--------------------+
```
