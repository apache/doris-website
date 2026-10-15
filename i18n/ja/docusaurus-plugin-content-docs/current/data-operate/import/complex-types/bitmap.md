---
{
    "title": "BITMAP",
    "language": "ja",
    "description": "Apache Doris で BITMAP データをロードする方法を説明します。テーブル設計上の制約、Stream Load の例、複数要素を含む BITMAP をロードする二つの方法を扱います。",
    "keywords": [
        "Doris BITMAP",
        "BITMAP のロード",
        "BITMAP_UNION",
        "to_bitmap",
        "bitmap_from_string",
        "bitmap_from_array",
        "BITMAP の Stream Load",
        "Aggregate テーブルの BITMAP"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenarios: BITMAP data loading / exact deduplication / user profile tags -->

BITMAP 型は、厳密な重複排除やユーザープロファイルのタグ付けなどによく使用されます。このドキュメントでは、Apache Doris の BITMAP カラムに関するテーブル設計上の制約を説明し、Stream Load を使用した単一値と複数要素の二つのロード方法を示します。

## BITMAP 型の制約

BITMAP データをロードする前に、次の制約を確認してください。

| 制約 | 説明 |
| --- | --- |
| 対応するテーブルモデル | Duplicate テーブル、Unique テーブル、Aggregate テーブル |
| カラムの位置 | Value カラムとしてのみ使用でき、Key カラムとしては使用できません |
| Aggregate テーブルの要件 | Aggregate テーブルでは、BITMAP カラムに集約方式 `BITMAP_UNION` を指定する必要があります |
| 長さとデフォルト値 | 長さやデフォルト値を指定する必要はありません。集約レベルに応じて、システムが長さを自動的に制御します |

型の詳細については、[BITMAP データ型](../../../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)を参照してください。

## シナリオ 1：単一値の BITMAP データをロードする

ソースデータの各行に BITMAP へ変換する整数値が一つだけ含まれる場合に使用します。`to_bitmap` 関数でその整数を BITMAP に変換します。

### ステップ 1：データを準備する

各行に BITMAP へ変換する整数値を一つ含む CSV ファイル `test_bitmap.csv` を作成します。

```text
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```

### ステップ 2：ターゲットテーブルを作成する

`testdb` データベースに BITMAP カラムを持つ Aggregate テーブルを作成します。

```sql
CREATE TABLE testdb.test_bitmap(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```

### ステップ 3：Stream Load を実行する

`to_bitmap` 関数で整数カラムを BITMAP に変換します。

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### ステップ 4：ロード結果を確認する

`bitmap_to_string` を使用して BITMAP を文字列に戻し、ロードされたデータを確認します。

```sql
mysql> select typ_id,hou,bitmap_to_string(arr) from testdb.test_bitmap;
+--------+-------+-----------------------+
| typ_id | hou   | bitmap_to_string(arr) |
+--------+-------+-----------------------+
|      4 | lofn  | 489871                |
|      6 | kon   | 676724                |
|      9 | huang | 969798                |
|      3 | lojn  | 347890                |
|      8 | nfubg | 879878                |
|      7 | nhga  | 767689                |
|      1 | koga  | 17723                 |
|      2 | nijg  | 146285                |
|      5 | jfin  | 545679                |
|     10 | buag  | 97997                 |
+--------+-------+-----------------------+
10 rows in set (0.07 sec)
```

## シナリオ 2：複数要素の BITMAP データをロードする

ソースデータの各行に複数の整数値（複数のユーザー ID など）が含まれる場合は、ソースファイルの形式に応じて次の二つの方法から選択します。それぞれの違いは次のとおりです。

| 方法 | ソースファイルの形式 | 型変換の要否 | 注意点 |
| --- | --- | --- | --- |
| `bitmap_from_string` | カンマ区切り。角括弧は **使用不可** | 不要 | 角括弧はデータ品質エラーとして扱われます |
| `bitmap_from_array` | カンマ区切り。角括弧は **使用可能** | `cast` で `array<int>` に変換する必要があります | 明示的な型変換を省略すると、関数のシグネチャが一致せずロードに失敗します |

### 方法 A：bitmap_from_string を使用する

#### データ形式の要件

ソースファイルの `arr` カラムにはカンマ区切りの値を指定し、角括弧は含めないでください。

```text
1|koga|17,723
2|nijg|146,285
3|lojn|347,890
4|lofn|489,871
5|jfin|545,679
6|kon|676,724
7|nhga|767,689
8|nfubg|879,878
9|huang|969,798
10|buag|97,997
```

#### Stream Load コマンド

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=bitmap_from_string(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### 方法 B：bitmap_from_array を使用する

#### データ形式の要件

ソースファイルの `arr` カラムには角括弧を含めることができます。

```text
1|koga|[17,723]
2|nijg|[146,285]
3|lojn|[347,890]
4|lofn|[489,871]
5|jfin|[545,679]
6|kon|[676,724]
7|nhga|[767,689]
8|nfubg|[879,878]
9|huang|[969,798]
10|buag|[97,997]
```

#### Stream Load コマンド

Stream Load では、最初に文字列を `cast` で `array<int>` に変換し、続いて `bitmap_from_array` で BITMAP に変換する必要があります。

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr_str,arr=bitmap_from_array(cast(arr_str as array<int>))" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

## トラブルシューティング

### bitmap_from_array の使用時に「関数が存在しない」というエラーが発生する

エラーの例：

```text
[ANALYSIS_ERROR]TStatus: errCode = 2, detailMessage = Does not support non-builtin functions, or function does not exist: bitmap_from_array(<slot 8>)
```

- **原因**：文字列を `array<int>` に明示的に型変換していないため、`bitmap_from_array` の関数シグネチャと一致しません。
- **解決方法**：Stream Load の `columns` パラメータで `cast(arr_str as array<int>)` を使用して、明示的に変換します。

### クエリで BITMAP カラムの内容を確認する方法

BITMAP はバイナリ集約型であり、`SELECT` で直接内容を確認することはできません。関数を使用して変換する必要があります。

- `bitmap_to_string(col)`：BITMAP をカンマ区切りの文字列に変換します。
- `bitmap_count(col)`：BITMAP 内の重複しない要素の数を返します。

### BITMAP を Key カラムとして使用できない理由

BITMAP はバイナリ集約型です。ソートや重複排除に使う Key カラムには指定できず、集約結果を保持する Value カラムとしてのみ格納できます。
