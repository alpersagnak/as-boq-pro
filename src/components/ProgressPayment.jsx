import { useMemo, useState } from "react";
import { useProjects } from "../context/ProjectContext";
import { analyzeBoqRow, formatMoney } from "../utils/calculations";

function previousQuantity(project, paymentId, rowId) {
  const payments = project.progressPayments || [];
  const index = payments.findIndex((item) => item.id === paymentId);
  if (index <= 0) return 0;
  return payments.slice(0, index).reduce(
    (sum, item) => sum + (Number(item.quantities?.[rowId]) || 0),
    0
  );
}

function paymentSummary(project, payment) {
  const rows = project.boqRows || [];
  const gross = rows.reduce((sum, row) => {
    const unitPrice = analyzeBoqRow(row).total;
    const currentQty = Number(payment.quantities?.[row.id]) || 0;
    return sum + currentQty * unitPrice;
  }, 0);

  const previousGross = rows.reduce((sum, row) => {
    const unitPrice = analyzeBoqRow(row).total;
    return sum + previousQuantity(project, payment.id, row.id) * unitPrice;
  }, 0);

  const cumulativeGross = previousGross + gross;
  const retention = gross * ((Number(payment.retentionPercent) || 0) / 100);
  const withholding = gross * ((Number(payment.withholdingPercent) || 0) / 100);
  const advance = Number(payment.advanceDeduction) || 0;
  const other = Number(payment.otherDeduction) || 0;
  const deductions = retention + withholding + advance + other;
  const netBeforeVat = gross - deductions;
  const vat = netBeforeVat * ((Number(payment.vatPercent) || 0) / 100);
  const payable = netBeforeVat + vat;

  return {
    previousGross,
    gross,
    cumulativeGross,
    retention,
    withholding,
    advance,
    other,
    deductions,
    netBeforeVat,
    vat,
    payable,
  };
}

const initialForm = (count = 0) => ({
  number: String(count + 1),
  title: "",
  period: new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
  date: new Date().toISOString().slice(0, 10),
  contractor: "",
  employer: "",
  contractNo: "",
  retentionPercent: 5,
  withholdingPercent: 0,
  advanceDeduction: 0,
  otherDeduction: 0,
  vatPercent: 20,
  notes: "",
});

