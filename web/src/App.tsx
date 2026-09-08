import { Navigate, createBrowserRouter, RouterProvider, useParams } from "react-router-dom";
import { Shell } from "./shell";
import { Academia, AcademiaSesion, Entrar, Jugador, Landing, Reservar, ReservarSesion } from "./pages";

function RedirectAcademiaSesion() {
  const { id } = useParams();
  return <Navigate to={`/academia/sesion/${id}`} replace />;
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/entrar", element: <Entrar /> },
      { path: "/reservar", element: <Reservar /> },
      { path: "/reservar/:id", element: <ReservarSesion /> },
      { path: "/jugador", element: <Jugador /> },
      { path: "/academia", element: <Academia /> },
      { path: "/academia/sesion/:id", element: <AcademiaSesion /> },
      { path: "/cliente", element: <Navigate to="/jugador" replace /> },
      { path: "/admin", element: <Navigate to="/academia" replace /> },
      { path: "/admin/sesion/:id", element: <RedirectAcademiaSesion /> },
      { path: "/profe", element: <Navigate to="/academia" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
