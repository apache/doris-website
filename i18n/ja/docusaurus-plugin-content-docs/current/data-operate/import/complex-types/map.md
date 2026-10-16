---
{
    "title": "MAP | 複合型",
    "language": "ja",
    "description": "Apache Doris の MAP 型カラムにデータをロードする方法を説明します。CSV 形式と JSON 形式について、テーブルの作成、Stream Load コマンド、結果の確認を扱います。",
    "keywords": [
        "Doris MAP ロード",
        "MAP データ型",
        "複合型のロード",
        "Stream Load MAP",
        "CSV による MAP のロード",
        "JSON による MAP のロード",
        "半構造化データ"
    ],
    "sidebar_label": "MAP"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Complex type data load / Stream Load practice -->

`MAP<K, V>` は `MAP` 型を表し、キーと値の型はそれぞれ `K, V` です。半構造化されたキーと値のペアを格納する際によく使用します。詳しくは [MAP データ型](../../../sql-manual/basic-element/sql-data-types/semi-structured/MAP.md) を参照してください。

このドキュメントでは、**MAP 型カラムにデータを書き込む方法**を説明し、一般的な二種類のデータソースについて、最初から最後までの例を示します。

- [CSV 形式でのロード](#csv-format-load): 入力データが区切り文字付きテキストの場合に適しています。カラム区切り文字と MAP 内のカンマが競合しないように注意してください。
- [JSON 形式でのロード](#json-format-load): 入力データが JSON 配列または JSON Lines の場合に適しています。

どちらのロード方法も [Stream Load](../import-way/stream-load-manual.md) インターフェースを使用します。基本的な手順は次のとおりです。

1. データファイルを用意します。
2. データベースにテーブルを作成します。
3. `curl` で Stream Load を呼び出し、データをロードします。
4. 結果をクエリで確認します。

## CSV 形式でのロード {#csv-format-load}

### ステップ 1: データを用意する

次の CSV ファイル `test_map.csv` を作成します。カラム区切り文字にはカンマの代わりに `|` を使用し、MAP 内のカンマとの競合を避けます。

```text
1|{"Emily":101,"age":25}
2|{"Benjamin":102}
3|{}
4|null
```

ファイル内の各行の意味は次のとおりです。

| 行 | 意味 |
| --- | --- |
| `1\|{"Emily":101,"age":25}` | 二組のキーと値のペアを含む MAP |
| `2\|{"Benjamin":102}` | 一組のキーと値のペアを含む MAP |
| `3\|{}` | 空の MAP |
| `4\|null` | NULL 値 |

### ステップ 2: データベースにテーブルを作成する

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### ステップ 3: データをロードする

Stream Load で CSV ファイルをロードします。主なヘッダーの意味を次の表に示します。

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_map" \
        -T "test_map.csv" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| ヘッダー | 目的 |
| --- | --- |
| `column_separator:|` | MAP 内のカンマと競合しないように、カラム区切り文字を `|` に設定します |
| `columns: id, c_map` | ファイルのカラムとテーブルのカラムの対応を指定します |

### ステップ 4: ロードしたデータを確認する

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## JSON 形式でのロード {#json-format-load}

### ステップ 1: データを用意する

次の JSON ファイル `test_map.json` を作成します。ファイル全体が JSON 配列で、各要素がデータの一行に対応します。

```json
[
    {"id":1, "c_map":{"Emily":101, "age":25}},
    {"id":2, "c_map":{"Benjamin":102}},
    {"id":3, "c_map":{}},
    {"id":4, "c_map":null}
]
```

### ステップ 2: データベースにテーブルを作成する

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### ステップ 3: データをロードする

Stream Load で JSON ファイルをロードします。主なヘッダーの意味を次の表に示します。

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_map" \
        -H "strip_outer_array:true" \
        -T "test_map.json" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| ヘッダー | 目的 |
| --- | --- |
| `format:json` | データ形式が JSON であることを指定します |
| `strip_outer_array:true` | 入力が JSON 配列の場合に、配列の各要素を一行として解析します |
| `columns: id, c_map` | JSON フィールドとテーブルのカラムの対応を指定します |

### ステップ 4: ロードしたデータを確認する

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## よくある質問

**Q1: CSV のカラム区切り文字にカンマを使用しないのはなぜですか？**

MAP のリテラル自体が、複数のキーと値のペアを区切るためにカンマを使用します（例: `{"Emily":101,"age":25}`）。カラム区切り文字にもカンマを使用すると、解析時にどちらの区切りか判別できなくなります。`|` や `\t` など、MAP の内容に現れない文字を使用することを推奨します。

**Q2: JSON 配列のロード時に `strip_outer_array:true` が必要なのはなぜですか？**

JSON ファイルの最外層が配列の場合（このドキュメントの例など）は、Doris が配列の各要素をデータの一行として扱うように `strip_outer_array:true` を設定する必要があります。ファイルがすでに JSON Lines 形式（一行に一つのオブジェクト）の場合、このパラメータは不要です。

**Q3: 空の MAP と NULL はどのように表しますか？**

- 空の MAP: CSV では `{}`、JSON でも `{}` と記述します。
- NULL 値: CSV では `null`、JSON でも `null` と記述します。対象のカラムは `NULL` を許容する必要があります。
