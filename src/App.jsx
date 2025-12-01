import { createHashRouter, RouterProvider } from "react-router-dom";
import CardPrinterPage from "./routes/CardPrinterPage";
import LinkMaker from "./routes/MultiPlayerFormatLinkMaker";
import HomePage from "./routes/HomePage";

const router = createHashRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/card-printer",
    element: <CardPrinterPage />,
  },
  {
    path: "/link-maker",
    element: <LinkMaker />,
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
