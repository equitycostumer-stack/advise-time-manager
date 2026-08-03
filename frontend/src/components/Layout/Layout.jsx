import Sidebar from "./Sidebar";
import Header from "./Header";
import "./layout.css";

export default function Layout({ children }) {
    return (
        <div className="layout">

            <Sidebar />

            <div className="layout-content">

                <Header />

                <main className="page-content">
                    {children}
                </main>

            </div>

        </div>
    );
}