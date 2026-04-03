---
{
  "title": "QUANTILE_STATE",
  "description": "QUANTILESTATE",
  "language": "ja"
}
---
## QUANTILE_STATE
### 説明

QUANTILE_STATE

**2.0では、[agg_state](AGG-STATE.md)関数をサポートしており、このタイプの代わりにagg_state quantile_union(quantile_state not null)の使用を推奨します。**

QUANTILE_STATEはキーカラムとして使用できません。HLLタイプのカラムは、AggregateTable、DuplicateTable、UniqueTableで使用できます。AggregateTableで使用する場合、table構築時の集約タイプはHLL_UNIONです。

ユーザーは長さやデフォルト値を指定する必要はありません。長さはデータ集約の度合いに応じてシステム内で制御されます。
また、QUANTILE_STATEカラムは、サポートされているQUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE関数を通してのみクエリまたは使用できます。
QUANTILE_STATEは分位数の近似値を計算するためのタイプです。同じキーを持つ異なる値は、読み込み処理中に事前集約されます。集約される値の数が2048を超えない場合、すべてのデータが詳細に記録されます。集約される値の数が2048より大きい場合、[TDigest](https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf)アルゴリズムを使用してデータを集約（クラスタリング）し、クラスタリング後の重心点を保存します。

関連関数:
    
    QUANTILE_UNION(QUANTILE_STATE):
      
      この関数は集約関数で、異なる分位数計算の中間結果を集約するために使用されます。この関数が返す結果は引き続きQUANTILE_STATEです

    
    TO_QUANTILE_STATE(DOUBLE raw_data [,FLOAT compression]):
       
       この関数は数値タイプをQUANTILE_STATEタイプに変換します
       compressionパラメータはオプションで、[2048, 10000]の範囲で設定できます。
       値が大きいほど、分位数近似計算の精度が高く、メモリ消費量が大きく、計算時間が長くなります。
       compressionパラメータが未指定または設定値が[2048, 10000]の範囲外の場合、デフォルト値2048で実行されます

    QUANTILE_PERCENT(QUANTILE_STATE, percent):
       この関数は分位数計算の中間結果変数（QUANTILE_STATE）を具体的な分位数値に変換します

    
### 注意

現在、QUANTILE_STATEはAggregate ModelTableでのみ使用できます。使用前に以下のコマンドでQUANTILE_STATEタイプ機能のスイッチを有効にする必要があります：

```
$ mysql-client > admin set frontend config("enable_quantile_state_type"="true");
```
このようにconfigはFEプロセスが再起動した後にリセットされます。永続的な設定のためには、fe.conf内にconfig `enable_quantile_state_type=true`を追加することができます。

### example
    select QUANTILE_PERCENT(QUANTILE_UNION(v1), 0.5) from test_table group by k1, k2, k3;

### keywords

    QUANTILE_STATE, QUANTILE_UNION, TO_QUANTILE_STATE, QUANTILE_PERCENT
