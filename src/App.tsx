import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/lab/Layout";
import Overview from "./pages/Overview";
import Labs from "./pages/Labs";
import Devices from "./pages/Devices";
import Occupancy from "./pages/Occupancy";
import Automations from "./pages/Automations";
import Safety from "./pages/Safety";
import AI from "./pages/AI";
import Analytics from "./pages/Analytics";
import Logs from "./pages/Logs";
import Addons from "./pages/Addons";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/occupancy" element={<Occupancy />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/ai" element={<AI />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/addons" element={<Addons />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