export default function ProgressPayment({ notify }) {
  const { activeProject, dispatch } = useProjects();
  const payments = activeProject?.progressPayments || [];
  const [selectedId, setSelectedId] = useState(payments.at(-1)?.id || "");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm(payments.length));

  const selected = payments.find((item) => item.id === selectedId) || payments.at(-1);
  const summary = useMemo(
    () => (selected ? paymentSummary(activeProject, selected) : null),
    [activeProject, selected]
  );

  const createPayment = (event) => {
    event.preventDefault();
    if (!activeProject.boqRows.length) {
      notify("warning", "Hakediş oluşturulamadı", "Önce BOQ kalemi ekleyin.");
      return;
    }

    dispatch({
      type: "ADD_PROGRESS_PAYMENT",
      projectId: activeProject.id,
      payload: {
        ...form,
        title: form.title.trim() || `${form.number} No.lu Hakediş`,
      },
    });

    notify("success", "Hakediş oluşturuldu", `${form.number} No.lu hakediş açıldı.`);
    setShowForm(false);
    setSelectedId("");
    setForm(initialForm(payments.length + 1));
  };

  const updatePayment = (patch) => {
    if (!selected) return;
    dispatch({
      type: "UPDATE_PROGRESS_PAYMENT",
      projectId: activeProject.id,
      paymentId: selected.id,
      patch,
    });
  };

  const printPayment = () => {
    document.body.classList.add("printing-payment");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-payment"), 300);
  };

  return (
    <section className="progress-payment-page">
      <div className="toolbar no-print">
        <button type="button" className="primary" onClick={() => setShowForm(true)}>
          + Yeni Hakediş
        </button>
        <select
          className="payment-select"
          value={selected?.id || ""}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {!payments.length && <option value="">Hakediş bulunmuyor</option>}
          {payments.map((payment) => (
            <option key={payment.id} value={payment.id}>
              {payment.number} No.lu — {payment.title}
            </option>
          ))}
        </select>
        {selected && (
          <button type="button" className="secondary" onClick={printPayment}>
            Yazdır / PDF
          </button>
        )}
      </div>

      {!selected ? (
        <article className="placeholder">
          <h2>Henüz hakediş oluşturulmadı</h2>
          <p>BOQ kalemleri üzerinden dönemsel gerçekleşmeleri girin.</p>
          <button type="button" className="primary" onClick={() => setShowForm(true)}>
            İlk Hakedişi Oluştur
          </button>
        </article>
      ) : (
        <div className="payment-print-area">
          <header className="payment-document-title">
            <div>
              <small>A.S BOQ PRO</small>
              <h2>{activeProject.name}</h2>
              <p>{activeProject.code}</p>
            </div>
            <div>
              <span>HAKEDİŞ NO</span>
              <strong>{selected.number}</strong>
            </div>
          </header>

          <article className="payment-header">
            <label>Başlık<input value={selected.title} onChange={(e) => updatePayment({ title: e.target.value })} /></label>
            <label>Dönem<input value={selected.period || ""} onChange={(e) => updatePayment({ period: e.target.value })} /></label>
            <label>Tarih<input type="date" value={selected.date} onChange={(e) => updatePayment({ date: e.target.value })} /></label>
            <label>Taşeron<input value={selected.contractor || ""} onChange={(e) => updatePayment({ contractor: e.target.value })} /></label>
            <label>İşveren<input value={selected.employer || activeProject.client || ""} onChange={(e) => updatePayment({ employer: e.target.value })} /></label>
            <label>Sözleşme No<input value={selected.contractNo || ""} onChange={(e) => updatePayment({ contractNo: e.target.value })} /></label>
            <button
              type="button"
              className="delete-button no-print"
              onClick={() => {
                if (!confirm("Bu hakediş silinsin mi?")) return;
                dispatch({ type: "DELETE_PROGRESS_PAYMENT", projectId: activeProject.id, paymentId: selected.id });
                setSelectedId("");
                notify("success", "Hakediş silindi", "Kayıt kaldırıldı.");
              }}
            >
              Hakedişi Sil
            </button>
          </article>

          <article className="table-card payment-table-card">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Sıra</th><th>Poz</th><th>İş Kalemi</th><th>Birim</th>
                  <th>Söz. Miktarı</th><th>Birim Fiyat</th><th>Önceki</th>
                  <th>Bu Dönem</th><th>Kümülatif</th><th>Kalan</th>
                  <th>Gerçekleşme</th><th>Bu Dönem Tutarı</th>
                </tr>
              </thead>
              <tbody>
                {activeProject.boqRows.map((row, index) => {
                  const contractQty = Number(row.quantity) || 0;
                  const unitPrice = analyzeBoqRow(row).total;
                  const previous = previousQuantity(activeProject, selected.id, row.id);
                  const current = Number(selected.quantities?.[row.id]) || 0;
                  const cumulative = previous + current;
                  const remaining = contractQty - cumulative;
                  const percent = contractQty > 0 ? (cumulative / contractQty) * 100 : 0;
                  const overrun = cumulative > contractQty;

                  return (
                    <tr key={row.id} className={overrun ? "overrun" : ""}>
                      <td>{index + 1}</td>
                      <td className="code-cell">{row.pozNo}</td>
                      <td>{row.description}</td>
                      <td>{row.unit}</td>
                      <td>{contractQty.toLocaleString("tr-TR")}</td>
                      <td>{formatMoney(unitPrice, activeProject.currency)}</td>
                      <td>{previous.toLocaleString("tr-TR")}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={current}
                          onChange={(event) => dispatch({
                            type: "UPDATE_PROGRESS_QUANTITY",
                            projectId: activeProject.id,
                            paymentId: selected.id,
                            rowId: row.id,
                            quantity: event.target.value,
                          })}
                        />
                      </td>
                      <td>{cumulative.toLocaleString("tr-TR")}</td>
                      <td className={remaining < 0 ? "negative" : ""}>{remaining.toLocaleString("tr-TR")}</td>
                      <td>
                        <div className="progress-cell">
                          <div><span style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} /></div>
                          <b>{percent.toFixed(1)}%</b>
                        </div>
                      </td>
                      <td><strong>{formatMoney(current * unitPrice, activeProject.currency)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>

          <section className="payment-settings card">
            <h3>Kesinti ve Vergiler</h3>
            <label>Teminat Kesintisi %<input type="number" min="0" step="0.01" value={selected.retentionPercent || 0} onChange={(e) => updatePayment({ retentionPercent: Number(e.target.value) })} /></label>
            <label>Stopaj %<input type="number" min="0" step="0.01" value={selected.withholdingPercent || 0} onChange={(e) => updatePayment({ withholdingPercent: Number(e.target.value) })} /></label>
            <label>Avans Mahsubu<input type="number" min="0" step="0.01" value={selected.advanceDeduction || 0} onChange={(e) => updatePayment({ advanceDeduction: Number(e.target.value) })} /></label>
            <label>Diğer Kesintiler<input type="number" min="0" step="0.01" value={selected.otherDeduction || 0} onChange={(e) => updatePayment({ otherDeduction: Number(e.target.value) })} /></label>
            <label>KDV %<input type="number" min="0" step="0.01" value={selected.vatPercent || 0} onChange={(e) => updatePayment({ vatPercent: Number(e.target.value) })} /></label>
            <label className="payment-notes">Notlar<textarea value={selected.notes || ""} onChange={(e) => updatePayment({ notes: e.target.value })} /></label>
          </section>

          <section className="payment-summary">
            <Summary label="Önceki Hakedişler" value={summary.previousGross} currency={activeProject.currency} />
            <Summary label="Bu Dönem Brüt" value={summary.gross} currency={activeProject.currency} />
            <Summary label="Kümülatif Brüt" value={summary.cumulativeGross} currency={activeProject.currency} />
            <Summary label="Teminat" value={-summary.retention} currency={activeProject.currency} />
            <Summary label="Stopaj" value={-summary.withholding} currency={activeProject.currency} />
            <Summary label="Avans" value={-summary.advance} currency={activeProject.currency} />
            <Summary label="Diğer Kesintiler" value={-summary.other} currency={activeProject.currency} />
            <Summary label="Kesintiler Toplamı" value={-summary.deductions} currency={activeProject.currency} />
            <Summary label="KDV" value={summary.vat} currency={activeProject.currency} />
            <Summary label="Ödenecek Net" value={summary.payable} currency={activeProject.currency} primary />
          </section>

          <footer className="payment-signatures">
            <div><span>Hazırlayan</span><b>İmza</b></div>
            <div><span>Kontrol</span><b>İmza</b></div>
            <div><span>Onay</span><b>İmza</b></div>
          </footer>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <form className="modal payment-modal" onSubmit={createPayment} onMouseDown={(e) => e.stopPropagation()}>
            <h2>Yeni Hakediş</h2>
            <div className="form-grid">
              <label>Hakediş No<input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></label>
              <label>Tarih<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
              <label>Dönem<input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></label>
              <label>Sözleşme No<input value={form.contractNo} onChange={(e) => setForm({ ...form, contractNo: e.target.value })} /></label>
            </div>
            <label>Başlık<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={`${form.number} No.lu Hakediş`} /></label>
            <div className="form-grid">
              <label>Taşeron<input value={form.contractor} onChange={(e) => setForm({ ...form, contractor: e.target.value })} /></label>
              <label>İşveren<input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} /></label>
              <label>Teminat %<input type="number" value={form.retentionPercent} onChange={(e) => setForm({ ...form, retentionPercent: e.target.value })} /></label>
              <label>Stopaj %<input type="number" value={form.withholdingPercent} onChange={(e) => setForm({ ...form, withholdingPercent: e.target.value })} /></label>
              <label>KDV %<input type="number" value={form.vatPercent} onChange={(e) => setForm({ ...form, vatPercent: e.target.value })} /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Vazgeç</button>
              <button type="submit" className="primary">Hakedişi Oluştur</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function Summary({ label, value, currency, primary }) {
  return (
    <article className={primary ? "summary-card primary-summary" : "summary-card"}>
      <span>{label}</span>
      <strong>{formatMoney(value, currency)}</strong>
    </article>
  );
}
