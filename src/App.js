import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  // Declare all hooks unconditionally.
  const [editing, setEditing] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treatmentInput, setTreatmentInput] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState([]);
  const [step, setStep] = useState(1);
  const [comparedClinics, setComparedClinics] = useState([]);
  const builderRef = useRef(null);
  const [typedText, setTypedText] = useState("");
  const [filteredTreatments, setFilteredTreatments] = useState(treatments);
  const effectiveEditing = treatmentPlan.length === 0 ? true : editing;

  // Handler for changes in the autocomplete text field
const handleAutocompleteChange = (e) => {
  const value = e.target.value;
  setTypedText(value);

  // Filter treatments by typed text
  if (!value) {
    // If empty, show all
    setFilteredTreatments(treatments);
    setSelectedTreatmentId("");
  } else {
    const lowerValue = value.toLowerCase();
    const filtered = treatments.filter((t) =>
      t.name.toLowerCase().includes(lowerValue)
    );
    setFilteredTreatments(filtered);

    // If there's an exact match, select it; otherwise, clear
    const exactMatch = filtered.find(
      (t) => t.name.toLowerCase() === lowerValue
    );
    setSelectedTreatmentId(exactMatch ? exactMatch.id : "");
  }
};

// Handler for when the user clicks a treatment in the list
const handleSelectTreatment = (t) => {
  setTypedText(t.name);
  setSelectedTreatmentId(t.id);
};

  // UI text constants.
  const builderCopy = {
    headline: "Add a Treatment",
    subheading:
      "Enter the treatment you need and tap 'Add Treatment' to add it to your plan.",
  };
  const summaryCopy = {
    headline: "Your Customized Treatment Plan",
    subheading:
      "Review the treatments you've added below. You can add more treatments or proceed to select the clinic that best suits your needs.",
  };
  const clinicCopy = {
    headline: "Select a Clinic",
    subheading:
      "Choose the clinic that best fits your needs. Estimated costs are based on your treatment plan.",
  };

  // Fetch data from the Netlify function.
  useEffect(() => {
    fetch("https://fantastic-beijinho-92131c.netlify.app/.netlify/functions/getData")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        setClinics(data.clinics);
        setTreatments(data.treatments);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  // Handler for treatment input changes.
  const handleTreatmentInputChange = (e) => {
    const value = e.target.value;
    setTreatmentInput(value);
    const match = treatments.find(
      (t) => t.name.toLowerCase() === value.toLowerCase()
    );
    setSelectedTreatmentId(match ? match.id : "");
  };

  // Add a treatment to the plan.
  const addTreatment = () => {
    if (selectedTreatmentId) {
      const treat = treatments.find((t) => t.id === selectedTreatmentId);
      const newItem = { id: treat.id, name: treat.name, quantity: 1 };
      setTreatmentPlan((prev) => [...prev, newItem]);
      setTreatmentInput("");
      setSelectedTreatmentId("");
      setEditing(false);
    }
  };

  // Update treatment quantity.
  const updateQuantity = (index, newQuantity) => {
    const treat = treatmentPlan[index];
    const maxUnits = treatments.find((t) => t.id === treat.id).maxUnits;
    if (newQuantity >= 1 && newQuantity <= maxUnits) {
      const updatedPlan = treatmentPlan.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      );
      setTreatmentPlan(updatedPlan);
    } else {
      alert(`Quantity must be between 1 and ${maxUnits} for ${treat.name}.`);
    }
  };

  // Remove a treatment from the plan.
  const removeTreatment = (index) => {
    setTreatmentPlan((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute the estimated cost for a clinic.
  const computeClinicCost = (clinic) => {
    let total = 0;
    let missing = [];
    if (!clinic.procedurePricing) {
      return { total: 0, missing: treatmentPlan.map((item) => item.name) };
    }
    treatmentPlan.forEach((item) => {
      const price = clinic.procedurePricing[item.id];
      if (price && price > 0) {
        total += item.quantity * price;
      } else {
        missing.push(item.name);
      }
    });
    return { total, missing };
  };

  // Render the treatment plan summary.
  const renderPlanSummary = () => {
    if (treatmentPlan.length === 0) {
      return <p className="empty-summary">No treatments added yet.</p>;
    }
    return (
      <table className="plan-summary-table">
        <thead>
          <tr>
            <th>Treatment</th>
            <th>Units</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {treatmentPlan.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  max={treatments.find((t) => t.id === item.id).maxUnits}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(index, Number(e.target.value))
                  }
                  className="quantity-input"
                />
              </td>
              <td>
                <button
                  className="btn secondary"
                  onClick={() => removeTreatment(index)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render clinic cards.
  const renderClinicCards = () => {
    return clinics.map((clinic) => {
      console.log("Rendering clinic:", clinic);
      const { total, missing } = computeClinicCost(clinic);
      return (
        <div key={clinic.id} className="clinic-card">
          <img
            src={clinic.picture || "https://via.placeholder.com/150x100?text=No+Image"}
            alt={clinic.name || clinic["Clinic Name"] || "Clinic"}
            className="clinic-picture"
          />
          <h3>{clinic.name || clinic["Clinic Name"] || "No Name"}</h3>
          <p className="clinic-location">
            {clinic.location || clinic["Location"] || "No Location"}
          </p>
          <p className="clinic-cost">
            Estimated Total: ${total.toLocaleString()}
          </p>
          {missing.length > 0 && (
            <p className="clinic-warning">Missing: {missing.join(", ")}</p>
          )}
          <div className="badge-container">
            {Array.isArray(clinic.highlights) ? (
              clinic.highlights.map((badge, idx) => (
                <span key={idx} className="badge">
                  {badge}
                </span>
              ))
            ) : clinic.highlights ? (
              <span className="badge">{clinic.highlights}</span>
            ) : null}
          </div>
          <label className="compare-checkbox">
            <input
              type="checkbox"
              onChange={() => handleCompareClinic(clinic.id)}
            />
            Compare
          </label>
          <button className="btn accent">Select Clinic</button>
        </div>
      );
    });
  };

  // Handle clinic comparison selection.
  const handleCompareClinic = (clinicId) => {
    setComparedClinics((prev) =>
      prev.includes(clinicId)
        ? prev.filter((id) => id !== clinicId)
        : [...prev, clinicId]
    );
  };

  // Render the comparison view.
  const renderComparisonView = () => {
    if (comparedClinics.length < 2) {
      return <p>Select at least 2 clinics to compare.</p>;
    }
    return (
      <div className="comparison-view">
        <h3>Compare Clinics</h3>
        <table>
          <thead>
            <tr>
              <th>Clinic</th>
              {comparedClinics.map((clinicId) => {
                const clinic = clinics.find((c) => c.id === clinicId);
                return (
                  <th key={clinicId}>
                    {clinic
                      ? clinic.name || clinic["Clinic Name"] || "Unknown Clinic"
                      : "Unknown Clinic"}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Estimated Total</td>
              {comparedClinics.map((clinicId) => {
                const clinic = clinics.find((c) => c.id === clinicId);
                const { total } = clinic ? computeClinicCost(clinic) : { total: 0 };
                return <td key={clinicId}>${total.toLocaleString()}</td>;
              })}
            </tr>
            <tr>
              <td>Location</td>
              {comparedClinics.map((clinicId) => {
                const clinic = clinics.find((c) => c.id === clinicId);
                return (
                  <td key={clinicId}>
                    {clinic
                      ? clinic.location || clinic["Location"] || "No Location"
                      : "No Location"}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td>Highlights</td>
              {comparedClinics.map((clinicId) => {
                const clinic = clinics.find((c) => c.id === clinicId);
                return (
                  <td key={clinicId}>
                    {clinic && clinic.highlights
                      ? Array.isArray(clinic.highlights)
                        ? clinic.highlights.join(", ")
                        : clinic.highlights
                      : "No highlights"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Return the full component tree.


  return (
    <div className="treatment-app-container">
      {loading ? (
        <div>Loading data from Airtable...</div>
      ) : (
        <>
          {step === 1 && (
            <>
              {treatmentPlan.length > 0 && (
                <div
                  className={`treatment-summary-card ${
                    editing ? "grayed" : ""
                  }`}
                >
                  <h2>{summaryCopy.headline}</h2>
                  <p>{summaryCopy.subheading}</p>
                  {renderPlanSummary()}
                  <div className="summary-actions">
                    <button
                      className="btn secondary"
                      onClick={() => setEditing(true)}
                    >
                      Add Treatment
                    </button>
                    <button className="btn accent" onClick={() => setStep(2)}>
                      Select Clinic
                    </button>
                  </div>
                </div>
              )}

              {/* Builder Overlay with CSSTransition */}
              <CSSTransition
                in={effectiveEditing}
                timeout={300}
                classNames="fade-slide"
                unmountOnExit
                nodeRef={builderRef}
              >
                <div className="treatment-card overlay" ref={builderRef}>
                  <h2>{builderCopy.headline}</h2>
                  <p>{builderCopy.subheading}</p>
                  <div className="form-group">
                    <label htmlFor="treatment-input">Treatment</label>
                    <input
                      id="treatment-input"
                      type="text"
                      list="treatments-list"
                      value={treatmentInput}
                      onChange={handleTreatmentInputChange}
                      placeholder="Start typing..."
                      className="autocomplete-input"
                    />
                    <datalist id="treatments-list">
                      {treatments.map((t) => (
                        <option key={t.id} value={t.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group inline">
                    {treatmentPlan.length > 0 && (
                      <button
                        className="btn secondary"
                        onClick={() => setEditing(false)}
                      >
                        Back
                      </button>
                    )}
                    {selectedTreatmentId && (
                      <button className="btn primary" onClick={addTreatment}>
                        Add Treatment
                      </button>
                    )}
                  </div>
                </div>
              </CSSTransition>
            </>
          )}

          {step === 2 && (
            <div className="clinic-selection">
              <h2>{clinicCopy.headline}</h2>
              <p>{clinicCopy.subheading}</p>
              <div className="clinic-cards">{renderClinicCards()}</div>
              <div className="summary-actions">
                <button className="btn secondary" onClick={() => setStep(1)}>
                  Back to Treatment Plan
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;