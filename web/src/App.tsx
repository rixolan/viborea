import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Shell } from "./shell";
import { Admin, AdminSesion, Cliente, Entrar, Landing, Profe, Reservar, ReservarSesion } from "./pages";

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/entrar", element: <Entrar /> },
      { path: "/reservar", element: <Reservar /> },
      { path: "/reservar/:id", element: <ReservarSesion /> },
      { path: "/cliente", element: <Cliente /> },
      { path: "/profe", element: <Profe /> },
      { path: "/admin", element: <Admin /> },
      { path: "/admin/sesion/:id", element: <AdminSesion /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
