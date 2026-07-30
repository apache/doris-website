import React from 'react';
import Layout from '@theme/Layout';

interface CourseItem {
    title: string;
    description: string;
    filename: string;
}

const courses: CourseItem[] = [
    {
        title: 'Apache Doris Overview',
        description:
            'An introduction to Apache Doris — a real-time analytical database. Learn about its architecture, core features, use cases, and ecosystem positioning.',
        filename: '01-apache-doris-overview.html',
    },
    {
        title: 'Installation Guide',
        description:
            'Step-by-step deployment instructions covering four different paths: manual deployment, Docker, Docker Compose, and Kubernetes for production and dev environments.',
        filename: '02-apache-doris-installation-guide.html',
    },
    {
        title: 'Table Guide',
        description:
            'Design and manage tables in Apache Doris. Covers data models, partitioning, bucketing, indexes, and best practices for schema design in different scenarios.',
        filename: '03-apache-doris-table-guide.html',
    },
    {
        title: 'Data Operations Guide',
        description:
            'Learn how to load, transform, update, and export data in Apache Doris. Covers Batch Load, Stream Load, Routine Load, along with updates and data export.',
        filename: '04-apache-doris-data-operations-guide.html',
    },
    {
        title: 'Query Data Guide',
        description:
            'Master querying in Apache Doris — from basic SQL to advanced analytics, covering joins, aggregations, subqueries, window functions, and performance tuning.',
        filename: '05-apache-doris-query-data-guide.html',
    },
    {
        title: 'Lakehouse Guide',
        description:
            'Explore Apache Doris Lakehouse capabilities: multi-catalog integration (Hive, Iceberg, Hudi, Paimon), query federation, and data sharing across systems.',
        filename: '06-apache-doris-lakehouse-guide.html',
    },
];

const numbers = ['01', '02', '03', '04', '05', '06'];

export default function Course(): JSX.Element {
    return (
        <Layout
            title="Apache Doris 101 Course"
            description="Free Apache Doris 101 course — learn Doris from zero with hands-on guides covering overview, installation, tables, data operations, queries, and Lakehouse."
        >
            <section className="max-w-[72rem] mx-auto px-6 pt-24 pb-32">
                {/* Banner */}
                <div className="text-center mb-16">
                    <span className="inline-block text-xs font-semibold tracking-[0.15em] uppercase text-orange-500 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 mb-6">
                        Free Course
                    </span>
                    <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1d] mb-4">
                        Apache Doris 101
                    </h1>
                    <p className="text-lg text-[#4C576C] max-w-[42rem] mx-auto leading-relaxed">
                        A free, beginner-friendly course covering everything you need to get started with
                        Apache Doris — from core concepts to production-ready operations.
                    </p>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, index) => (
                        <a
                            key={course.filename}
                            href={`/course/101/${course.filename}`}
                            className="group block !no-underline rounded-xl border border-[#e5e7eb] bg-white p-6 transition-all duration-200 hover:border-[#3b82f6] hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm mb-4">
                                {numbers[index]}
                            </span>
                            <h3 className="text-lg font-semibold text-[#1d1d1d] mb-2 group-hover:text-blue-600 transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-sm text-[#6b7280] leading-relaxed">
                                {course.description}
                            </p>
                            <span className="inline-flex items-center text-sm font-medium text-blue-600 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                Start Learning →
                            </span>
                        </a>
                    ))}
                </div>
            </section>
        </Layout>
    );
}
