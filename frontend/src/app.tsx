import { createBrowserRouter, RouterProvider } from "react-router"
import Index from "./components/index"
import UserCard from "./components/personal/userCard"
import ChatRoom from "./components/chat/chatRoom"
export default function App() {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <Index />,
            children: []
        },
        {
            path: '/user',
            element: <UserCard />,
            children: []
        },
        {
            path: '/chat',
            element: <ChatRoom />,
            children: []
        },
        {
            path: '/chat/:id',
            element: <ChatRoom />,
            children: []
        }
    ])

    return (
        <div>
            <RouterProvider router={router} />        
        </div>
    )
}
