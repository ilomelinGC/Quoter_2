import React, { useState, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import "./App.css";
import { procedures, clinics, treatments } from "./Data.js"; // Import data from data.js
import { TreatmentBuilder } from "./treatmentBuilder";

// ----------------------- DATA -----------------------

function App() {
  // editing === true means the builder overlay is visible.
  // When false, only the summary is visible.
  const [editing, setEditing] = useState(false);

  // For the current treatment selection
  const [treatmentInput, setTreatmentInput] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");

  // The overall treatment plan (array of added treatments)
  const [treatmentPlan, setTreatmentPlan] = useState([]);

  // Step management: 1 = Treatment Plan, 2 = Clinic Selection
  const [step, setStep] = useState(1);

  // Ref for the builder overlay transition
  const builderRef = useRef(null);

  // Handler for updating the treatment input (autocomplete via datalist)
  const handleTreatmentInputChange = (e) => {
    const value = e.target.value;
    setTreatmentInput(value);
    // Check for an exact match (case-insensitive)
    const match = treatments.find(
      (t) => t.name.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      setSelectedTreatmentId(match.id);
    } else {
      setSelectedTreatmentId("");
    }
  };

  // Add the selected treatment to the plan and close the overlay
  const addTreatment = () => {
    if (selectedTreatmentId) {
      const treat = treatments.find((t) => t.id === selectedTreatmentId);
      const newItem = {
        id: treat.id,
        name: treat.name,
        quantity: 1, // Default quantity is 1
      };
      setTreatmentPlan((prev) => [...prev, newItem]);
      // Clear inputs and close the builder overlay
      setTreatmentInput("");
      setSelectedTreatmentId("");
      setEditing(false);
    }
  };

  // Update the quantity of a treatment in the plan
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

  // Remove a treatment from the plan
  const removeTreatment = (index) => {
    setTreatmentPlan((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute the estimated cost for a clinic based on the treatment plan
  const computeClinicCost = (clinic) => {
    let total = 0;
    let missing = [];
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

  // Render the treatment plan summary as a table (quote-style)
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

  // Render the clinic selection cards
  const renderClinicCards = () => {
    return clinics.map((clinic) => {
      const { total, missing } = computeClinicCost(clinic);
      return (
        <div key={clinic.id} className="clinic-card">
          <img
            src={clinic.picture} // Use the image URL from the clinic data
            alt={clinic.name}
            className="clinic-picture"
          />
          <h3>{clinic.name}</h3>
          <p className="clinic-location">{clinic.location}</p>
          <p className="clinic-cost">
            Estimated Total: ${total.toLocaleString()}
          </p>
          {missing.length > 0 && (
            <p className="clinic-warning">Missing: {missing.join(", ")}</p>
          )}
          <div className="badge-container">
            {clinic.highlights.map((badge, idx) => (
              <span key={idx} className="badge">
                {badge}
              </span>
            ))}
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

  const [comparedClinics, setComparedClinics] = useState([]);

  const handleCompareClinic = (clinicId) => {
    setComparedClinics(
      (prev) =>
        prev.includes(clinicId)
          ? prev.filter((id) => id !== clinicId) // Deselect clinic
          : [...prev, clinicId] // Select clinic
    );
  };

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
                return <th key={clinicId}>{clinic.name}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Estimated Total</td>
              {comparedClinics.map((clinicId) => {
                const { total } = computeClinicCost(
                  clinics.find((c) => c.id === clinicId)
                );
                return <td key={clinicId}>${total.toLocaleString()}</td>;
              })}
            </tr>
            <tr>
              <td>Location</td>
              {comparedClinics.map((clinicId) => {
                const clinic = clinics.find((c) => c.id === clinicId);
                return <td key={clinicId}>{clinic.location}</td>;
              })}
            </tr>
            <tr>
              <td>Highlights</td>
              {comparedClinics.map((clinicId) => {
                const clinic = clinics.find((c) => c.id === clinicId);
                return <td key={clinicId}>{clinic.highlights.join(", ")}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  // Engaging copy
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

  return (
    <div className="treatment-app-container">
      {/* Step 1: Treatment Plan Builder */}
      {step === 1 && (
        <>
          {/* Summary Card: Always visible if there's at least one treatment */}
          {treatmentPlan.length > 0 && (
            <div
              className={`treatment-summary-card ${editing ? "grayed" : ""}`}
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

          {/* Builder Overlay: Always rendered when editing is true, or if no treatment added */}
          {(editing || treatmentPlan.length === 0) && (
            <CSSTransition
              in={editing || treatmentPlan.length === 0}
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
                  {/* Show "Back" button only if there are treatments */}
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
          )}
        </>
      )}

      {/* Step 2: Clinic Selection */}
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
    </div>
  );
}

export default App;
