import { createBrowserRouter, RouterProvider } from "react-router"
import Index from "./components"
import Header from "./components/header"
import Sidebar from "./components/sidebar"
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