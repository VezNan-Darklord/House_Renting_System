import { createBrowserRouter, RouterProvider } from "react-router"
import Index from "./components/index"
import Header from "./components/index/header"
import Sidebar from "./components/index/sidebar"
export default function App() {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <Index />,
            children: []
        }
    ])

    return (
        <div>
            <Header />
            <RouterProvider router={router} />    
            <Sidebar />
        </div>
    )
}