---
{
  "title": "QUANTILE_STATE",
  "language": "ja",
  "description": "QUANTILESTATE"
}
---
## QUANTILE_STATE
### 説明

QUANTILE_STATE

**2.0では、[agg_state](AGG-STATE.md)関数をサポートしており、この型の代わりにagg_state quantile_union(quantile_state not null)の使用を推奨します。**

QUANTILE_STATEはキー列として使用できません。HLL型の列は、Aggregateテーブル、Duplicateテーブル、Uniqueテーブルで使用できます。Aggregateテーブルで使用する場合、テーブル構築時の集約タイプはHLL_UNIONになります。

ユーザーは長さとデフォルト値を指定する必要はありません。長さは、データ集約の程度に応じてシステム内で制御されます。
QUANTILE_STATE列は、対応するQUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE関数を通じてのみクエリまたは使用できます。
QUANTILE_STATEは、分位数の近似値を計算するための型です。同じキーを持つ異なる値は、ロードプロセス中に事前集約されます。集約された値の数が2048を超えない場合、すべてのデータが詳細に記録されます。集約された値の数が2048を超える場合、[TDigest](https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf)アルゴリズムを使用してデータを集約（クラスタ化）し、クラスタ化後の重心点を保存します。

関連関数：
    
    QUANTILE_UNION(QUANTILE_STATE)：
      
      この関数は集約関数であり、異なる分位数計算の中間結果を集約するために使用されます。この関数によって返される結果は、依然としてQUANTILE_STATEです

    
    TO_QUANTILE_STATE(DOUBLE raw_data [,FLOAT compression])：
       
       この関数は数値型をQUANTILE_STATE型に変換します
       compressionパラメータはオプションであり、[2048, 10000]の範囲で設定できます。
       値が大きいほど、分位数近似計算の精度が高くなり、メモリ消費量が増加し、計算時間が長くなります。
       compressionパラメータが未指定または[2048, 10000]の範囲外の値に設定されている場合、デフォルト値の2048で実行されます

    QUANTILE_PERCENT(QUANTILE_STATE, percent)：
       この関数は、分位数計算の中間結果変数（QUANTILE_STATE）を特定の分位数値に変換します

    
### 注意事項

現在、QUANTILE_STATEはAggregate Modelテーブルでのみ使用できます。使用前に、以下のコマンドでQUANTILE_STATE型機能のスイッチを有効にする必要があります：

```
$ mysql-client > admin set frontend config("enable_quantile_state_type"="true");
```
このようにして、FEプロセスが再起動した後にconfigがリセットされます。永続的な設定については、fe.conf内に`enable_quantile_state_type=true`のconfigを追加することができます。

### example
    select QUANTILE_PERCENT(QUANTILE_UNION(v1), 0.5) from test_table group by k1, k2, k3;

### keywords

    QUANTILE_STATE, QUANTILE_UNION, TO_QUANTILE_STATE, QUANTILE_PERCENT
