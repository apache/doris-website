import React, { useEffect, useState } from 'react';
import { Form } from 'antd';
import { Option } from '@site/src/constant/download.data';
import FormSelect from '../form-select/form-select';
import { useForm, useWatch } from 'antd/es/form/Form';
import { ExternalLinkArrowIcon } from '../Icons/external-link-arrow-icon';

interface DownloadFormProps {
    versions: Option[];
}
export default function DownloadForm(props: DownloadFormProps) {
    const { versions } = props;
    const [form] = useForm();
    const version = useWatch('version', form);
    const architecture = useWatch('architecture', form);

    const getOptions = (version: string) => {
        const options = versions.find(item => item.value === version);
        return options.children;
    };

    const getVersionLinkByKeys = (version, cpu, type) => {
        const versionNode = versions.find(item => item.value === version);
        const node = versionNode.children.find(item => item.value === cpu);
        return node?.[type] || null;
    };

    useEffect(() => {
        const currentVersion = versions.find(item => form.getFieldValue('version') === item.value).children;
        form.setFieldValue('architecture', currentVersion[0].value);
    }, [version]);

    return (
        <div className="rounded-lg border border-b-[0.375rem] border-[#0065FD] px-8 pt-[3.125rem] pb-[2.1875rem]">
            <div className="mb-8 text-xl font-medium">Available downloads</div>
            <Form
                form={form}
                onFinish={val => {
                    window.open(getVersionLinkByKeys(val.version, val.architecture, 'gz'), '_blank');
                    return;
                }}
                initialValues={{
                    version: versions[0].value,
                }}
            >
                <Form.Item name="version" rules={[{ required: true }]}>
                    <FormSelect placeholder="Version" label="version" isCascader={false} options={versions} />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => (
                        <Form.Item name="architecture" rules={[{ required: true }]}>
                            <FormSelect
                                placeholder="Architecture"
                                label="Architecture"
                                isCascader={false}
                                options={getOptions(getFieldValue('version'))}
                            />
                        </Form.Item>
                    )}
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }} colon={false}>
                    <button type="submit" className="button-primary w-full text-lg">
                        Download
                    </button>
                </Form.Item>
                <div className="flex justify-center mt-[1.5rem]">
                    <div
                        className="inline-flex items-center text-[#444FD9] cursor-pointer hover:underline"
                        onClick={() => {
                            window.open(getVersionLinkByKeys(version, architecture, 'asc'), '_blank');
                        }}
                    >
                        asc
                    </div>
                    <div
                        className="inline-flex items-center ml-2 text-[#444FD9] cursor-pointer hover:underline"
                        onClick={() => {
                            window.open(getVersionLinkByKeys(version, architecture, 'sha512'), '_blank');
                        }}
                    >
                        sha512
                    </div>
                    <div
                        className="inline-flex items-center ml-2 text-[#444FD9] cursor-pointer hover:underline"
                        onClick={() => {
                            window.open(getVersionLinkByKeys(version, architecture, 'source'), '_blank');
                        }}
                    >
                        source code
                        <ExternalLinkArrowIcon className="ml-1" />
                    </div>
                </div>
            </Form>
        </div>
    );
}
