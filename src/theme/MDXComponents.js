// 导入原映射
import MDXComponents from '@theme-original/MDXComponents';
import VersionsDoc from '@site/src/components/VersionsDoc';
import { TagChips } from '@site/src/components/key-features/TagChips';
import { RelatedConcepts } from '@site/src/components/key-features/RelatedConcepts';

export default {
    // 复用默认的映射
    ...MDXComponents,
    version: VersionsDoc,
    TagChips,
    RelatedConcepts,
};
