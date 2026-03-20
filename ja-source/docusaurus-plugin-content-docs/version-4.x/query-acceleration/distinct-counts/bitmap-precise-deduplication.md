---
{
  "title": "BITMAP 精密重複排除",
  "description": "このドキュメントでは、Bitmap型を使用して正確な重複除去を実現する方法について説明します。",
  "language": "ja"
}
---
# BITMAP 精密重複排除

この文書では、Bitmap型を使用して精密重複排除を実現する方法について説明します。

Bitmapは、ビットを使用して対応するデータの存在を示す効率的なビットマップインデックス技術です。効率的な集合演算（例：和集合、積集合）を必要とするシナリオに特に適しており、非常にメモリ効率的です。精密重複排除にBitmapを使用することで、`COUNT DISTINCT`と比較して以下の利点があります：

- クエリ速度の向上
- メモリ/ディスク使用量の削減

------

## Count Distinctの実装

従来の精密重複排除は`COUNT DISTINCT`に依存しています。`name`列で重複排除を実行する以下の例を考えてください：

| id   | name |
| ---- | ---- |
| 1    | bob  |
| 2    | alex |
| 3    | jack |
| 4    | tom  |
| 5    | bob  |
| 6    | alex |

DorisがクエリSELECT COUNT(DISTINCT name) FROM tを実行する際、プロセスは以下を含みます：

1. 第一段階の重複排除のために`name`列でグループ化
2. グループ化されたデータのシャッフル
3. 第二段階の重複排除を実行し、最終的に異なる名前をカウント

このプロセスは以下のように視覚化できます：

```
        Scan                              1st Group By                       2nd Group By                     Count 
  +---------------+                   +------------+                       +------------+                +------------+ 
  | id  | name    |                   |   name     |                       |   name     |                | count(name)| 
  +-----+---------+                   +------------+                       +------------+                +------------+ 
  |  1  |   bob   |  ---------------> |    bob     |                       |    bob     |    ------->    |     4      | 
  |  2  |   alex  |                   |    alex    |                       |    alex    |                +------------+ 
  |  5  |   bob   |                   +------------+                       |    jack    | 
  |  6  |   alex  |                                                        |    tom     | 
  +---------------+                                                        +------------+ 
                                                        ----------------> 
                                           
                                           
  +---------------+                   +------------+ 
  | id  | name    |                   |   name     | 
  +-----+---------+  ---------------> +------------+ 
  |  3  |  jack   |                   |    jack    | 
  |  4  |   tom   |                   |    tom     | 
  +-----+---------+                   +------------+
```
`COUNT DISTINCT`は詳細なデータの保存とシャッフリングの実行を必要とするため、データセットが大きくなるにつれてクエリのパフォーマンスが低下します。精密な重複排除にBitmapを使用することで、大規模データセットにおける`COUNT DISTINCT`のパフォーマンス問題に対処できます。

------

### 使用ケース

大規模データのシナリオでは、`COUNT DISTINCT`を使用した重複排除のコストが大幅に増加し、クエリが遅くなります。Bitmapベースの精密な重複排除は、詳細なデータをビットにマッピングすることで、これらのパフォーマンスボトルネックに対処します。生データの柔軟性を犠牲にしながらも、Bitmapは計算効率を大幅に向上させます。以下のシナリオでBitmapの使用を検討してください：

- **クエリ高速化**: Bitmapはビット演算を利用して計算を行い、優れたパフォーマンスを提供します。
- **ストレージ圧縮**: Bitmapは詳細なデータをビットに圧縮し、ディスクとメモリでのリソース消費を大幅に削減します。

ただし、Bitmapは`TINYINT`、`SMALLINT`、`INT`、`BIGINT`などのデータ型に対してのみ精密な重複排除を実行できます。他のデータ型については、グローバル辞書を構築する必要があります。Dorisは`RoaringBitmap`を使用して精密な重複排除を実装しています。詳細については、[RoaringBitmap](https://roaringbitmap.org/)を参照してください。

------

## 精密な重複排除にBITMAPを使用する

### Table作成

1. 重複排除にBitmapを使用する場合は、Table作成文で対象カラムの型を`BITMAP`に設定し、集約関数として`BITMAP_UNION`を指定します。
2. Bitmap型のカラムはキーカラムとして使用できません。

集約Table`test_bitmap`を作成します。`id`カラムはユーザーIDを表し、`uv`カラムは`BITMAP`型で、集約関数`BITMAP_UNION`を使用します：

```
CREATE TABLE test_bitmap(
        dt DATE,
        id INT,
        name CHAR(10),
        province CHAR(10),
        os CHAR(10),
        uv BITMAP BITMAP_UNION
)
AGGREGATE KEY (dt, id, name, province, os)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```
### データインポート

以下は、Stream Loadを使用してインポートできるサンプルデータセット（`test_bitmap.csv`）です：

```
2022-05-05,10001,Test 01,Beijing,windows 
2022-05-05,10002,Test 01,Beijing,linux 
2022-05-05,10003,Test 01,Beijing,macos 
2022-05-05,10004,Test 01,Hebei,windows 
2022-05-06,10001,Test 01,Shanghai,windows 
2022-05-06,10002,Test 01,Shanghai,linux 
2022-05-06,10003,Test 01,Jiangsu,macos 
2022-05-06,10004,Test 01,Shaanxi,windows
```
**Stream Load コマンド**:

```
curl --location-trusted -u root: -H "label:label_test_bitmap_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=to_bitmap(id)" -T test_bitmap.csv http://fe_IP:8030/api/demo/test_bitmap/_stream_load
```
### データクエリ

Bitmapカラムは生の値を直接返すことはできません。代わりに、クエリには`BITMAP_UNION_COUNT`集約関数を使用してください。

**総UV計算**:

```
SELECT BITMAP_UNION_COUNT(uv) FROM test_bitmap;
+---------------------+
| BITMAP_UNION_COUNT(`uv`) |
+---------------------+
|                   4 |
+---------------------+
```
以下と同等：

```
SELECT COUNT(DISTINCT id) FROM test_bitmap;
+----------------------+
| COUNT(DISTINCT `id`) |
+----------------------+
|                    4 |
+----------------------+
```
**日次UV計算**:

```
SELECT dt, BITMAP_UNION_COUNT(uv) FROM test_bitmap GROUP BY dt;
+------------+---------------------+
| dt         | BITMAP_UNION_COUNT |
+------------+---------------------+
| 2022-05-05 |                   4 |
| 2022-05-06 |                   4 |
+------------+---------------------+
```
