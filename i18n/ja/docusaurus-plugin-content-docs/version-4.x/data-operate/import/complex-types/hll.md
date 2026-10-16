---
{
    "title": "HLL",
    "language": "ja",
    "description": "Stream Load と hll_hash 関数を併用して Doris の HLL カラムにデータをインポートし、大量のデータに対して高速な概算重複排除カウントを行う方法を説明します。",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "概算重複排除カウント",
        "概算重複排除",
        "hll_hash",
        "hll_cardinality",
        "Stream Load",
        "Count Distinct",
        "UV 統計",
        "Doris の複合型のインポート"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Approximate distinct counting on large data volumes / UV statistics / HLL column data import -->

HLL（HyperLogLog）は、Doris が提供する**概算重複排除カウント**用のデータ型です。大量のデータでは、HLL は `Count Distinct` よりも重複排除の性能が大幅に高く、UV 統計やユニークユーザー数の集計などによく使用されます。

HLL カラムには元の値を直接書き込めないため、インポート時に `hll_hash` などの関数で値をハッシュ化する必要があります。HLL 型の詳細については、[HLL](../../../sql-manual/basic-element/sql-data-types/aggregate/HLL)を参照してください。

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| 大量のデータに対する UV 統計 | たとえば、日次や月次のアクティブなユニークユーザー数の推定 |
| 大量のデータに対する重複排除カウント | 百万件を超える規模で、小さな誤差が許容される場合 |
| Count Distinct の代替 | 誤差を許容範囲に収めながら、計算コストを大幅に削減 |

## 作業の流れ

HLL データのインポートは、次の 4 ステップで行います。

1. インポートするソースデータファイルを用意します。
2. Doris に HLL カラムを持つターゲットテーブルを作成します。
3. Stream Load と `hll_hash` 関数を併用してデータをインポートします。
4. `hll_cardinality` でインポート結果を確認します。

## 例

### ステップ 1: データを用意する

次の内容でソースデータファイル `test_hll.csv` を作成します。

```sql
1001|koga
1002|nijg
1003|lojn
1004|lofn
1005|jfin
1006|kon
1007|nhga
1008|nfubg
1009|huang
1010|buag
```

### ステップ 2: データベースにテーブルを作成する

ターゲットデータベースに、HLL カラムを持つ集約モデルのテーブルを作成します。

```sql
CREATE TABLE testdb.test_hll(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```

注意事項:

- HLL カラムには集約関数 `hll_union` を指定する必要があります。
- テーブルモデルは `AGGREGATE KEY` である必要があります。

### ステップ 3: データをインポートする

Stream Load でデータをインポートします。`columns` パラメータで `hll_hash` をソースカラム `typ_id` に適用し、結果を `pv` カラムに書き込みます。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T test_hll.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

主なパラメータの説明:

| パラメータ | 説明 |
| --- | --- |
| `column_separator` | ソースファイルのカラム区切り文字。この例では `|` を使用します。 |
| `columns` | フィールドのマッピング式。HLL カラムに書き込む値は `hll_hash()` で変換する必要があります。 |
| `<doris_user>` / `<doris_password>` | Doris のユーザー名とパスワード。 |
| `<fe_ip>` / `<fe_http_port>` | FE ノードの IP アドレスと HTTP ポート。 |

### ステップ 4: インポートしたデータを確認する

`hll_cardinality` 関数を使用して、HLL カラムの重複排除カウントの結果を照会します。

```sql
mysql> select typ_id,typ_name,hll_cardinality(pv) from testdb.test_hll;
+--------+----------+---------------------+
| typ_id | typ_name | hll_cardinality(pv) |
+--------+----------+---------------------+
|   1010 | buag     |                   1 |
|   1002 | nijg     |                   1 |
|   1001 | koga     |                   1 |
|   1008 | nfubg    |                   1 |
|   1005 | jfin     |                   1 |
|   1009 | huang    |                   1 |
|   1004 | lofn     |                   1 |
|   1007 | nhga     |                   1 |
|   1003 | lojn     |                   1 |
|   1006 | kon      |                   1 |
+--------+----------+---------------------+
10 rows in set (0.06 sec)
```

この結果では、各行の HLL カラムのカーディナリティが 1 になっています。これは、データが正しくインポートされ、`hll_hash` によってハッシュ化されたことを示します。

## よくある質問

### HLL カラムに hll_hash が必要なのはなぜですか？

HLL は特殊なバイナリ集約型であり、元の値を直接格納できません。HLL カラムに書き込む前に、`hll_hash` を使用して元の値を HLL の内部表現に変換する必要があります。

### HLL と Count Distinct の違いは何ですか？

| 比較項目 | HLL | Count Distinct |
| --- | --- | --- |
| 精度 | 概算値（小さな誤差あり） | 正確な値 |
| 性能 | 大量のデータで大幅に高い | 大量のデータでは顕著に低下 |
| ストレージ | 一定で比較的小さい領域を使用 | 追加のストレージは不要 |
| 適用シナリオ | UV の推定など、ある程度の誤差が許容される場合 | 正確な重複排除カウントが必要な場合 |

### HLL カラムを作成する際に必要なテーブルモデルは何ですか？

HLL カラムは集約関数 `hll_union` を使用するため、`AGGREGATE KEY` の集約モデルテーブルで使用する必要があります。
