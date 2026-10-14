---
{
    "title": "ワイドテーブルのストレージフォーマット V3",
    "language": "ja",
    "description": "Doris 4.1.0 以降では、ワイドテーブルのストレージフォーマット V3 が列メタデータを必要に応じて読み込み、ワイドテーブルの Segment のオープンを 16 倍高速化し、メモリ使用量を 60 分の 1 に削減します。",
    "keywords": [
        "ワイドテーブルのストレージフォーマット",
        "ストレージフォーマット V3",
        "VARIANT 列を持つワイドテーブルのクエリ",
        "Segment のオープンが遅い",
        "ワイドテーブルのクエリが遅い",
        "ワイドテーブルのメモリ使用量が多い",
        "列メタデータのオンデマンド読み込み",
        "オブジェクトストレージのクエリレイテンシー"
    ]
}
---

<!-- Knowledge type: Feature introduction / Performance tuning / Configuration parameter -->
<!-- Applicable scenario: Wide table query tuning / VARIANT column performance tuning / Object storage cold query -->

:::tip
この機能は Apache Doris 4.1.0 以降でサポートされます。テーブル作成時に `"storage_format" = "V3"` を `PROPERTIES` 句に指定すると有効になります。
:::

**ワイドテーブルのストレージフォーマット V3** は、列数が非常に多いテーブル向けに Segment のメタデータ配置を再構成します。列メタデータを Footer から分離して必要に応じて読み込むことで、V3 は Segment のオープンにかかる時間とメモリ使用量を大幅に削減します。

## 適用シナリオ {#applicable-scenarios}

クエリで **「Segment のオープン」段階が非常に遅く、メモリ使用量が異常に多い** 場合、次のいずれかに該当するなら、ストレージフォーマット V3 の有効化を推奨します。

| 利用シナリオ | 典型的な症状 | V3 の推奨度 |
| --- | --- | --- |
| ワイドテーブル（数百～数千列） | クエリで使用する列が少なくても、Segment のオープンに多くの時間とメモリがかかる | 推奨 |
| `VARIANT` 列を持つテーブル | 動的サブカラムの展開後、実際に保存される列数がテーブル定義上の列数を大幅に上回る | 推奨 |
| オブジェクトストレージや階層型ストレージへの配置 | データが S3 や OSS などのリモートストレージにあり、コールドクエリのレイテンシーが重要になる | 推奨 |
| 通常のテーブル（数十列以下） | Segment のオープンに伴うオーバーヘッドは無視できる程度 | 切り替え不要 |

> **典型的な課題の例**：7,000 列、合計 10,000 Segment のワイドテーブルでは、Segment のオープンに約 **65 秒** かかり、その間のピークメモリ使用量は **60 GB** に達します。このオーバーヘッドは、クエリが実際にそれらの列を使用するかどうかに関係なく発生する、純粋な「読み込み時の固定コスト」です。

## 根本原因 {#root-cause}

従来のフォーマットでは、すべての列のメタデータ（`ColumnMetaPB`）を Segment ファイル末尾の Footer にまとめて格納していました。そのため、次の問題が生じます。

1. **メタデータ全体の読み込み**：Segment をオープンするには、まず Footer 全体をデシリアライズする必要があります。クエリで使用する列が二つだけでも、全体の読み込みコストがかかります。
2. **Footer の肥大化**：列数が数千に達すると、Footer 自体が数 MB に膨らむことがあります。
3. **リモートストレージでの影響の増大**：オブジェクトストレージでは、ネットワークレイテンシーと高い読み取りコストによって、これらのオーバーヘッドがさらに増大します。

つまり、SQL 文が 2 列しか参照しない場合でも、Doris はスキャンを開始する前に、Segment 内の **すべての列のメタデータ** をメモリに読み込んでデシリアライズする必要があります。列数や Segment 数が増えるほど、このオーバーヘッドは顕著になります。

## V3 の主な最適化 {#key-v3-optimizations}

V3 では、ストレージフォーマットを次の三つの観点で再構成します。

### 最適化 1：列メタデータのオンデマンド読み込み {#optimization-1-on-demand-column-metadata-loading}

V3 は列メタデータを Footer から分離し、ファイル内の別の領域に配置します。Footer には、各列のメタデータを指す軽量なポインターだけを保持します。

![ワイドテーブルのストレージフォーマット：Segment ファイルのレイアウト比較](/images/variant/storage-format-v3-layout.png)

Segment をオープンする際、システムは小さな Footer だけを読み込み、実際に使用する列のメタデータを必要になった時点で取得します。**これがワイドテーブルでの性能向上の主な要因**であり、特にオブジェクトストレージで効果が顕著です。

### 最適化 2：数値型のデフォルトを Plain Encoding に変更 {#optimization-2-plain-encoding-by-default-for-numeric-types}

V3 では、`INT` や `BIGINT` などの数値型のデフォルトエンコーディングを BitShuffle から `PLAIN_ENCODING`（生のバイナリデータ）に変更します。LZ4 / ZSTD 圧縮と組み合わせることで、大量データのスキャン時に読み取りが速くなり、CPU 負荷が低下します。

### 最適化 3：文字列向けのよりコンパクトな Plain Encoding {#optimization-3-more-compact-plain-encoding-for-strings}

文字列と JSONB 向けに、V3 は `BINARY_PLAIN_ENCODING_V2` を導入します。これは `[length(varuint)][raw data]` というストリーミング形式を使用します。従来のエンコーディングで必要だった末尾のオフセットテーブルが不要になり、保存形式がよりコンパクトになります。

## 測定結果 {#measured-results}

テスト条件：7,000 列、合計 10,000 Segment のワイドテーブル。

![ワイドテーブルのストレージフォーマット：メタデータのオープン効率](/images/variant/storage-format-v3-benchmark.png)

| 指標 | 従来のフォーマット | V3 フォーマット | 改善 |
| --- | ---: | ---: | --- |
| Segment のオープン時間 | 65 s | 4 s | **16 倍高速** |
| オープン時のメモリ使用量 | 60 GB | < 1 GB | **60 倍削減** |

## 有効化の方法 {#how-to-enable}

`storage_format` に `V3` を明示的に指定するには、CREATE TABLE 文の `PROPERTIES` 句を次のように設定します。

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    name VARCHAR(128),
    attrs VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## 推奨事項 {#recommendations}

- **有効化を推奨**：列数の多いワイドテーブル（数百列以上）、`VARIANT` 列を持つテーブル、オブジェクトストレージや階層型ストレージに配置されたテーブル。
- **切り替え不要**：列数の少ない通常のテーブル（数十列以下）。従来のフォーマットで十分です。

## 関連ドキュメント {#related-documentation}

- [データ圧縮](./column-compression)：数値型と文字列型のエンコーディングおよび圧縮に関する、V3 の連携した最適化について説明します。
