import { Skeleton, Empty, Tag, Divider } from "antd";
import { useContractDetailQuery } from "../../../api/hooks/contractHooks";
import PopWindow from "../common/PopWindow";
import { STATUS_COLOR_MAP, formatDate, formatDateTime } from "./contractSign";

type ContractDetailModalProps = {
    contractId: number | null;
    onClose: () => void;
};

type DetailItemProps = {
    label: string;
    children: React.ReactNode;
};

function DetailItem({ label, children }: DetailItemProps) {
    return (
        <div>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-1 font-medium text-slate-800">{children}</div>
        </div>
    );
}

export default function ContractDetailModal({ contractId, onClose }: ContractDetailModalProps) {
    const detailQuery = useContractDetailQuery(contractId ?? undefined, contractId !== null);
    const contract = detailQuery.data?.data;

    return (
        <PopWindow open={contractId !== null} title="合同详情" onClose={onClose}>
            {detailQuery.isLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : !contract ? (
                <Empty description="未找到合同信息" />
            ) : (
                <div className="space-y-4 text-sm text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-base font-semibold text-slate-900">
                            {contract.house_address ?? "房源信息"}
                        </div>
                        {contract.status ? (
                            <Tag color={STATUS_COLOR_MAP[contract.status]}>
                                {contract.status_label ?? contract.status}
                            </Tag>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <DetailItem label="租客">{contract.tenant_nickname ?? "--"}</DetailItem>
                        <DetailItem label="房东">{contract.landlord_nickname ?? "--"}</DetailItem>
                        <DetailItem label="联系方式（租客）">{contract.tenant_phone || "--"}</DetailItem>
                        <DetailItem label="联系方式（房东）">{contract.landlord_phone || "--"}</DetailItem>
                        <DetailItem label="户型 / 面积">
                            {contract.house_layout ?? "--"} · {contract.house_area ?? "--"}㎡
                        </DetailItem>
                        <DetailItem label="月租 / 押金">
                            ¥{contract.monthly_rent ?? "--"} / ¥{contract.deposit ?? "--"}
                        </DetailItem>
                        <DetailItem label="租期">
                            {formatDate(contract.start_date)} ~ {formatDate(contract.end_date)}
                        </DetailItem>
                        <DetailItem label="创建时间">
                            {formatDateTime(contract.created_at)}
                        </DetailItem>
                    </div>
                    <Divider className="my-3! border-slate-200!" />
                    <div>
                        <div className="mb-2 text-sm font-semibold text-slate-900">合同条款</div>
                        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                            {contract.terms || "暂无合同条款"}
                        </pre>
                    </div>
                </div>
            )}
        </PopWindow>
    );
}