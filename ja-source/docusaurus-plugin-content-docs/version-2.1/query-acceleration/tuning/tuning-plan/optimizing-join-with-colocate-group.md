---
{
  "title": "Colocate Groupを使用したJoinの最適化",
  "language": "ja",
  "description": "colocateグループを定義することは、効率的なJoinの方法です。"
}
---
colocate groupの定義はJoinの効率的な方法です。これにより実行エンジンは、通常Join操作に関連するデータ転送オーバーヘッドを効果的に回避できます（Colocate Groupの紹介については、[Colocation Join](../../colocation-join.md)を参照してください）

ただし、一部のユースケースでは、Colocate Groupが正常に確立されていても、実行計画がShuffle Joinやバケット Shuffle Joinとして表示される場合があります。この状況は通常、Dorisがデータを整理している際に発生します。例えば、複数のBE間でより均衡の取れたデータ分散を確保するために、BE間でtabletを移行している可能性があります。

`SHOW PROC "/colocation_group";`コマンドを使用してColocate Groupのステータスを確認できます。以下の図に示すように、`IsStable`が`false`の場合、利用できないColocate Groupインスタンスがあることを示しています。

![Optimizing Join with Colocate Group](/images/use-colocate-group.jpg)
