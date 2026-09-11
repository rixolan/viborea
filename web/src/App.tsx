import { Navigate, createBrowserRouter, RouterProvider, useParams } from "react-router-dom";
import { Shell } from "./shell";
import {
  Academia,
  AcademiaAjustes,
  AcademiaNueva,
  AcademiaProfes,
  AcademiaSesion,
  Entrar,
  EntrarAcademia,
  EntrarJugador,
  EntrarJugadorIndex,
  Landing,
  Registro,
  RegistroJugador,
  Reservar,
  ReservarClases,
  ReservarIndex,
  ReservarSesion,
  ReservarTurno,
} from "./pages";

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
      { path: "/entrar/academia", element: <EntrarAcademia /> },
      { path: "/entrar/jugador", element: <EntrarJugadorIndex /> },
      { path: "/entrar/jugador/:slug", element: <EntrarJugador /> },
      { path: "/entrar/jugador/:slug/registro", element: <RegistroJugador /> },
      { path: "/registro", element: <Registro /> },
      { path: "/reservar", element: <ReservarIndex /> },
      { path: "/reservar/:slug", element: <Reservar /> },
      { path: "/reservar/:slug/clases", element: <ReservarClases /> },
      { path: "/reservar/:slug/turno/:token", element: <ReservarTurno /> },
      { path: "/reservar/:slug/:sessionId", element: <ReservarSesion /> },
      { path: "/jugador", element: <Navigate to="/entrar/jugador" replace /> },
      { path: "/academia", element: <Academia /> },
      { path: "/academia/nueva", element: <AcademiaNueva /> },
      { path: "/academia/profes", element: <AcademiaProfes /> },
      { path: "/academia/ajustes", element: <AcademiaAjustes /> },
      { path: "/academia/sesion/:id", element: <AcademiaSesion /> },
      { path: "/ajustes", element: <Navigate to="/academia/ajustes" replace /> },
      { path: "/cliente", element: <Navigate to="/" replace /> },
      { path: "/admin", element: <Navigate to="/academia" replace /> },
      { path: "/admin/sesion/:id", element: <RedirectAcademiaSesion /> },
      { path: "/profe", element: <Navigate to="/academia" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
