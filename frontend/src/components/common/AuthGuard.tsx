import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useUserContext } from "../userContext";
import { message } from "antd";

type AuthGuardProps = {
    children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
    const { isLoggedIn } = useUserContext();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/");
            message.warning("请先登录");
            return;
        }
    }, [isLoggedIn, location.key, navigate]);

    return (
        <>
            {children}
        </>
    );
}
