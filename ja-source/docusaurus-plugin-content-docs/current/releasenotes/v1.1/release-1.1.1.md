---
{
  "title": "リリース 1.1.1",
  "language": "ja",
  "description": "この機能は非ベクトル化エンジンでは有効になっていますが、1.1のベクトル化エンジンでは欠落していました。そのため、1.1.1でこの機能を追加し直しました。"
}
---
## 機能

### Vectorized EngineでのODBC Sinkサポート

この機能は非vectorizedエンジンでは有効でしたが、1.1のvectorizedエンジンでは欠けていました。そのため、1.1.1でこの機能を追加し直しました。

### Vectorized Engine用のシンプルなMemtracker

1.1ではvectorized engine用のBEにmemtrackerがなく、メモリが制御不能になりOOMを引き起こしていました。1.1.1では、シンプルなmemtrackerをBEに追加し、メモリを制御してメモリ上限を超えた際にクエリをキャンセルできるようになりました。

## 改善

### page cacheでの展開データのキャッシュ

一部のデータはbitshuffleを使用して圧縮されており、クエリ実行時の展開に多くの時間がかかっていました。1.1.1では、dorisはbitshuffleでエンコードされたデータを展開してクエリを高速化し、ssb-flatの一部クエリで30%のレイテンシ削減を実現できることがわかりました。

## バグ修正

### 1.0からのローリングアップグレードができない問題を修正（重大）

この問題はバージョン1.1で発生し、BEをアップグレードしてもFEをアップグレードしない場合にBEがcoreを起こす可能性がありました。

この問題に遭遇した場合は、[#10833](https://github.com/apache/doris/pull/10833)で修正を試すことができます。

### 一部のクエリが非vectorized engineにフォールバックせず、BEがcoreを起こす問題を修正

現在、vectorized engineはすべてのSQLクエリを処理できず、一部のクエリ（left outer joinなど）は非vectorized engineで実行されます。しかし、1.1ではカバーされていないケースがあり、beクラッシュを引き起こしていました。

### Compactionが正しく動作せず-235エラーを引き起こす問題

uniq key compactionで1つのrowsetに複数セグメントがある場合、セグメントの行はgeneric_iteratorでマージされますが、merged_rowsが増加しませんでした。Compactionはcheck_correctnessで失敗し、バージョンが多すぎるタブレットを作成し、-235ロードエラーを引き起こしていました。

### クエリ実行時のいくつかのsegment faultケース

[#10961](https://github.com/apache/doris/pull/10961) 
[#10954](https://github.com/apache/doris/pull/10954) 
[#10962](https://github.com/apache/doris/pull/10962)

# 謝辞

このリリースに貢献していただいたすべての方々に感謝します：

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
