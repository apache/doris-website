---
{
    "title": "HLL による近似重複排除",
    "language": "ja",
    "description": "Doris で HLL (HyperLogLog) を使用して近似重複排除を行う方法。誤差 1%-2%、空間計算量 O(mloglogn) で、大規模な UV 統計やカーディナリティ統計に適しています。",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "近似重複排除",
        "カーディナリティ統計",
        "UV 統計",
        "HLL_UNION_AGG",
        "HLL_HASH"
    ]
}
---

<!-- Knowledge type: Capability definition / Operational steps -->
<!-- Applicable scenarios: Large-scale data deduplication / UV statistics / Cardinality estimation -->

HLL (HyperLogLog) は、確率的アルゴリズムに基づく近似重複排除の手法です。1%-2% の誤差範囲で、大規模なデータセットのカーディナリティ (Distinct Count) を非常に小さい空間と時間のコストで計算します。

## ユースケース

<!-- Knowledge type: Architecture selection decision -->

業務データ量が増え続けると、厳密な重複排除に必要な計算コストとストレージコストが急増します。データが一定の規模に達すると、厳密な重複排除は費用対効果が見合わなくなります。

HLL アルゴリズムには、次の特徴があります。

| 項目             | 特性                                                    |
| :--------------- | :------------------------------------------------------ |
| 空間計算量       | O(mloglogn)                                             |
| 時間計算量       | O(n)                                                    |
| 誤差範囲         | 約 1%-2% (データセットとハッシュ関数によって異なります) |

業務上この誤差を許容できる場合、HLL を使った近似重複排除は、計算負荷を軽減してクエリを高速化する有効な方法です。

- 適した用途: データ量が非常に多く、1%-2% の誤差を許容でき、クエリ性能とストレージコストのバランスを取る必要がある場合。
- 使用方法: テーブル作成時に列の型を `HLL`、集約関数を `HLL_UNION` に設定します。データロード時に `HLL_HASH()` で HLL 値を生成し、クエリ時に `HLL_UNION_AGG()` で集約します。
- 一般的な用途: UV 統計、ユーザーの重複排除、ユニークデバイス数の推定。

## HyperLogLog とは

<!-- Knowledge type: Principle explanation -->

HyperLogLog は LogLog アルゴリズムを改良したものです。カーディナリティ (重複を除いた要素数) を近似的に推定し、その数学的基礎は **ベルヌーイ試行** です。

### ベルヌーイ試行の直感的な説明

- コインには表と裏があり、一度投げると、それぞれが出る確率は 50% であるとします。
- 表が出るまでコインを投げ続け、それを一回の試行として記録します。
- この試行を n 回繰り返します。つまり、表が n 回出ることになります。各試行でコインを投げた回数を k、i 番目の試行における回数を k_i とします。
- n 回の試行には、コインを投げた回数の最大値があり、それを k_max とします (例えば、ある試行では表が出るまで 12 回投げた場合)。

### 導かれる結論

- n 回のベルヌーイ試行でコインを投げた回数は、いずれも k_max 以下です。
- n 回のベルヌーイ試行のうち、少なくとも一回はコインを投げた回数が k_max に等しくなります。

最尤推定と組み合わせると、n と k_max の関係は **n = 2 ^ k_max** と推定できます。

つまり、**k_max を記録するだけで、レコードの総数、すなわちカーディナリティを推定できます**。これが HLL アルゴリズムの基本的な考え方です。

## HLL を使用した近似重複排除

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Create table -> Load data -> Query -->

### ステップ 1: テーブルを作成する

**目的**: HLL による重複排除に対応した集約テーブルを作成します。

**制約**:

1. 対象列の型を `HLL`、集約関数を `HLL_UNION` に設定する必要があります。
2. HLL 型の列を Key 列として使用することはできません。
3. 長さやデフォルト値を指定する必要はありません。HLL 列の長さは、データの集約度に応じてシステムが内部的に制御します。

**例**:

```SQL
create table test_hll(
        dt date,
        id int,
        name char(10),
        province char(10),
        os char(10),
        uv hll hll_union
)
Aggregate KEY (dt,id,name,province,os)
distributed by hash(id) buckets 10
PROPERTIES(
        "replication_num" = "1",
        "in_memory"="false"
);
```

### ステップ 2: データをロードする

**目的**: `HLL_HASH()` を使用して元の詳細データを HLL 列に変換し、テーブルに書き込みます。

**サンプルデータ** (`test_hll.csv`):

```SQL
2022-05-05,10001,test01,Beijing,windows 
2022-05-05,10002,test01,Beijing,linux 
2022-05-05,10003,test01,Beijing,macos 
2022-05-05,10004,test01,Hebei,windows 
2022-05-06,10001,test01,Shanghai,windows 
2022-05-06,10002,test01,Shanghai,linux 
2022-05-06,10003,test01,Jiangsu,macos 
2022-05-06,10004,test01,Shaanxi,windows
```

#### Stream Load コマンド

```SQL
curl --location-trusted -u root: -H "label:label_test_hll_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os,uv=hll_hash(id)" -T test_hll.csv http://fe_IP:8030/api/demo/test_hll/_stream_load
```

#### ロード結果の例

```SQL
# curl --location-trusted -u root: -H "label:label_test_hll_load"     -H "column_separator:,"     -H "columns:dt,id,name,province,os, pv=hll_hash(id)" -T test_hll.csv http://127.0.0.1:8030/api/demo/test_hll/_stream_load

{
    "TxnId": 693,
    "Label": "label_test_hll_load",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 8,
    "NumberLoadedRows": 8,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 320,
    "LoadTimeMs": 23,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9,
    "CommitAndPublishTimeMs": 11
}
```

### ステップ 3: データをクエリする

**目的**: HLL 集約関数を使用して近似重複排除の結果を取得します。

> 注意: HLL 列の生の値を直接クエリすることはできません。HLL 集約関数を通じてのみクエリできます。

#### UV の総数

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
+---------------------+
1 row in set (0.00 sec)
```

同等の書き方:

```SQL
mysql> SELECT COUNT(DISTINCT uv) FROM test_hll;
+----------------------+
| count(DISTINCT `uv`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

#### 日別の UV

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll group by dt;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
|                   4 |
+---------------------+
2 rows in set (0.01 sec)
```

## 関連する関数

<!-- Knowledge type: Configuration parameters / Function list -->

| 関数                       | 用途                                                                  |
| :------------------------- | :-------------------------------------------------------------------- |
| `HLL_UNION_AGG(hll)`       | 一致するすべてのデータのカーディナリティ推定値を計算する集約関数      |
| `HLL_CARDINALITY(hll)`     | 単一の HLL 列の値のカーディナリティ推定値を計算します                   |
| `HLL_HASH(column_name)`    | HLL 型の値を生成し、Insert またはデータロード時に使用します (上記のロード例を参照) |
| `HLL_EMPTY()`              | 空の HLL 値を生成し、`insert` またはデータロード時にデフォルト値を設定するために使用します |
