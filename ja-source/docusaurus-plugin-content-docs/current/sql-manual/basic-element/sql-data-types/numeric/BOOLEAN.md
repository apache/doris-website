---
{
  "title": "BOOLEAN",
  "language": "ja",
  "description": "BOOL、BOOLEAN TINYINTと同様に、0はfalseを表し、1はtrueを表す。"
}
---
## 説明

BOOLEAN（別名：BOOL）は、ブール値（true と false）を表すDorisのデータ型です。

内部的に、BOOLEANはuint8値として格納され、0はfalseを表し、1はtrueを表します。

BOOLEANがTINYINT(1)の別名であるMySQLとは異なり、DorisはPostgreSQL、Oracle、その他のデータベースシステムと同様に、BOOLEANを独立したデータ型として扱います。

## 値の範囲

BOOLEAN値は以下のみ可能です：
- `true`（表示時は1として表現）
- `false`（表示時は0として表現）

メモリ内では、BOOLEAN型は0または1としてのみ存在し、他の値は取り得ません。

## リテラル値

Dorisでは、キーワード`true`と`false`（大文字小文字を区別しない）を使用してブールリテラル値を表すことができます：

```sql
mysql> select TrUe, False, true;
+------+-------+------+
| TrUe | False | true |
+------+-------+------+
|    1 |     0 |    1 |
+------+-------+------+
```
## サポートされる操作

### 論理演算

BOOLEAN型は、AND、OR、NOT、XORなどの論理演算をサポートしています：

```sql
mysql> select true AND false, true OR false, NOT true, true XOR false;
+----------------+---------------+----------+----------------+
| true AND false | true OR false | NOT true | true XOR false |
+----------------+---------------+----------+----------------+
|              0 |             1 |        0 |              1 |
+----------------+---------------+----------+----------------+
```
### 算術演算

BOOLEANは算術演算を直接サポートしていませんが、`true + true`のような式は暗黙的な型変換により動作します：

```sql
mysql> select true + true;
+-------------+
| true + true |
+-------------+
|           2 |
+-------------+
```
これは、ブール値が暗黙的にSMALLINTにキャストされるため動作します：`CAST(TRUE AS smallint) + CAST(TRUE AS smallint)`。

## 型変換

BOOLEANはDorisにおいてTINYINTと等価ではないことに注意することが重要です。MySQLの慣習により似ているように見える場合でも同様です。

ブールリテラルをTINYINTカラムに挿入する際、暗黙的な型変換が発生します：

```sql
CREATE TABLE test_boolean(
    u8 TINYINT
)
properties("replication_num" = "1");

mysql> insert into test_boolean values(true);
```
この例では、ブール値リテラル`true`がTINYINT値に変換されます。

## キーワード

BOOL, BOOLEAN
