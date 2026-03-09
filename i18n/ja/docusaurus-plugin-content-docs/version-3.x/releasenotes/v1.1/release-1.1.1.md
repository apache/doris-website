---
{
  "title": "Release 1.1.1",
  "language": "ja",
  "description": "この機能は非ベクトル化エンジンでは有効になっていますが、1.1のベクトル化エンジンでは欠落していました。そのため、1.1.1でこの機能を追加し直します。"
}
---
## 機能

### Vectorized EngineでのODBC Sinkサポート

この機能は非vectorized engineでは有効になっていましたが、1.1のvectorized engineでは欠落していました。そのため、1.1.1でこの機能を追加し直しました。

### Vectorized Engine用のシンプルなMemtracker

1.1では、vectorized engine用のmemtrackerがBEに存在せず、メモリが制御不能になりOOMを引き起こしていました。1.1.1では、シンプルなmemtrackerがBEに追加され、メモリを制御し、メモリが上限を超えた場合にクエリをキャンセルできるようになりました。

## 改善

### page cacheでの展開データのキャッシュ

一部のデータはbitshuffleを使用して圧縮されており、クエリ実行中の展開に多くの時間を要していました。1.1.1では、dorisはbitshuffleでエンコードされたデータを展開してクエリを高速化し、ssb-flatの一部のクエリで30%のレイテンシ削減を実現できることを確認しました。

## バグ修正

### 1.0からのローリングアップグレードができない問題の修正（重大）

この問題はバージョン1.1で導入され、FEをアップグレードせずにBEをアップグレードした場合にBEがcoreを起こす可能性がありました。

この問題が発生した場合は、[#10833](https://github.com/apache/doris/pull/10833)で修正を試すことができます。

### 一部のクエリが非vectorized engineにフォールバックされず、BEがcoreを起こす問題の修正

現在、vectorized engineはすべてのsqlクエリを処理できず、一部のクエリ（left outer joinなど）は非vectorized engineを使用して実行されます。しかし、1.1では対象外となるケースが存在し、beクラッシュの原因となっていました。

### Compactionが正常に動作せず-235エラーを引き起こす問題

uniq key compactionにおいて1つのrowsetが複数のsegmentを持つ場合、segmentの行がgeneric_iteratorでマージされますが、merged_rowsが増加されていませんでした。Compactionはcheck_correctnessで失敗し、tabletのバージョンが過多となり-235ロードエラーを引き起こしていました。

### クエリ実行中のsegment faultの一部のケース

[#10961](https://github.com/apache/doris/pull/10961) 
[#10954](https://github.com/apache/doris/pull/10954) 
[#10962](https://github.com/apache/doris/pull/10962)

# 謝辞

このリリースにご貢献いただいた皆様に感謝いたします：

```
@jacktengg
@mrhhsg
@xinyiZzz
@yixiutt
@starocean999
@morrySnow
@morningman
@HappenLee
```
