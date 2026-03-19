---
{
  "title": "リリース 1.1.1",
  "language": "ja",
  "description": "この機能は非ベクトル化エンジンでは有効になっていますが、1.1のベクトル化エンジンでは欠落していました。そのため、1.1.1でこの機能を追加し直します。"
}
---
## 機能

### Vectorized EngineでのODBC Sinkサポート

この機能は非vectorized engineでは有効になっていましたが、1.1のvectorized engineでは欠けていました。そのため、1.1.1でこの機能を追加し直しました。

### Vectorized Engine用のシンプルなMemtracker

1.1では、vectorized engine用のBEにmemtrackerがなかったため、メモリが制御不能になりOOMを引き起こしていました。1.1.1では、シンプルなmemtrackerをBEに追加し、メモリを制御してメモリが上限を超えた際にクエリをキャンセルできるようになりました。

## 改善

### page cacheでの圧縮解除されたデータのキャッシュ

一部のデータはbitshuffleを使用して圧縮されており、クエリ中に解凍するのに多くの時間がかかります。1.1.1では、dorisはbitshuffleでエンコードされたデータを解凍してクエリを高速化し、ssb-flatでの一部のクエリで30%のレイテンシ削減ができることを確認しました。

## バグ修正

### 1.0からのローリングアップグレードができない問題の修正（重要）

この問題はバージョン1.1で発生したもので、BEをアップグレードしてもFEをアップグレードしない場合にBE coreを引き起こす可能性があります。

この問題が発生した場合は、[#10833](https://github.com/apache/doris/pull/10833)で修正を試すことができます。

### 一部のクエリが非vectorized engineにフォールバックせず、BEがcoreする問題の修正

現在、vectorized engineはすべてのSQLクエリを処理することができず、一部のクエリ（left outer joinなど）は非vectorized engineを使用して実行されます。しかし、1.1では対象とならないケースがいくつかありました。そしてそれがbeクラッシュを引き起こします。

### Compactionが正しく動作せず-235エラーを引き起こす問題

uniq key compactionでの1つのrowsetの複数セグメントにおいて、セグメント行はgeneric_iteratorでマージされますが、merged_rowsが増加しません。Compactionはcheck_correctnessで失敗し、バージョンが多すぎるタブレットを作成し、-235ロードエラーにつながります。

### クエリ中のいくつかのセグメント障害ケース

[#10961](https://github.com/apache/doris/pull/10961) 
[#10954](https://github.com/apache/doris/pull/10954) 
[#10962](https://github.com/apache/doris/pull/10962)

# 謝辞

このリリースに貢献してくださったすべての方々に感謝いたします：

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
