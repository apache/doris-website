---
{
  "title": "Colocate Groupを使用したJoinの最適化",
  "description": "colocate groupを定義することは、Joinの効率的な方法です。",
  "language": "ja"
}
---
colocate groupの定義は、効率的なJoinの方法です。これにより、実行エンジンは通常Join操作に伴うデータ転送のオーバーヘッドを効果的に回避できます（Colocate Groupの紹介については、[Colocation Join](../../colocation-join.md)を参照してください）

ただし、一部のユースケースでは、Colocate Groupが正常に確立されていても、実行プランがShuffle Joinまたはバケット Shuffle Joinとして表示される場合があります。この状況は通常、Dorisがデータを整理しているときに発生します。例えば、複数のBE間でより均衡の取れたデータ分散を確保するために、BE間でタブレットを移行している可能性があります。

コマンド`SHOW PROC "/colocation_group";`を使用してColocate Groupの状態を確認できます。下図に示すように、`IsStable`が`false`の場合、利用できないColocate Groupインスタンスが存在することを示しています。

![Optimizing Join with Colocate Group](/images/use-colocate-group.jpg)
