import React, { useState, useRef } from "react";
import { CSSTransition } from "react-transition-group";

// Note: We removed the import from "./Data".
// Treatments are now received via props.
const TreatmentBuilder = ({ treatments, treatmentPlan, setTreatmentPlan }) => {
  // State to manage whether the treatment builder overlay is open.
  const [editing, setEditing] = useState(false);

  // State for the treatment selection input.
  const [treatmentInput, setTreatmentInput] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");

  // Reference for the builder overlay transition.
  const builderRef = useRef(null);

  // Handle input changes: check if the input exactly matches a treatment name.
  const handleTreatmentInputChange = (e) => {
    const value = e.target.value;
    setTreatmentInput(value);
    // Find an exact match (case-insensitive)
    const match = treatments.find(
      (t) => t.name.toLowerCase() === value.toLowerCase()
    );
    setSelectedTreatmentId(match ? match.id : "");
  };

  // Function to add the selected treatment to the treatment plan.
  const addTreatment = () => {
    if (selectedTreatmentId) {
      const treat = treatments.find((t) => t.id === selectedTreatmentId);
      const newItem = {
        id: treat.id,
        name: treat.name,
        quantity: 1, // Default quantity
      };

      // Add the new treatment to the plan.
      setTreatmentPlan((prev) => [...prev, newItem]);

      // Reset input and close the builder overlay.
      setTreatmentInput("");
      setSelectedTreatmentId("");
      setEditing(false);
    }
  };

  return (
    <>
      {/* Button to open the treatment builder */}
      <button className="btn secondary" onClick={() => setEditing(true)}>
        Add Treatment
      </button>

      {/* Overlay for selecting a treatment */}
      <CSSTransition
        in={editing || treatmentPlan.length === 0}
        timeout={300}
        classNames="fade-slide"
        unmountOnExit
        nodeRef={builderRef}
      >
        <div className="treatment-card overlay" ref={builderRef}>
          <h2>Add a Treatment</h2>
          <p>Enter the treatment you need and tap 'Add Treatment' to add it to your plan.</p>

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
            {/* Show "Back" button only if there are treatments in the plan */}
            {treatmentPlan.length > 0 && (
              <button
                className="btn secondary"
                onClick={() => setEditing(false)}
              >
                Back
              </button>
            )}
            {/* Show "Add Treatment" button if a valid treatment is selected */}
            {selectedTreatmentId && (
              <button className="btn primary" onClick={addTreatment}>
                Add Treatment
              </button>
            )}
          </div>
        </div>
      </CSSTransition>
    </>
  );
};

export default TreatmentBuilder;