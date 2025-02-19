import React, { useState, useEffect, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import "./App.css";

function App() {
  /********************************************************
   *                 STATE DECLARATIONS
   ********************************************************/
  const [editing, setEditing] = useState(false);       // Overlay editing mode
  const [clinics, setClinics] = useState([]);            // List of clinics
  const [treatments, setTreatments] = useState([]);      // List of treatments
  const [loading, setLoading] = useState(true);          // Loading state

  // Autocomplete state
  const [typedText, setTypedText] = useState("");        // The user’s typed text
  const [filteredTreatments, setFilteredTreatments] = useState([]); 
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");

  // Treatment Plan
  const [treatmentPlan, setTreatmentPlan] = useState([]);

  // Step management: 1 = Plan Builder, 2 = Clinic Selection
  const [step, setStep] = useState(1);

  // Compare Clinics
  const [comparedClinics, setComparedClinics] = useState([]);

  // Create a ref for the overlay to avoid findDOMNode calls.
  const overlayRef = useRef(null);

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

  /********************************************************
   *                 FETCH DATA ON MOUNT
   ********************************************************/
  useEffect(() => {
    fetch("https://fantastic-beijinho-92131c.netlify.app/.netlify/functions/getData")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        setClinics(data.clinics || []);
        setTreatments(data.treatments || []);
        // By default, show all treatments in the filtered list.
        setFilteredTreatments(data.treatments || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  /********************************************************
   *            AUTOCOMPLETE HANDLERS & LOGIC
   ********************************************************/
  const handleAutocompleteChange = (e) => {
    const value = e.target.value;
    setTypedText(value);

    if (!value) {
      setFilteredTreatments(treatments);
      setSelectedTreatmentId("");
    } else {
      const lowerValue = value.toLowerCase();
      const filtered = treatments.filter((t) =>
        t.name.toLowerCase().includes(lowerValue)
      );
      setFilteredTreatments(filtered);

      const exactMatch = filtered.find(
        (t) => t.name.toLowerCase() === lowerValue
      );
      setSelectedTreatmentId(exactMatch ? exactMatch.id : "");
    }
  };

  const handleSelectTreatment = (treatmentObj) => {
    setTypedText(treatmentObj.name);
    setSelectedTreatmentId(treatmentObj.id);
  };

  /********************************************************
   *                TREATMENT PLAN LOGIC
   ********************************************************/
  const addTreatment = () => {
    if (selectedTreatmentId) {
      const treat = treatments.find((t) => t.id === selectedTreatmentId);
      if (treat) {
        const newItem = { id: treat.id, name: treat.name, quantity: 1 };
        setTreatmentPlan((prev) => [...prev, newItem]);
      }
      // Reset typed text and selection.
      setTypedText("");
      setSelectedTreatmentId("");
      setEditing(false);
    }
  };

  const updateQuantity = (index, newQuantity) => {
    const item = treatmentPlan[index];
    const maxUnits = treatments.find((t) => t.id === item.id)?.maxUnits || 1;
    if (newQuantity >= 1 && newQuantity <= maxUnits) {
      const updatedPlan = treatmentPlan.map((it, i) =>
        i === index ? { ...it, quantity: newQuantity } : it
      );
      setTreatmentPlan(updatedPlan);
    } else {
      alert(`Quantity must be between 1 and ${maxUnits} for ${item.name}.`);
    }
  };

  const removeTreatment = (index) => {
    setTreatmentPlan((prev) => prev.filter((_, i) => i !== index));
  };

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
          {treatmentPlan.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  max={treatments.find((t) => t.id === item.id)?.maxUnits || 1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(idx, Number(e.target.value))
                  }
                  className="quantity-input"
                />
              </td>
              <td>
                <button
                  className="btn secondary"
                  onClick={() => removeTreatment(idx)}
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

  /********************************************************
   *               CLINIC LOGIC & RENDERING
   ********************************************************/
  const computeClinicCost = (clinic) => {
    let total = 0;
    let missing = [];
    if (!clinic.procedurePricing) {
      return { total: 0, missing: treatmentPlan.map((it) => it.name) };
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

  const renderClinicCards = () => {
    return clinics.map((clinic) => {
      const { total, missing } = computeClinicCost(clinic);
      return (
        <div key={clinic.id} className="clinic-card">
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
          {/* Additional compare/select UI can be added here */}
        </div>
      );
    });
  };

  const handleCompareClinic = (clinicId) => {
    setComparedClinics((prev) =>
      prev.includes(clinicId)
        ? prev.filter((id) => id !== clinicId)
        : [...prev, clinicId]
    );
  };

  // Force overlay open if no treatment has been added
  const effectiveEditing = treatmentPlan.length === 0 ? true : editing;

  /********************************************************
   *                   RENDER RETURN
   ********************************************************/
  return (
    <div className="treatment-app-container">
      {loading ? (
        <div>Loading data from Airtable...</div>
      ) : (
        <>
          {/* STEP 1: Treatment Plan Builder */}
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
                    <button
                      className="btn accent"
                      onClick={() => setStep(2)}
                    >
                      Select Clinic
                    </button>
                  </div>
                </div>
              )}

              {/* Builder Overlay with CSSTransition and nodeRef */}
              <CSSTransition
                in={effectiveEditing}
                timeout={300}
                classNames="fade-slide"
                unmountOnExit
                nodeRef={overlayRef}
              >
                <div className="treatment-card overlay" ref={overlayRef}>
                  <h2>{builderCopy.headline}</h2>
                  <p>{builderCopy.subheading}</p>

                  {/* Autocomplete text field */}
                  <div className="form-group">
                    <label htmlFor="treatment-search">Treatment</label>
                    <input
                      id="treatment-search"
                      type="text"
                      placeholder="Search or select a treatment..."
                      value={typedText}
                      onChange={handleAutocompleteChange}
                      className="autocomplete-input"
                    />
                  </div>

                  {/* Filtered Treatment List */}
                  {filteredTreatments.length > 0 ? (
                    <div className="autocomplete-list">
                      {filteredTreatments.map((t) => (
                        <div
                          key={t.id}
                          className={`autocomplete-item ${
                            selectedTreatmentId === t.id ? "selected" : ""
                          }`}
                          onClick={() => {
                            setTypedText(t.name);
                            setSelectedTreatmentId(t.id);
                          }}
                        >
                          {t.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-matches">No matching treatments</p>
                  )}

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

          {/* STEP 2: Clinic Selection */}
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