---
{
  "title": "リリース 1.1.1",
  "language": "ja",
  "description": "この機能は非ベクトル化エンジンでは有効になっていますが、1.1のベクトル化エンジンでは欠落しています。そのため、1.1.1でこの機能を再追加します。"
}
---
## 機能

### Vectorized EngineにおけるODBC Sinkのサポート

この機能は非vectorized engineでは有効になっていましたが、1.1のvectorized engineでは欠落していました。そのため、1.1.1でこの機能を追加し直しました。

### Vectorized Engine用のシンプルなMemtracker

1.1では、vectorized engine用のBEにmemtrackerがなかったため、メモリが制御不能になりOOMを引き起こしていました。1.1.1では、シンプルなmemtrackerをBEに追加し、メモリを制御してメモリが超過した際にクエリをキャンセルできるようになりました。

## 改善

### page cacheでの解凍済みデータのキャッシュ

一部のデータはbitshuffleを使用して圧縮されており、クエリ実行時の解凍に多くの時間を要していました。1.1.1では、dorisはbitshuffleでエンコードされたデータを解凍してクエリを高速化し、ssb-flatの一部のクエリで30%のレイテンシ削減を実現できることを確認しました。

## バグ修正

### 1.0からのローリングアップグレードができない問題の修正（重大）

この問題はバージョン1.1で導入され、BEをアップグレードしてもFEをアップグレードしない場合にBEのコアダンプを引き起こす可能性があります。

この問題に遭遇した場合は、[#10833](https://github.com/apache/doris/pull/10833)で修正を試すことができます。

### 一部のクエリが非vectorized engineにフォールバックせず、BEがコアダンプする問題の修正

現在、vectorized engineはすべてのSQLクエリを処理できるわけではなく、一部のクエリ（left outer joinなど）は非vectorized engineで実行されます。しかし、1.1では対応されていないケースがいくつかありました。そしてそれがBEクラッシュを引き起こしていました。

### Compactionが正しく動作せず-235エラーを引き起こす問題

uniq key compactionにおける1つのrowsetの複数セグメントで、セグメント行がgeneric_iteratorでマージされるものの、merged_rowsが増加しませんでした。Compactionはcheck_correctnessで失敗し、バージョンが多すぎるタブレットを作成して-235ロードエラーを引き起こしていました。

### クエリ実行中のセグメンテーション違反のいくつかのケース

[#10961](https://github.com/apache/doris/pull/10961) 
[#10954](https://github.com/apache/doris/pull/10954) 
[#10962](https://github.com/apache/doris/pull/10962)

# 謝辞

このリリースに貢献してくださったすべての方に感謝いたします：

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
