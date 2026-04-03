---
{
  "title": "AUTO_PARTITION_NAME",
  "language": "ja",
  "description": "AUTOPARTITIONNAME関数は、自動パーティション用のパーティション名を生成するために使用されます。"
}
---
## 説明

AUTO_PARTITION_NAME 関数は、自動パーティション用のパーティション名を生成するために使用されます。この関数は2つのモードをサポートしています：RANGE モードは時間単位に基づいてパーティション名を生成し、LIST モードは文字列値に基づいてパーティション名を生成します。

Apache Doris 2.1.6 以降でサポートされています。

## 構文

```sql
AUTO_PARTITION_NAME('RANGE', <unit>, <datetime>)
AUTO_PARTITION_NAME('LIST', <value>[, <value> ...])
```
## パラメータ

| パラメータ | 説明 |
| ----------- | ----------------------------------------- |
| `'RANGE'` | RANGEパーティションモード、時刻に基づいてパーティション名を生成 |
| `'LIST'` | LISTパーティションモード、文字列値に基づいてパーティション名を生成 |
| `<unit>` | RANGEモードの時間単位: `year`、`month`、`day`、`hour`、`minute`、`second`。型: VARCHAR |
| `<datetime>` | RANGEモードの日時値。型: DATETIME |
| `<value>` | LISTモードのパーティション値（複数可）。型: VARCHAR |

## 戻り値

VARCHAR型を返し、生成されたパーティション名を表す。

特殊な場合:
- RANGEモード: パーティション名の形式は`pYYYYMMDDHHMMSS`、単位に基づいて対応する精度に切り詰められる
- LISTモード: パーティション名の形式は`p<value><length>`、複数の値は長さで区切られる
- パラメータが無効な場合、エラーを返す

## 例

1. 基本的な使用法: 日単位のRANGE

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
2. 月別のRANGE

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
3. LIST単一値

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
4. 複数の値をLISTする

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
5. UTF-8特殊文字サポート：LISTモード

```sql
SELECT auto_partition_name('list', 'ṭṛì', 'ḍḍumai');
```
```text
+------------------------------------------------+
| auto_partition_name('list', 'ṭṛì', 'ḍḍumai')  |
+------------------------------------------------+
| pṭṛì9ḍḍumai12                                  |
+------------------------------------------------+
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
