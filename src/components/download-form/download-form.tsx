import React, { useEffect } from 'react';
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

    const getVersionLinkByKeys = (version, cpu, suffix, type) => {
        const versionNode = versions.find(({ value }) => value === version);
        const cpuNode = versionNode?.children.find(({ value }) => value === cpu);
        const suffixNode = cpuNode?.children.find(({ value }) => value === suffix);
        return suffixNode?.[type] || null;
    };

    useEffect(() => {
        const currentVersion = versions.find(item => form.getFieldValue('version') === item.value).children;
        form.setFieldValue('architecture', [currentVersion[0].value, currentVersion[0].children[0].value]);
    }, [version]);

    return (
        <div className="rounded-lg border border-b-[0.375rem] border-[#0065FD] px-8 pt-[3.125rem] pb-[2.1875rem]">
            <div className="mb-8 text-xl font-medium">Available downloads</div>
            <Form
                form={form}
                onFinish={val => {
                    window.open(
                        getVersionLinkByKeys(val.version, val.architecture[0], val.architecture[1], 'link'),
                        '_blank',
                    );
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
                                isCascader={true}
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
                <div className="flex justify-center">
                    <div
                        className="inline-flex items-center text-[#444FD9] mt-[1.5rem] cursor-pointer"
                        onClick={() => {
                            window.open(
                                getVersionLinkByKeys(version, architecture?.[0], architecture?.[1], 'sourceLink'),
                                '_blank',
                            );
                        }}
                    >
                        Download source code
                        <ExternalLinkArrowIcon />
                    </div>
                </div>
            </Form>
        </div>
    );
}
