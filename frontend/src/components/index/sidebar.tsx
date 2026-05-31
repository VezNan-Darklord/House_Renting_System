import { UserOutlined, BellOutlined, StarOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useNavigate } from "react-router";

export default function Sidebar() {
    const navigate = useNavigate();
    const sidbarItems = [
        { icon: <UserOutlined />, label: '我的', onClick: () => navigate('/user') },
        { icon: <BellOutlined />, label: '消息', onClick: () => navigate('/chat') },
        { icon: <StarOutlined />, label: '推荐' },
        { icon: <AppstoreOutlined />, label: '分类' },
    ];

    return (
        <aside className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
            <div className="flex w-20 flex-col items-center gap-2 rounded-[28px] border border-slate-200 bg-white/95 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                    {sidbarItems.map((item) => (
                        <Button
                            key={item.label}
                            type="text"
                            className="flex h-16! w-full flex-col items-center justify-center gap-1 rounded-[18px] px-0! text-slate-600 shadow-none hover:bg-orange-50! hover:text-orange-500!"
                            onClick={item.onClick}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </Button>
                    ))}
            </div>
        </aside>
    )    
}
