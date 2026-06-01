import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useUserContext } from "../userContext";
import { message } from "antd";
import { useProfileQuery } from "../../../api/hooks/userHooks";

type AuthGuardProps = {
    children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
    const { isLoggedIn } = useUserContext();
    const userInfo = useProfileQuery(isLoggedIn);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/");
            message.warning("请先登录");
            return;
        }
        else {
            if (location.pathname === "/user") {
                // 若为管理员，跳转到管理员管理页面
                if (userInfo.data?.data?.role === "admin") {
                    navigate("/admin");
                }
            }
        }
    }, [isLoggedIn, location.key, location.pathname, navigate, userInfo.data?.data?.role]);

    return (
        <>
            {children}
        </>
    );
}
