---
{
  "title": "BITMAP精密重複排除",
  "description": "このドキュメントでは、Bitmap型を使用して正確な重複排除を実現する方法について説明します。",
  "language": "ja"
}
---
# BITMAP Precise Deduplication

この文書では、Bitmapタイプを使用した正確な重複排除を実現する方法について説明します。

Bitmapは、対応するデータの存在を示すためにビットを使用する効率的なビットマップインデックス技術です。効率的な集合演算（例：和集合、積集合）を必要とするシナリオに特に適しており、メモリ効率性に優れています。正確な重複排除にBitmapを使用することで、`COUNT DISTINCT`と比較して以下の利点があります：

- クエリ速度の向上。
- メモリ/ディスク使用量の削減。

------

## Count Distinctの実装

従来の正確な重複排除は`COUNT DISTINCT`に依存しています。`name`列で重複排除を行う以下の例を考えてみましょう：

| id   | name |
| ---- | ---- |
| 1    | bob  |
| 2    | alex |
| 3    | jack |
| 4    | tom  |
| 5    | bob  |
| 6    | alex |

DorisがクエリSELECT COUNT(DISTINCT name) FROM t`を実行する際、プロセスは以下を含みます：

1. 第1段階の重複排除のための`name`列によるグループ化。
2. グループ化されたデータのシャッフル。
3. 第2段階の重複排除を実行し、最終的に個別の名前をカウント。

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
`COUNT DISTINCT`は詳細なデータの保存とシャッフリングの実行を必要とするため、データセットが大きくなるにつれてクエリのパフォーマンスが低下します。精密重複排除にBitmapを使用することで、大規模データセットにおける`COUNT DISTINCT`のパフォーマンス問題に対処できます。

------

### 使用ケース

大規模データシナリオでは、`COUNT DISTINCT`を使用した重複排除のコストが大幅に増加し、クエリが遅くなります。Bitmapベースの精密重複排除は、詳細なデータをビットにマッピングすることで、これらのパフォーマンスボトルネックに対処します。生データの柔軟性を犠牲にする一方で、Bitmapは計算効率を大幅に向上させます。以下のシナリオでBitmapの使用を検討してください：

- **クエリ高速化**: Bitmapはビット演算を利用して計算を行い、優れたパフォーマンスを提供します。
- **ストレージ圧縮**: Bitmapは詳細なデータをビットに圧縮し、ディスクおよびメモリのリソース消費を大幅に削減します。

ただし、Bitmapは`TINYINT`、`SMALLINT`、`INT`、`BIGINT`などのデータ型に対してのみ精密重複排除を実行できます。その他のデータ型については、グローバル辞書を構築する必要があります。Dorisは`RoaringBitmap`を使用して精密重複排除を実装しています。詳細については、[RoaringBitmap](https://roaringbitmap.org/)を参照してください。

------

## 精密重複排除にBITMAPを使用する

### Table作成

1. 重複排除にBitmapを使用する場合は、Table作成文でターゲット列の型を`BITMAP`に設定し、集約関数として`BITMAP_UNION`を指定します。
2. Bitmap型の列はキー列として使用できません。

集約Table`test_bitmap`を作成します。`id`列はユーザーIDを表し、`uv`列は`BITMAP`型で、集約関数`BITMAP_UNION`を使用します：

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
**Stream Load Command**:

```
curl --location-trusted -u root: -H "label:label_test_bitmap_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=to_bitmap(id)" -T test_bitmap.csv http://fe_IP:8030/api/demo/test_bitmap/_stream_load
```
### データのクエリ

Bitmapカラムは直接生の値を返すことができません。代わりに、クエリには`BITMAP_UNION_COUNT`集約関数を使用してください。

**合計UV計算**:

```
SELECT BITMAP_UNION_COUNT(uv) FROM test_bitmap;
+---------------------+
| BITMAP_UNION_COUNT(`uv`) |
+---------------------+
|                   4 |
+---------------------+
```
次と同等:

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
