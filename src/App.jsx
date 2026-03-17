import React, { useState, useMemo, useEffect, useDeferredValue } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Upload,
  Search,
  Database,
  CheckSquare,
  Square,
  Package,
  Hash,
  Menu,
  X,
  Settings2,
  Calculator, // <--- Faltaba este nombre aquí
} from "lucide-react";
import {
  parseArgentineValue,
  calculatePublicPrice,
} from "./logic/priceCalculator";

function App() {
  const [wb, setWb] = useState(null);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [activeSheets, setActiveSheets] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const deferredSearch = useDeferredValue(searchTerm);

  const [settings, setSettings] = useState({
    descuento: 25,
    utilidad: 30,
    iva: true,
    iibb: true,
  });

  const handleInput = (key, val) =>
    setSettings((p) => ({ ...p, [key]: parseFloat(val) || 0 }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetNames = workbook.SheetNames.filter(
        (name) => !name.toUpperCase().includes("INDICE"),
      );

      setWb(workbook);
      setAvailableSheets(sheetNames);
      setActiveSheets(sheetNames);
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!wb || activeSheets.length === 0) {
      setAllProducts([]);
      return;
    }

    let masterList = [];
    activeSheets.forEach((sheetName) => {
      const worksheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      rows.forEach((row) => {
        const firstCell = row[0]?.toString().trim();
        if (
          firstCell &&
          firstCell.length >= 2 &&
          !firstCell.includes("LISTA")
        ) {
          let foundPrice = 0;
          for (let i = row.length - 1; i >= 2; i--) {
            const val = parseArgentineValue(row[i]);
            if (val > 0) {
              foundPrice = val;
              break;
            }
          }
          masterList.push({
            id: firstCell,
            brand: sheetName,
            name: row[1] || "Sin descripción",
            cost: foundPrice,
          });
        }
      });
    });
    setAllProducts(masterList);
  }, [wb, activeSheets]);

  const toggleSheet = (name) => {
    setActiveSheets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(deferredSearch.toLowerCase()),
    );
  }, [allProducts, deferredSearch]);

  const handleExport = () => {
    const exportData = allProducts.map((p) => ({
      MARCA: p.brand,
      CODIGO: p.id,
      PRODUCTO: p.name,
      "COSTO EXCEL": p.cost.toFixed(2),
      "PVP VENTA": calculatePublicPrice(p.cost, settings).toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wbOut = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbOut, ws, "Lista Precios PVP");
    XLSX.writeFile(wbOut, `S10_Actualizado.xlsx`);
  };

  return (
    // CONTENEDOR MAESTRO: h-screen y overflow-hidden es clave para "trapar" el scroll adentro
    <div className="h-screen w-screen bg-[#020617] text-slate-200 font-sans overflow-hidden flex flex-col md:flex-row">
      {/* PANEL IZQUIERDO: h-full y su propio scroll */}
      <aside className="w-full md:w-80 lg:w-96 bg-[#0f172a] border-r border-slate-800 flex flex-col h-full shadow-2xl z-30">
        <header className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/40">
              <Database className="text-white" size={18} />
            </div>
            <h1 className="font-black text-[11px] uppercase tracking-widest text-white leading-none">
              Ferreteria LG
            </h1>
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
            Automatización de Costos
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Ajustes Numéricos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-inner">
              <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-wider text-center">
                Utilidad %
              </label>
              <input
                type="number"
                value={settings.utilidad}
                onChange={(e) => handleInput("utilidad", e.target.value)}
                className="w-full bg-transparent text-blue-400 font-black text-2xl outline-none text-center"
              />
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-inner">
              <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-wider text-center">
                Descuento %
              </label>
              <input
                type="number"
                value={settings.descuento}
                onChange={(e) => handleInput("descuento", e.target.value)}
                className="w-full bg-transparent text-emerald-400 font-black text-2xl outline-none text-center"
              />
            </div>
          </div>

          {/* Taxes */}
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-blue-600 transition group">
              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-300">
                Sumar IVA (21%)
              </span>
              <input
                type="checkbox"
                checked={settings.iva}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, iva: e.target.checked }))
                }
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-blue-600 transition group">
              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-300">
                Sumar IIBB (5%)
              </span>
              <input
                type="checkbox"
                checked={settings.iibb}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, iibb: e.target.checked }))
                }
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </label>
          </div>

          {/* Marcas/Pestañas */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
              Marcas Detectadas:
            </h3>
            <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-3 space-y-1 shadow-inner border-t-2">
              {availableSheets.length > 0 ? (
                availableSheets.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleSheet(name)}
                    className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-tight ${activeSheets.includes(name) ? "bg-blue-600 text-white shadow-lg" : "text-slate-700 hover:text-slate-400"}`}
                  >
                    {activeSheets.includes(name) ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                    {name}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-[10px] text-slate-700 italic">
                  No hay archivo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción inferiores en Aside */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
          <label className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-900 font-black py-4 rounded-3xl cursor-pointer hover:bg-white transition text-[11px] shadow-lg shadow-white/5 active:scale-95">
            <Upload size={18} /> {wb ? "CAMBIAR LISTA" : "CARGAR EXCEL"}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
            />
          </label>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-black py-4 rounded-3xl hover:bg-emerald-500 transition text-[11px] shadow-2xl shadow-emerald-900/20 disabled:opacity-20"
            disabled={allProducts.length === 0}
          >
            <Download size={18} /> EXPORTAR XLSX
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO: Flex col + overflow-hidden */}
      <main className="flex-1 flex flex-col h-full bg-[#020617] overflow-hidden min-w-0">
        {/* BUSCADOR: Altura fija */}
        <div className="shrink-0 p-6 border-b border-slate-800/80 bg-[#020617]/95 backdrop-blur-md z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 flex items-center gap-4 bg-slate-950 px-6 py-4 rounded-[2rem] border border-slate-800/50 group focus-within:border-blue-900 transition-all shadow-2xl shadow-black/40">
            <Search
              className="text-slate-700 group-focus-within:text-blue-500"
              size={20}
            />
            <input
              className="bg-transparent border-none outline-none w-full text-xs font-white text-slate-100 placeholder:text-slate-800 uppercase tracking-widest"
              placeholder="FILTRAR STOCK POR NOMBRE O CÓDIGO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-8 items-center border-l border-slate-800 pl-8">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-700 uppercase leading-none">
                Unidades Stock
              </p>
              <span className="text-sm font-black text-blue-500 tracking-tighter">
                {allProducts.length.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-700 uppercase leading-none">
                Vistas
              </p>
              <span className="text-sm font-black text-emerald-500 tracking-tighter">
                {filteredProducts.length.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* LA TABLA: Esta es la parte que debe hacer scroll (flex-1 y overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 lg:p-6 min-h-0 bg-[#020617]">
          {filteredProducts.length > 0 ? (
            <div className="rounded-[2.5rem] border border-slate-800 overflow-hidden bg-[#0f172a]/20 backdrop-blur-sm shadow-2xl">
              <table className="w-full text-left border-collapse border-separate border-spacing-0">
                <thead className="sticky top-0 z-30 bg-[#0f172a]">
                  <tr className="bg-[#0f172a] text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 border-b border-slate-800/50">
                    <th className="px-8 py-6 text-left border-b border-slate-800 whitespace-nowrap">
                      <Hash size={12} className="inline mr-2 opacity-30" /> Ref
                    </th>
                    <th className="px-8 py-6 text-left border-b border-slate-800">
                      <Package size={12} className="inline mr-2 opacity-30" />{" "}
                      Producto Seleccionado
                    </th>
                    <th className="px-8 py-6 text-right border-b border-slate-800 font-medium">
                      Lista ($)
                    </th>
                    <th className="px-8 py-6 text-right border-b border-slate-800 bg-blue-600/[0.04] text-blue-500 font-bold tracking-tighter">
                      Precio de Venta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[11px] font-medium leading-tight">
                  {filteredProducts.map((p, idx) => {
                    const pvp = calculatePublicPrice(p.cost, settings);
                    return (
                      <tr
                        key={idx}
                        className="group hover:bg-white/[0.015] transition-all duration-75"
                      >
                        <td className="px-8 py-4 whitespace-nowrap align-top">
                          <div className="font-black text-white text-[12px] group-hover:text-blue-500 transition-colors">
                            {p.id}
                          </div>
                          <div className="text-[8px] bg-slate-900 px-2 py-0.5 rounded-full inline-block mt-1 font-black opacity-40 uppercase tracking-widest text-slate-400 group-hover:opacity-80 group-hover:bg-blue-900 group-hover:text-blue-200 transition-all">
                            {p.brand}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="text-slate-400 font-bold uppercase tracking-tight group-hover:text-white transition-colors duration-200 leading-normal max-w-xl">
                            {p.name}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right font-mono text-[11px] text-slate-600 align-top pt-5">
                          ${" "}
                          {p.cost.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-8 py-4 text-right align-middle bg-blue-600/[0.02] border-l border-slate-900/50">
                          <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-blue-500 group-hover:scale-110 transition-transform origin-right tracking-tighter">
                              ${" "}
                              {pvp.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <div className="text-[9px] text-slate-600 font-black uppercase mt-1 tracking-widest flex items-center gap-1">
                              Precio Público{" "}
                              <div className="w-1 h-1 rounded-full bg-blue-900" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-5 select-none grayscale animate-pulse">
              <Package size={150} strokeWidth={1} />
              <p className="font-black text-lg tracking-[0.8em] uppercase text-center ml-4">
                Productos
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Scrollbar Custom para Tailwind - Pegar esto en tu index.css */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #020617;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
}

export default App;
