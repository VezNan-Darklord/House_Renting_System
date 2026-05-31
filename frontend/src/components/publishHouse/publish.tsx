import { useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Select, Upload, message } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import Header from "../index/header";
import Sidebar from "../index/sidebar";
import { useCreateHouseMutation, useUploadHouseImagesMutation } from "../../../api/hooks/houseHooks";
import type { DecorationType, HouseRequest, HouseType } from "../../../api";

type PublishFormValues = Omit<HouseRequest, "images">;

const houseTypeOptions: { label: string; value: HouseType }[] = [
    { label: "公寓", value: "apartment" },
    { label: "住宅", value: "residential" },
    { label: "别墅", value: "villa" },
];

const decorationOptions: { label: string; value: DecorationType }[] = [
    { label: "精装", value: "luxury" },
    { label: "简装", value: "simple" },
    { label: "毛坯", value: "rough" },
];

export default function Publish() {
    const [form] = Form.useForm<PublishFormValues>();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [imageMap, setImageMap] = useState<Record<string, string>>({});
    const uploadMutation = useUploadHouseImagesMutation();
    const createHouseMutation = useCreateHouseMutation();
    const navigate = useNavigate();

    const imageUrls = useMemo(
        () =>
            fileList
                .filter((file) => file.status === "done" && imageMap[file.uid])
                .map((file) => imageMap[file.uid]),
        [fileList, imageMap]
    );

    const handleUpload: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
        const uploadFile = file as UploadFile;
        const fileKey =
            uploadFile.uid ??
            (typeof file === "string" ? file : uploadFile.name ?? `${Date.now()}`);
        try {
            const response = await uploadMutation.mutateAsync({ files: [file as Blob] });
            const url = response.data?.urls?.[0];
            if (!url) {
                throw new Error("图片上传失败");
            }
            setImageMap((prev) => ({ ...prev, [fileKey]: url }));
            onSuccess?.(response, file);
        } catch (error) {
            message.error("图片上传失败，请重试");
            onError?.(error as Error);
        }
    };

    const handleRemove = (file: UploadFile) => {
        setImageMap((prev) => {
            const next = { ...prev };
            delete next[file.uid];
            return next;
        });
        return true;
    };

    const handleSubmit = async (values: PublishFormValues) => {
        try {
            await createHouseMutation.mutateAsync({
                ...values,
                facilities: values.facilities ?? [],
                description: values.description ?? "",
                images: imageUrls,
            });
            message.success("房源发布成功");
            form.resetFields();
            setFileList([]);
            setImageMap({});
            navigate("/user");
        } catch {
            message.error("房源发布失败，请检查填写内容");
        }
    };

    return (
        <div className="min-h-screen bg-[#faf7f2] text-slate-900">
            <Header />
            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-25 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-[0.3em] text-orange-500">
                                发布房源
                            </div>
                            <div className="mt-2 text-3xl font-semibold text-slate-900">完善房源信息</div>
                            <div className="mt-2 text-sm text-slate-500">
                                按照真实信息填写房源资料，图片将上传后保存到 /uploads。
                            </div>
                        </div>
                        <Button
                            type="primary"
                            shape="round"
                            className="bg-orange-500! font-semibold! shadow-none!"
                            onClick={() => form.submit()}
                            loading={createHouseMutation.isPending}
                        >
                            提交发布
                        </Button>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]"
                        onFinish={handleSubmit}
                        requiredMark={false}
                    >
                        <section className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                            <div className="text-lg font-semibold text-slate-900">基础信息</div>
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <Form.Item
                                    label="省份"
                                    name="address_province"
                                    rules={[{ required: true, message: "请输入省份" }]}
                                >
                                    <Input placeholder="例如：浙江省" />
                                </Form.Item>
                                <Form.Item
                                    label="城市"
                                    name="address_city"
                                    rules={[{ required: true, message: "请输入城市" }]}
                                >
                                    <Input placeholder="例如：杭州市" />
                                </Form.Item>
                                <Form.Item
                                    label="区/县"
                                    name="address_district"
                                    rules={[{ required: true, message: "请输入区/县" }]}
                                >
                                    <Input placeholder="例如：西湖区" />
                                </Form.Item>
                            </div>
                            <Form.Item
                                label="详细地址"
                                name="address_detail"
                                rules={[{ required: true, message: "请输入详细地址" }]}
                            >
                                <Input placeholder="街道、小区、门牌号" />
                            </Form.Item>

                            <div className="mt-8 text-lg font-semibold text-slate-900">房屋配置</div>
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Form.Item
                                    label="房屋类型"
                                    name="house_type"
                                    rules={[{ required: true, message: "请选择房屋类型" }]}
                                >
                                    <Select options={houseTypeOptions} placeholder="请选择" />
                                </Form.Item>
                                <Form.Item
                                    label="户型"
                                    name="layout"
                                    rules={[{ required: true, message: "请输入户型" }]}
                                >
                                    <Input placeholder="例如：2室1厅1卫" />
                                </Form.Item>
                                <Form.Item
                                    label="面积（㎡）"
                                    name="area"
                                    rules={[{ required: true, message: "请输入面积" }]}
                                >
                                    <InputNumber className="w-full" min={1} placeholder="例如：89" />
                                </Form.Item>
                                <Form.Item
                                    label="月租（元）"
                                    name="monthly_rent"
                                    rules={[{ required: true, message: "请输入月租" }]}
                                >
                                    <InputNumber className="w-full" min={1} placeholder="例如：3500" />
                                </Form.Item>
                                <Form.Item
                                    label="押金（元）"
                                    name="deposit"
                                    rules={[{ required: true, message: "请输入押金" }]}
                                >
                                    <InputNumber className="w-full" min={0} placeholder="例如：3500" />
                                </Form.Item>
                                <Form.Item
                                    label="装修情况"
                                    name="decoration"
                                    rules={[{ required: true, message: "请选择装修情况" }]}
                                >
                                    <Select options={decorationOptions} placeholder="请选择" />
                                </Form.Item>
                            </div>

                            <Form.Item label="配套设施" name="facilities">
                                <Select
                                    mode="tags"
                                    tokenSeparators={[",", "，"]}
                                    placeholder="输入设施，如：空调、热水器、冰箱"
                                />
                            </Form.Item>
                            <Form.Item label="房源描述" name="description">
                                <Input.TextArea
                                    placeholder="补充房源亮点、周边配套等"
                                    autoSize={{ minRows: 4, maxRows: 6 }}
                                />
                            </Form.Item>
                        </section>

                        <section className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                            <div className="flex items-center justify-between">
                                <div className="text-lg font-semibold text-slate-900">房源图片</div>
                                <div className="text-xs text-slate-400">最多上传 8 张</div>
                            </div>
                            <div className="mt-4">
                                <Upload.Dragger
                                    name="files"
                                    multiple
                                    accept="image/*"
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
                                    customRequest={handleUpload}
                                    onRemove={handleRemove}
                                    maxCount={8}
                                >
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <InboxOutlined className="text-2xl text-orange-400" />
                                        <div className="mt-2 text-sm font-medium">上传图片</div>
                                        <div className="mt-1 text-xs">支持 JPG / PNG，建议横图 16:9</div>
                                    </div>
                                </Upload.Dragger>
                            </div>
                            <div className="mt-4 text-xs text-slate-400">
                                图片上传后会返回 /uploads 路径，并随房源信息一起提交。
                            </div>
                        </section>
                    </Form>
                </div>
            </main>
            <Sidebar />
        </div>
    );
}
