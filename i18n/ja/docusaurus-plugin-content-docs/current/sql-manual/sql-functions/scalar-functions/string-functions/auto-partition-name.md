---
{
    "title": "AUTO_PARTITION_NAME",
    "language": "ja",
    "description": "AUTO_PARTITION_NAME 関数は、自動パーティション用のパーティション名を生成します。時間単位に基づいて名前を生成する RANGE モードと、文字列値に基づいて名前を生成する LIST モードをサポートします。"
}
---

## 説明

AUTO_PARTITION_NAME 関数は、自動パーティション用のパーティション名を生成します。時間単位に基づいて名前を生成する RANGE モードと、文字列値に基づいて名前を生成する LIST モードをサポートします。

Apache Doris 2.1.6 以降でサポートされています。

## 構文

```sql
AUTO_PARTITION_NAME('RANGE', <unit>, <datetime>)
AUTO_PARTITION_NAME('LIST', <value>[, <value> ...])
```

## パラメータ

| パラメータ | 説明 |
| ----------- | ----------------------------------------- |
| `'RANGE'` | RANGE パーティションモード。時間に基づいてパーティション名を生成します。 |
| `'LIST'` | LIST パーティションモード。文字列値に基づいてパーティション名を生成します。 |
| `<unit>` | RANGE モードの時間単位。`year`、`month`、`day`、`hour`、`minute`、`second` のいずれかを指定します。型: VARCHAR。 |
| `<datetime>` | RANGE モードの日時値。型: DATETIME。 |
| `<value>` | LIST モードのパーティション値。複数指定できます。型: VARCHAR。 |

## 戻り値

生成されたパーティション名を VARCHAR 型で返します。

特殊なケース:
- RANGE モード: パーティション名の形式は `pYYYYMMDDHHMMSS` で、単位に応じた精度に切り詰められます。
- LIST モード: パーティション名の形式は `p<value><length>` で、複数の値はそれぞれの長さによって区切られます。
- パラメータが無効な場合はエラーを返します。

## 例

1. 基本的な使用例: 日単位の RANGE
```sql
SELECT auto_partition_name('range', 'day', '2022-12-12 19:20:30');
```
```text
+------------------------------------------------------------+
| auto_partition_name('range', 'day', '2022-12-12 19:20:30') |
+------------------------------------------------------------+
| p20221212000000                                            |
+------------------------------------------------------------+
```

2. 月単位の RANGE
```sql
SELECT auto_partition_name('range', 'month', '2022-12-12 19:20:30');
```
```text
+--------------------------------------------------------------+
| auto_partition_name('range', 'month', '2022-12-12 19:20:30') |
+--------------------------------------------------------------+
| p20221201000000                                              |
+--------------------------------------------------------------+
```

3. 単一の値を指定する LIST
```sql
SELECT auto_partition_name('list', 'helloworld');
```
```text
+-------------------------------------------+
| auto_partition_name('list', 'helloworld') |
+-------------------------------------------+
| phelloworld10                             |
+-------------------------------------------+
```

4. 複数の値を指定する LIST
```sql
SELECT auto_partition_name('list', 'hello', 'world');
```
```text
+-----------------------------------------------+
| auto_partition_name('list', 'hello', 'world') |
+-----------------------------------------------+
| phello5world5                                 |
+-----------------------------------------------+
```

5. UTF-8 の特殊文字への対応: LIST モード
```sql
SELECT auto_partition_name('list', 'ṭṛì', 'ḍḍumai');
```
```text
+-------------------------------------------------------+
| auto_partition_name('list', 'ṭṛì', 'ḍḍumai')          |
+-------------------------------------------------------+
| p1e6d1e5bec31e0d1e0dumai6                             |
+-------------------------------------------------------+
```

6. 無効な単位パラメータ
```sql
SELECT auto_partition_name('range', 'years', '2022-12-12');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = range auto_partition_name must accept year|month|day|hour|minute|second for 2nd argument
```

### キーワード

    AUTO_PARTITION_NAME,AUTO,PARTITION,NAME
