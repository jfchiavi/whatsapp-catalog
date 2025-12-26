import { createBrowserRouter } from "react-router-dom";
import Home from "./routes/Home";
import ProductDetail from "./routes/ProductDetail";
import SearchResults from "./routes/SearchResults";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/product/:id", element: <ProductDetail /> },
  { path: "/search", element: <SearchResults /> },
]);
