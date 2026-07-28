import { useEffect, useMemo, useState } from "react";
import { POZ_LIBRARY } from "../data/pozLibrary";
import { useProjects } from "../context/ProjectContext";
import { normalizeText } from "../utils/calculations";
import { disciplineLabel, inferDiscipline } from "../data/disciplines";

const FAVORITES_KEY = "asBoqProV41Favorites";

export default function PozLibrary({ onNavigate, notify }) {
  const { activeProject, activeDiscipline, dispatch } = useProjects();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [category, setCategory] = useState("Tümü");
  const [type, setType] = useState("Tümü");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const categories = useMemo(
    () => ["Tümü", ...Array.from(new Set(POZ_LIBRARY.map((x) => x.kategori).filter(Boolean))).sort()],
    []
  );

  const types = useMemo(
    () => ["Tümü", ...Array.from(new Set(POZ_LIBRARY.map((x) => x.tur).filter(Boolean))).sort()],
    []
  );

  const results = useMemo(() => {
    const query = normalizeText(search);
    return POZ_LIBRARY.filter((item) => {
      const searchMatch =
        !query ||
        normalizeText(
          `${item.pozNo} ${item.isKalemi} ${item.birim} ${item.tur} ${item.kategori}`
        ).includes(query);
      const categoryMatch = category === "Tümü" || item.kategori === category;
      const typeMatch = type === "Tümü" || item.tur === type;
      const favoriteMatch = !favoritesOnly || favorites.includes(item.pozNo);
      const itemDiscipline = item.discipline || inferDiscipline(item);
      const disciplineMatch = activeDiscipline === "all" || itemDiscipline === activeDiscipline;
      return searchMatch && categoryMatch && typeMatch && favoriteMatch && disciplineMatch;
    });
  }, [search, category, type, favoritesOnly, favorites, activeDiscipline]);

  const visiblePozNos = results.slice(0, 300).map((item) => item.pozNo);
  const allVisibleSelected =
    visiblePozNos.length > 0 &&
    visiblePozNos.every((pozNo) => selected.includes(pozNo));

  const existingPozNos = useMemo(
    () => new Set((activeProject?.boqRows || []).map((row) => row.pozNo)),
    [activeProject]
  );

  const addOne = (item) => {
    if (existingPozNos.has(item.pozNo)) {
      notify("warning", "Poz zaten BOQ'da", `${item.pozNo} tekrar eklenmedi.`);
      return;
    }

    dispatch({
      type: "ADD_BOQ_ROW",
      projectId: activeProject.id,
      item: { ...item, discipline: item.discipline || inferDiscipline(item) },
    });

    notify("success", "BOQ'ya eklendi", `${item.pozNo} — ${item.isKalemi}`);
  };

  const addSelected = () => {
    const selectedItems = POZ_LIBRARY.filter((item) =>
      selected.includes(item.pozNo)
    );
    const newItems = selectedItems.filter(
      (item) => !existingPozNos.has(item.pozNo)
    );
    const skipped = selectedItems.length - newItems.length;

    if (!newItems.length) {
      notify(
        "warning",
        "Eklenecek yeni poz bulunamadı",
        skipped ? `${skipped} poz BOQ'da zaten mevcut.` : "Önce poz seçin."
      );
      return;
    }

    dispatch({
      type: "ADD_BOQ_ROWS",
      projectId: activeProject.id,
      items: newItems.map((item) => ({ ...item, discipline: item.discipline || inferDiscipline(item) })),
    });

    notify(
      "success",
      `${newItems.length} poz BOQ'ya eklendi`,
      skipped ? `${skipped} mükerrer poz atlandı.` : "Toplu ekleme tamamlandı."
    );
    setSelected([]);
  };

  const toggleAllVisible = () => {
    setSelected((current) =>
      allVisibleSelected
        ? current.filter((pozNo) => !visiblePozNos.includes(pozNo))
        : Array.from(new Set([...current, ...visiblePozNos]))
    );
  };

  const toggleFavorite = (pozNo) => {
    setFavorites((current) =>
      current.includes(pozNo)
        ? current.filter((value) => value !== pozNo)
        : [...current, pozNo]
    );
  };

  return (
    <>
      <div className="discipline-banner"><strong>{disciplineLabel(activeDiscipline)}</strong><span> ekibinin iş kapsamındaki pozlar gösteriliyor.</span></div>
      <div className="library-filters">
        <input
          className="search-input"
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Poz no veya iş kalemi ara..."
        />

        <select value={type} onChange={(event) => setType(event.target.value)}>
          {types.map((value) => <option key={value}>{value}</option>)}
        </select>

        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((value) => <option key={value}>{value}</option>)}
        </select>

        <button
          type="button"
          className={favoritesOnly ? "tab active" : "tab"}
          onClick={() => setFavoritesOnly((value) => !value)}
        >
          ★ Favoriler ({favorites.length})
        </button>
      </div>

      <div className="selection-bar">
        <label className="select-all">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
          />
          Görünenlerin tümünü seç
        </label>

        <strong>{selected.length} poz seçildi</strong>

        <button type="button" className="primary" onClick={addSelected}>
          Seçilenleri BOQ'ya Ekle
        </button>

        <button
          type="button"
          className="secondary"
          disabled={!selected.length}
          onClick={() => setSelected([])}
        >
          Seçimi Temizle
        </button>
      </div>

      <article className="table-card">
        <table>
          <thead>
            <tr>
              <th>★</th><th>Seç</th><th>Poz No</th><th>İş Kalemi</th>
              <th>Birim</th><th>Disiplin</th><th>Tür</th><th>Kategori</th><th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 300).map((item) => {
              const exists = existingPozNos.has(item.pozNo);
              return (
                <tr
                  key={item.pozNo}
                  className={exists ? "already-added" : ""}
                  onDoubleClick={() => addOne(item)}
                  title="Çift tıklayarak BOQ'ya ekleyebilirsiniz"
                >
                  <td>
                    <button
                      type="button"
                      className={favorites.includes(item.pozNo) ? "star active" : "star"}
                      onClick={() => toggleFavorite(item.pozNo)}
                    >
                      ★
                    </button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(item.pozNo)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, item.pozNo]
                            : current.filter((value) => value !== item.pozNo)
                        )
                      }
                    />
                  </td>
                  <td className="code-cell">{item.pozNo}</td>
                  <td>{item.isKalemi}</td>
                  <td>{item.birim}</td>
                  <td>{disciplineLabel(item.discipline || inferDiscipline(item))}</td>
                  <td>{item.tur}</td>
                  <td>{item.kategori}</td>
                  <td>
                    <button
                      type="button"
                      className={exists ? "small-disabled" : "small-primary"}
                      disabled={exists}
                      onClick={() => addOne(item)}
                    >
                      {exists ? "BOQ'da Mevcut" : "BOQ'ya Ekle"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </article>

      {results.length > 300 && (
        <p className="result-note">
          Performans için ilk 300 sonuç gösteriliyor. Arama ve filtre kullanarak daraltın.
        </p>
      )}
    </>
  );
}
