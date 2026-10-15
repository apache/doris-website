---
{
    "title": "BOOLEAN",
    "language": "ja",
    "description": "BOOL、BOOLEAN。TINYINT と同様に、0 は false、1 は true を表します。"
}
---

## 説明

BOOLEAN（別名: BOOL）は、真と偽のブール値を表す Doris のデータ型です。

内部的には、BOOLEAN は uint8 値として格納され、0 が false、1 が true を表します。

MySQL では BOOLEAN は TINYINT(1) の別名ですが、Doris では PostgreSQL や Oracle などのデータベースシステムと同様に、BOOLEAN を独立したデータ型として扱います。

## 値の範囲

BOOLEAN の値は次のいずれかです。
- `true`（表示時は 1）
- `false`（表示時は 0）

メモリ上で BOOLEAN 型の値は 0 または 1 のみであり、それ以外の値は取りません。

## リテラル値

Doris では、キーワード `true` と `false`（大文字と小文字は区別されません）をブール値のリテラルとして使用できます。

```sql
mysql> select TrUe, False, true;
+------+-------+------+
| TrUe | False | true |
+------+-------+------+
|    1 |     0 |    1 |
+------+-------+------+
```

## 対応する演算

### 論理演算

BOOLEAN 型は AND、OR、NOT、XOR などの論理演算をサポートします。

```sql
mysql> select true AND false, true OR false, NOT true, true XOR false;
+----------------+---------------+----------+----------------+
| true AND false | true OR false | NOT true | true XOR false |
+----------------+---------------+----------+----------------+
|              0 |             1 |        0 |              1 |
+----------------+---------------+----------+----------------+
```

### 算術演算

BOOLEAN は算術演算を直接サポートしませんが、暗黙的な型変換により、`true + true` のような式は実行できます。

```sql
mysql> select true + true;
+-------------+
| true + true |
+-------------+
|           2 |
+-------------+
```

これは、ブール値が暗黙的に SMALLINT に変換されるためです: `CAST(TRUE AS smallint) + CAST(TRUE AS smallint)`。

## 型変換

MySQL の慣例によって似て見える場合がありますが、Doris では BOOLEAN と TINYINT は同等ではない点に注意してください。

ブール値のリテラルを TINYINT 列に挿入すると、暗黙的な型変換が行われます。

```sql
CREATE TABLE test_boolean(
    u8 TINYINT
)
properties("replication_num" = "1");

mysql> insert into test_boolean values(true);
```

この例では、ブール値のリテラル `true` が TINYINT 値に変換されます。

## キーワード

BOOL, BOOLEAN
