export const NEWSLETTER_DATA = [
    {
        tags: ['Best Practice'],
        title: "NetEase Games: From Elasticsearch, HBase, and ClickHouse to a Unified Apache Doris Lakehouse",
        content: `NetEase Games consolidated six specialized data systems into Apache Doris across two phases, first unifying real-time analytics, then adding batch processing capabilities to create a lakehouse architecture serving 15 million daily queries.`,
        to: 'https://www.velodb.io/blog/netease-games-from-elasticsearch-and-clickhouse-to-a-unified-apache-doris-lakehouse',
        image: 'blogs/202605_netease_games_horizontal.jpg',
    },
    {
        tags: ['Tech Sharing'],
        title: "From Data Silos to Context Silos: What Database History Teaches Us About the AI Infrastructure Problem",
        content: `The database industry is repeating a historical cycle where specialized systems create fragmentation that demands convergence. As AI agents become primary data consumers, organizations face a new challenge: context silos, where information exists but cannot be retrieved fast enough for autonomous systems to act effectively.`,
        to: 'https://www.velodb.io/blog/from-data-silos-to-context-silos',
        image: 'blogs/202605_context_silo_horizontal.png',
    },
    {
        tags: ['Tech Sharing'],
        title: "Apache Doris 4.1 on Iceberg V3: Running the Full Lakehouse Lifecycle from One SQL Engine",
        content: `Apache Doris 4.1 introduces comprehensive Iceberg V3 support, enabling reads, writes (UPDATE, DELETE, MERGE INTO), DDL operations, table maintenance, and diagnostics entirely through SQL without switching to other tools.`,
        to: 'https://www.velodb.io/blog/apache-doris-4-1-on-iceberg-v3-full-lakehouse-lifecycle',
        image: 'blogs/202605_Iceberg_v3_horizontal.jpg',
    },
    {
        tags: ['Tech Sharing'],
        title: "The Chunking and Embedding Cookbook for Production Context Engineering",
        content: `This guide covers three critical decisions for production RAG systems: chunk shaping, embedding selection, and ANN index scaling, bridging the gap between demo retrieval and real-scale deployments.`,
        to: 'https://www.velodb.io/blog/the-chunking-and-embedding-cookbook-for-production-context-engineering',
        image: 'blogs/20260515_chunking_horizontal.png',
    },
];
