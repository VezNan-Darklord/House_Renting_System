import { createBrowserRouter, RouterProvider } from "react-router"
import Index from "./components/index"
import UserCard from "./components/personal/userCard"
import ChatRoom from "./components/chat/chatRoom"
import Publish from "./components/publishHouse/publish"
import AuthGuard from "./components/common/AuthGuard"
import HouseDetail from "./components/houseDetail/houseDetail"
export default function App() {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <Index />,
            children: []
        },
        {
            path: '/user',
            element: (
                <AuthGuard>
                    <UserCard />
                </AuthGuard>
            ),
            children: []
        },
        {
            path: '/chat',
            element: (
                <AuthGuard>
                    <ChatRoom />
                </AuthGuard>
            ),
            children: []
        },
        {
            path: '/chat/:id',
            element: (
                <AuthGuard>
                    <ChatRoom />
                </AuthGuard>
            ),
            children: []
        },
        {
            path: '/house/publish',
            element: (
                <AuthGuard>
                    <Publish />
                </AuthGuard>
            ),
            children: []
        },
        {
            path: '/house/:id',
            element: (
                <HouseDetail />
            ),
            children: []
        }
    ])

    return (
        <div>
            <RouterProvider router={router} />        
        </div>
    )
}
